// gemini-cv-builder/src/services/geminiService.js

import { GoogleGenerativeAI } from '@google/genai';

const GEMINI_TEXT_MODEL = 'gemini-1.5-flash';

let genAI = null;

const initializeGeminiAI = () => {
    if (!genAI && window.gcbConfig && window.gcbConfig.apiKey) {
        genAI = new GoogleGenerativeAI(window.gcbConfig.apiKey);
    }
    return genAI;
};

const systemInstructions = `You are a professional CV/Resume writing expert. Your task is to help create compelling, ATS-friendly CV content.
When generating content:
- Use clear, concise, and professional language
- Include relevant keywords for the industry
- Focus on achievements and measurable results
- Use action verbs at the beginning of bullet points
- Keep the tone professional but engaging
- Ensure all content is truthful and realistic`;

const prompts = {
    initial_cv_from_title: (jobTitle) => `Create a complete professional CV for someone seeking a position as a ${jobTitle}. Include:
    1. A professional summary (2-3 sentences)
    2. 2-3 relevant work experience entries with company names, dates, and 3-4 bullet points each
    3. Educational background
    4. Relevant skills categorized appropriately
    
    Make it realistic and professional. Use placeholder names for companies if needed.`,
    
    initial_cv_from_job_description: (jobDescription) => `Based on this job description, create a tailored CV that would be ideal for this position:
    
    ${jobDescription}
    
    Include all sections of a professional CV, making sure to incorporate relevant keywords and requirements from the job description.`,
    
    summary: (keywords, context) => `Write a professional summary for a CV. ${keywords ? `Focus on these aspects: ${keywords}` : ''}
    ${context.existingCV ? `Current role: ${context.existingCV.personalInfo.title}` : ''}
    Keep it to 2-3 impactful sentences.`,
    
    experience_responsibilities: (keywords, context) => `Generate 3-5 bullet points for work experience responsibilities.
    Job Title: ${context.jobTitle || 'Not specified'}
    Company: ${context.company || 'Not specified'}
    ${keywords ? `Focus on: ${keywords}` : ''}
    
    Start each bullet with an action verb and include measurable achievements where possible.`,
    
    education_details: (keywords, context) => `Generate 2-4 relevant details for education section.
    Degree: ${context.degree || 'Not specified'}
    Institution: ${context.institution || 'Not specified'}
    ${keywords ? `Include: ${keywords}` : ''}
    
    Consider including GPA (if impressive), relevant coursework, honors, or activities.`,
    
    skill_suggestions: (keywords, context) => `Suggest 5-8 relevant skills for the category: ${context.skillCategory || keywords}
    
    List only the skill names, separated by commas. Be specific and industry-relevant.`,
    
    new_experience_entry: (jobTitle, context) => `Create a complete work experience entry for a ${jobTitle} position.
    
    Include:
    - Company name (use a realistic placeholder)
    - Location
    - Start and end dates (recent and realistic)
    - 3-4 impactful responsibility bullet points
    
    Make it consistent with the existing CV experience level.`,
    
    tailor_cv_to_job_description: (jobDescription, context) => `Analyze this job description and tailor the CV accordingly:
    
    Job Description:
    ${jobDescription}
    
    Current CV Summary:
    ${context.existingCV.summary}
    
    Please provide:
    1. An updated summary that incorporates key requirements from the job
    2. Updated skill categories that match job requirements
    3. For each experience entry, suggest updated bullet points that highlight relevant achievements
    ${context.applyDetailedExperienceUpdates ? '4. Suggest any job title adjustments or new experience entries if needed' : ''}
    
    Maintain truthfulness while emphasizing relevant experience.`
};

export async function generateCVContent(generationType, promptValue, context = {}) {
    // First, validate with WordPress backend
    if (window.gcbConfig && window.gcbConfig.ajaxUrl) {
        const formData = new FormData();
        formData.append('action', 'gcb_generate_content');
        formData.append('nonce', window.gcbConfig.nonce);
        formData.append('generation_type', generationType);
        formData.append('prompt', promptValue);
        formData.append('context', JSON.stringify(context));
        
        try {
            const response = await fetch(window.gcbConfig.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.data.message || 'Rate limit exceeded');
            }
        } catch (error) {
            throw new Error('Failed to validate request: ' + error.message);
        }
    }
    
    // Continue with the original Gemini API call
    const ai = initializeGeminiAI();
    if (!ai) {
        throw new Error('Gemini API key not configured. Please check your WordPress settings.');
    }
    
    const model = ai.getGenerativeModel({ 
        model: GEMINI_TEXT_MODEL,
        systemInstruction: systemInstructions,
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        },
    });
    
    let prompt = '';
    
    // Build the appropriate prompt based on generation type
    switch (generationType) {
        case 'initial_cv_from_title':
            prompt = prompts.initial_cv_from_title(promptValue);
            break;
            
        case 'initial_cv_from_job_description':
            prompt = prompts.initial_cv_from_job_description(promptValue);
            break;
            
        case 'summary':
            prompt = prompts.summary(promptValue, context);
            break;
            
        case 'experience_responsibilities':
            prompt = prompts.experience_responsibilities(promptValue, context);
            break;
            
        case 'education_details':
            prompt = prompts.education_details(promptValue, context);
            break;
            
        case 'skill_suggestions':
            prompt = prompts.skill_suggestions(promptValue, context);
            break;
            
        case 'new_experience_entry':
            prompt = prompts.new_experience_entry(promptValue, context);
            break;
            
        case 'tailor_cv_to_job_description':
            prompt = prompts.tailor_cv_to_job_description(promptValue, context);
            break;
            
        default:
            throw new Error(`Unknown generation type: ${generationType}`);
    }
    
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the response based on generation type
        return parseGeminiResponse(generationType, text, context);
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('Failed to generate content. Please try again.');
    }
}

function parseGeminiResponse(generationType, responseText, context) {
    try {
        switch (generationType) {
            case 'initial_cv_from_title':
            case 'initial_cv_from_job_description':
                return parseFullCV(responseText);
                
            case 'summary':
                return responseText.trim();
                
            case 'experience_responsibilities':
            case 'education_details':
                return parseListItems(responseText);
                
            case 'skill_suggestions':
                return responseText.split(',').map(skill => skill.trim()).filter(Boolean);
                
            case 'new_experience_entry':
                return parseExperienceEntry(responseText);
                
            case 'tailor_cv_to_job_description':
                return parseTailoredCV(responseText, context);
                
            default:
                return responseText;
        }
    } catch (error) {
        console.error('Error parsing Gemini response:', error);
        throw new Error('Failed to parse generated content. Please try again.');
    }
}

function parseFullCV(text) {
    // This is a simplified parser - you might need to make it more robust
    const cv = {
        personalInfo: {
            name: 'Your Name',
            title: extractBetween(text, 'Title:', '\n') || 'Professional Title',
            email: 'email@example.com',
            phone: '(555) 123-4567',
            linkedin: 'linkedin.com/in/yourname',
            github: '',
            portfolio: '',
            address: 'City, State',
            showPhone: true,
            showEmail: true,
            showLinkedin: true,
            showGithub: false,
            showPortfolio: false,
            showAddress: true,
            showPortrait: false,
            portraitUrl: ''
        },
        summary: extractSection(text, 'Summary', 'Experience') || '',
        experience: parseExperienceSection(text),
        education: parseEducationSection(text),
        skills: parseSkillsSection(text)
    };
    
    return cv;
}

function parseExperienceSection(text) {
    const experienceSection = extractSection(text, 'Experience', 'Education');
    if (!experienceSection) return [];
    
    const entries = [];
    const entryBlocks = experienceSection.split(/\n\n+/);
    
    for (const block of entryBlocks) {
        if (block.trim()) {
            const lines = block.trim().split('\n');
            if (lines.length >= 2) {
                const entry = {
                    id: crypto.randomUUID(),
                    jobTitle: lines[0].trim(),
                    company: lines[1].split('|')[0].trim(),
                    location: lines[1].split('|')[1]?.trim() || 'Location',
                    startDate: extractDates(lines[2])?.[0] || 'Start Date',
                    endDate: extractDates(lines[2])?.[1] || 'Present',
                    responsibilities: lines.slice(3).filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
                        .map(l => l.replace(/^[-•]\s*/, '').trim())
                };
                if (entry.responsibilities.length > 0) {
                    entries.push(entry);
                }
            }
        }
    }
    
    return entries;
}

function parseEducationSection(text) {
    const educationSection = extractSection(text, 'Education', 'Skills');
    if (!educationSection) return [];
    
    const entries = [];
    const entryBlocks = educationSection.split(/\n\n+/);
    
    for (const block of entryBlocks) {
        if (block.trim()) {
            const lines = block.trim().split('\n');
            if (lines.length >= 2) {
                const entry = {
                    id: crypto.randomUUID(),
                    degree: lines[0].trim(),
                    institution: lines[1].split('|')[0].trim(),
                    location: lines[1].split('|')[1]?.trim() || 'Location',
                    graduationDate: lines[2]?.trim() || 'Graduation Date',
                    details: lines.slice(3).filter(l => l.trim())
                        .map(l => l.replace(/^[-•]\s*/, '').trim())
                };
                entries.push(entry);
            }
        }
    }
    
    return entries;
}

function parseSkillsSection(text) {
    const skillsSection = extractSection(text, 'Skills', null);
    if (!skillsSection) return [];
    
    const entries = [];
    const lines = skillsSection.split('\n');
    
    let currentCategory = null;
    let currentSkills = [];
    
    for (const line of lines) {
        if (line.includes(':')) {
            if (currentCategory && currentSkills.length > 0) {
                entries.push({
                    id: crypto.randomUUID(),
                    category: currentCategory,
                    skills: currentSkills
                });
            }
            const [category, skillsStr] = line.split(':');
            currentCategory = category.trim();
            currentSkills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        } else if (line.trim() && currentCategory) {
            currentSkills.push(...line.split(',').map(s => s.trim()).filter(Boolean));
        }
    }
    
    if (currentCategory && currentSkills.length > 0) {
        entries.push({
            id: crypto.randomUUID(),
            category: currentCategory,
            skills: currentSkills
        });
    }
    
    return entries;
}

function parseListItems(text) {
    return text.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
}

function parseExperienceEntry(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    const entry = {
        id: crypto.randomUUID(),
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        responsibilities: []
    };
    
    // Parse the entry
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (i === 0 && !line.includes(':')) {
            entry.jobTitle = line;
        } else if (line.toLowerCase().includes('company:')) {
            entry.company = line.split(':')[1].trim();
        } else if (line.toLowerCase().includes('location:')) {
            entry.location = line.split(':')[1].trim();
        } else if (line.toLowerCase().includes('dates:') || line.toLowerCase().includes('period:')) {
            const dates = extractDates(line);
            if (dates) {
                entry.startDate = dates[0];
                entry.endDate = dates[1];
            }
        } else if (line.startsWith('-') || line.startsWith('•')) {
            entry.responsibilities.push(line.replace(/^[-•]\s*/, '').trim());
        }
    }
    
    // If no structured data found, try to parse it differently
    if (!entry.jobTitle && lines.length > 0) {
        entry.jobTitle = lines[0];
        if (lines.length > 1) entry.company = lines[1].split('|')[0].trim();
        if (lines.length > 1 && lines[1].includes('|')) entry.location = lines[1].split('|')[1].trim();
        if (lines.length > 2) {
            const dates = extractDates(lines[2]);
            if (dates) {
                entry.startDate = dates[0];
                entry.endDate = dates[1];
            }
        }
        entry.responsibilities = lines.slice(3)
            .filter(l => l.trim())
            .map(l => l.replace(/^[-•]\s*/, '').trim());
    }
    
    return entry;
}

function parseTailoredCV(text, context) {
    const result = {
        updatedSummary: '',
        updatedSkills: [],
        updatedExperience: [],
        suggestedNewExperienceEntries: []
    };
    
    // Extract updated summary
    result.updatedSummary = extractSection(text, 'Summary', 'Skills') || 
                           extractSection(text, 'Updated Summary', 'Updated Skills') || 
                           '';
    
    // Extract updated skills
    const skillsText = extractSection(text, 'Skills', 'Experience') || 
                      extractSection(text, 'Updated Skills', 'Updated Experience') || 
                      '';
    
    if (skillsText) {
        result.updatedSkills = parseSkillsFromText(skillsText);
    }
    
    // Extract updated experience
    const experienceText = extractSection(text, 'Experience', 'New Experience') || 
                          extractSection(text, 'Updated Experience', 'Suggested New') || 
                          '';
    
    if (experienceText && context.existingCV) {
        result.updatedExperience = parseUpdatedExperience(experienceText, context.existingCV.experience);
    }
    
    // Extract suggested new experience entries if applicable
    if (context.applyDetailedExperienceUpdates) {
        const newExperienceText = extractSection(text, 'New Experience', null) || 
                                 extractSection(text, 'Suggested New Experience', null) || 
                                 '';
        
        if (newExperienceText) {
            result.suggestedNewExperienceEntries = parseExperienceSection(newExperienceText);
        }
    }
    
    return result;
}

function parseSkillsFromText(text) {
    const skills = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
        if (line.includes(':')) {
            const [category, skillsList] = line.split(':');
            if (skillsList) {
                skills.push({
                    id: crypto.randomUUID(),
                    category: category.trim(),
                    skills: skillsList.split(',').map(s => s.trim()).filter(Boolean)
                });
            }
        }
    }
    
    return skills;
}

function parseUpdatedExperience(text, existingExperience) {
    const updated = [];
    const blocks = text.split(/\n\n+/);
    
    for (const block of blocks) {
        const lines = block.trim().split('\n');
        if (lines.length > 0) {
            // Try to match with existing experience
            const jobTitle = lines[0].trim();
            const existing = existingExperience.find(exp => 
                exp.jobTitle.toLowerCase().includes(jobTitle.toLowerCase()) ||
                jobTitle.toLowerCase().includes(exp.jobTitle.toLowerCase())
            );
            
            if (existing) {
                const responsibilities = lines.slice(1)
                    .filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
                    .map(l => l.replace(/^[-•]\s*/, '').trim());
                
                const updatedEntry = {
                    id: existing.id,
                    responsibilities: responsibilities.length > 0 ? responsibilities : existing.responsibilities
                };
                
                // Check for updated job title
                if (lines[0].includes('→')) {
                    const newTitle = lines[0].split('→')[1].trim();
                    updatedEntry.updatedJobTitle = newTitle;
                }
                
                updated.push(updatedEntry);
            }
        }
    }
    
    return updated;
}

// Helper functions
function extractSection(text, startMarker, endMarker) {
    const startRegex = new RegExp(`${startMarker}:?\\s*\\n`, 'i');
    const endRegex = endMarker ? new RegExp(`${endMarker}:?\\s*\\n`, 'i') : null;
    
    const startMatch = text.match(startRegex);
    if (!startMatch) return null;
    
    const startIndex = startMatch.index + startMatch[0].length;
    
    if (endRegex) {
        const endMatch = text.slice(startIndex).match(endRegex);
        if (endMatch) {
            return text.slice(startIndex, startIndex + endMatch.index).trim();
        }
    }
    
    return text.slice(startIndex).trim();
}

function extractBetween(text, start, end) {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) return null;
    
    const valueStart = startIndex + start.length;
    const endIndex = text.indexOf(end, valueStart);
    
    if (endIndex === -1) {
        return text.slice(valueStart).trim();
    }
    
    return text.slice(valueStart, endIndex).trim();
}

function extractDates(text) {
    const datePattern = /(\w+\s+\d{4}|\d{4})\s*[-–]\s*(\w+\s+\d{4}|\d{4}|Present|Current)/i;
    const match = text.match(datePattern);
    
    if (match) {
        return [match[1].trim(), match[2].trim()];
    }
    
    return null;
}