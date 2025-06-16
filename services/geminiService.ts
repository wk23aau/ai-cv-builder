
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from "./constants"; // Corrected import path
import { CVData, ExperienceEntry, EducationEntry, SkillEntry, PersonalInfo, TailoredCVUpdate, SectionContentType } from "./types"; 

// Ensure API_KEY is handled by the build environment or hosting platform.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please ensure the API_KEY environment variable is configured.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

interface GenerationContext {
  jobTitle?: string;
  company?: string;
  degree?: string;
  institution?: string;
  skillCategory?: string; // For skill_suggestions
  existingCV?: CVData; 
  prompt?: string; 
  generationType?: SectionContentType;
  jobDescription?: string; // For CV tailoring
  applyDetailedExperienceUpdates?: boolean; // New flag for controlling tailoring depth
}

export async function generateCVContent(
  sectionType: SectionContentType,
  userInput: string, // Primary prompt or keyword. For skills, this will be user's keywords. For tailoring, this is the job description.
  context?: GenerationContext
): Promise<string | string[] | ExperienceEntry | EducationEntry | CVData | TailoredCVUpdate> { 
  let prompt = "";
  let isJsonResponseType = false;

  switch (sectionType) {
    case "summary":
      prompt = `Generate a concise and compelling professional summary for a CV (2-4 sentences). Base it on the following input: "${userInput}".`;
      if (context?.existingCV?.experience?.length) {
        prompt += `\nConsider the following experience: ${context.existingCV.experience.map(e => `${e.jobTitle} at ${e.company}`).join(', ')}.`;
      }
      break;
    case "experience_responsibilities":
      prompt = `Generate 3-5 impactful bullet points for a job responsibility section. Focus on achievements and use action verbs.
Job Title: ${context?.jobTitle || 'N/A'}
Company: ${context?.company || 'N/A'}
Keywords/details: "${userInput}"
Respond ONLY with a JSON string array of responsibilities. Example: ["Developed new product features.", "Managed a team of 5."].`;
      isJsonResponseType = true;
      break;
    case "education_details":
      prompt = `Generate 1-2 concise bullet points for an education entry's details. Focus on academic achievements, relevant coursework, or honors.
Degree: ${context?.degree || 'N/A'}
Institution: ${context?.institution || 'N/A'}
Keywords/details: "${userInput}"
Respond ONLY with a JSON string array of details. Example: ["GPA: 3.8/4.0", "Relevant coursework: Advanced Algorithms, AI."].`;
      isJsonResponseType = true;
      break;
    case "skill_suggestions":
      prompt = `For the CV skill category "${context?.skillCategory || 'General Skills'}", generate 3-5 relevant skills.
User-provided keywords/focus: "${userInput}".
Respond ONLY with a JSON string array of skills. Example: ["JavaScript", "React", "Node.js"].`;
      isJsonResponseType = true;
      break;
    case "new_experience_entry":
      prompt = `Based on the following input regarding a job: "${userInput}", generate a complete job experience entry for a CV.
      Provide details for job title, company, location, start date, end date (use "Present" if ongoing or estimate if not specified), and 3-5 responsibility bullet points.
      Respond ONLY with a JSON object matching this structure: {"jobTitle": "string", "company": "string", "location": "string", "startDate": "string", "endDate": "string", "responsibilities": ["string", "string"]}.
      Example for startDate/endDate: "Jan 2020", "Dec 2022" or "Present".
      Be professional and infer reasonable details if not all are provided in the input. If location is not provided, use a common city like "Anytown, USA". If company is not provided, use a placeholder like "Global Corp Inc."`;
      isJsonResponseType = true;
      break;
    case "new_education_entry":
      prompt = `Based on the following input regarding an academic qualification: "${userInput}", generate a complete education entry for a CV.
      Provide details for degree, institution, location, graduation date, and 1-2 detail bullet points (e.g., GPA, honors, relevant coursework).
      Respond ONLY with a JSON object matching this structure: {"degree": "string", "institution": "string", "location": "string", "graduationDate": "string", "details": ["string", "string"]}.
      Example for graduationDate: "May 2020".
      Be professional and infer reasonable details if not all are provided in the input. If location is not provided, use a common city like "Anytown, USA". If institution is not provided, use a placeholder like "State University Online".`;
      isJsonResponseType = true;
      break;
    case "initial_cv_from_title":
      prompt = `Based on the job title: "${userInput}", generate a comprehensive CV structure.
The CV should include:
1.  PersonalInfo: MUST BE a JSON object with EXACTLY these fields: "name" (string, set to "Your Name (Update Me!)"), "title" (string, set to the provided job title "${userInput}"), "phone" (string, empty), "email" (string, empty), "linkedin" (string, empty), "github" (string, empty), "portfolio" (string, empty), "address" (string, empty), "portraitUrl" (string, empty), "showPortrait" (boolean, false), "showPhone" (boolean, true), "showEmail" (boolean, true), "showLinkedin" (boolean, true), "showGithub" (boolean, true), "showPortfolio" (boolean, true), "showAddress" (boolean, false). No other fields are allowed in PersonalInfo.
2.  Summary: A professional summary of 2-4 sentences relevant to the job title.
3.  Experience: One sample experience entry relevant to the job title. Include 'jobTitle' (can be same as input or related), 'company' (e.g., "Tech Solutions Inc."), 'location' (e.g., "San Francisco, CA"), 'startDate' (e.g., "Jan 2020"), 'endDate' (e.g., "Present"), and 2-3 'responsibilities' (bullet points).
4.  Education: One sample education entry. Include 'degree' (e.g., "Bachelor of Science in Computer Science"), 'institution' (e.g., "State University"), 'location' (e.g., "Anytown, USA"), 'graduationDate' (e.g., "May 2018"), and 1-2 'details' (e.g., "Relevant coursework: Data Structures, Algorithms").
5.  Skills: Two skill entries. Each with a 'category' (e.g., "Programming Languages", "Tools & Technologies") and a 'skills' array with 3-4 relevant skills.

Respond ONLY with a single JSON object matching the CVData structure. Do not include 'id' fields in your response; I will add them.

CVData structure example for your response (omit 'id' fields, ensure PersonalInfo has ALL specified fields and NO OTHERS):
{
  "personalInfo": {
    "name": "Your Name (Update Me!)",
    "title": "${userInput}",
    "phone": "",
    "email": "",
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "address": "",
    "portraitUrl": "",
    "showPortrait": false,
    "showPhone": true,
    "showEmail": true,
    "showLinkedin": true,
    "showGithub": true,
    "showPortfolio": true,
    "showAddress": false
  },
  "summary": "Generated summary...",
  "experience": [{ "jobTitle": "Relevant Job Title", "company": "Example Company", "location": "City, ST", "startDate": "Month Year", "endDate": "Month Year or Present", "responsibilities": ["Responsibility 1.", "Responsibility 2."] }],
  "education": [{ "degree": "Relevant Degree", "institution": "University Name", "location": "City, ST", "graduationDate": "Month Year", "details": ["Detail 1.", "Detail 2."] }],
  "skills": [{ "category": "Skill Category 1", "skills": ["Skill A", "Skill B"] }, { "category": "Skill Category 2", "skills": ["Skill C", "Skill D"] }]
}`;
      isJsonResponseType = true;
      break;
    case "initial_cv_from_job_description":
      prompt = `You are an expert CV generator. Based on the following Job Description:
---
${userInput}
---
Generate a comprehensive foundational CV structure. Your primary goal is to extract the core job title from the Job Description and build the CV around it.

The CV MUST include:
1.  PersonalInfo: A JSON object with EXACTLY these fields: "name" (string, set to "Your Name (Update Me!)"), "title" (string, set to the core job title you extracted from the Job Description), "phone" (string, empty), "email" (string, empty), "linkedin" (string, empty), "github" (string, empty), "portfolio" (string, empty), "address" (string, empty), "portraitUrl" (string, empty), "showPortrait" (boolean, false), "showPhone" (boolean, true), "showEmail" (boolean, true), "showLinkedin" (boolean, true), "showGithub" (boolean, true), "showPortfolio" (boolean, true), "showAddress" (boolean, false). No other fields are allowed in PersonalInfo.
2.  Summary: A professional summary (2-4 sentences) highly relevant to the Job Description and the extracted core job title.
3.  Experience:
    *   If the Job Description clearly implies a senior-level role (e.g., uses terms like 'Senior', 'Lead', 'Manager', 'Director', 'Principal', or explicitly states a requirement for many years of experience like 7+, 10+, 15+ years), generate 2 or 3 distinct sample experience entries. These entries should reflect progressively responsible roles or significant projects relevant to the Job Description.
    *   Otherwise (for entry-level to mid-level roles), generate 1 or 2 distinct sample experience entries.
    *   Each experience entry MUST include: 'jobTitle' (relevant to the JD), 'company' (e.g., "Relevant Company Inc."), 'location' (e.g., "Major City, ST"), 'startDate' (e.g., "Jan 2019"), 'endDate' (e.g., "Dec 2021" or "Present" for the most recent), and 2-3 'responsibilities' (bullet points highlighting skills and achievements aligned with the JD).
4.  Education: One sample education entry. Include 'degree' (e.g., "Bachelor of Science in Related Field"), 'institution' (e.g., "University Name"), 'location' (e.g., "City, ST"), 'graduationDate' (e.g., "May 2017"), and 1-2 'details' (e.g., "Relevant coursework: Key Skill, Another Skill").
5.  Skills: One to two skill entries. Each with a 'category' (e.g., "Key Technologies from JD", "Core Competencies from JD") and a 'skills' array with 3-5 skills directly extracted or inferred from the Job Description.

Respond ONLY with a single JSON object matching the CVData structure. Do not include 'id' fields in your response; I will add them.
The generated content should be plausible and professional.

CVData structure example for your response (omit 'id' fields, ensure PersonalInfo has ALL specified fields and NO OTHERS, adapt experience count based on JD seniority):
{
  "personalInfo": { "name": "Your Name (Update Me!)", "title": "Extracted Title from JD", "phone": "", "email": "", "linkedin": "", "github": "", "portfolio": "", "address": "", "portraitUrl": "", "showPortrait": false, "showPhone": true, "showEmail": true, "showLinkedin": true, "showGithub": true, "showPortfolio": true, "showAddress": false },
  "summary": "Generated summary highly relevant to the JD...",
  "experience": [
    { "jobTitle": "Extracted or Related Sr. Job Title", "company": "Example Senior Company", "location": "City, ST", "startDate": "Month Year", "endDate": "Present", "responsibilities": ["Responsibility 1.", "Responsibility 2."] }
    // Potentially more experience entries if JD is senior
  ],
  "education": [{ "degree": "Relevant Degree", "institution": "University Name", "location": "City, ST", "graduationDate": "Month Year", "details": ["Detail 1.", "Detail 2."] }],
  "skills": [{ "category": "Skill Category from JD", "skills": ["Skill A", "Skill B"] }]
}`;
      isJsonResponseType = true;
      break;
    case "tailor_cv_to_job_description":
      const relevantCVParts = {
        summary: context?.existingCV?.summary,
        skills: context?.existingCV?.skills.map(s => ({ id: s.id, category: s.category, skills: s.skills })),
        experience: context?.existingCV?.experience.map(e => ({ id: e.id, jobTitle: e.jobTitle, company: e.company, responsibilities: e.responsibilities })),
      };
      const userPreferenceForDetailedUpdates = context?.applyDetailedExperienceUpdates === undefined ? true : context.applyDetailedExperienceUpdates;

      prompt = `You are an expert CV tailoring assistant.
Job Description to target:
---
${userInput} 
---

Current CV Content (JSON format):
---
${JSON.stringify(relevantCVParts)}
---

User's preference for experience updates: ${userPreferenceForDetailedUpdates ? "User ALLOWS updates to existing job titles and suggestion of new experiences." : "User wants to KEEP existing job titles and does NOT want new experience entries suggested. Only update responsibilities for existing entries."}

Your task is to revise the "Current CV Content" to be exceptionally well-aligned with the "Job Description to target". Treat this as a fresh, comprehensive analysis for the new Job Description, re-evaluating all relevant parts of the CV.

Respond ONLY with a single JSON object with the following structure:
{
  "updatedSummary": "A revised summary (2-4 sentences) that directly addresses the key requirements and company values mentioned in the Job Description...",
  "updatedSkills": [
    { "id": "original_or_new_id_abc", "category": "Key Technologies from JD", "skills": ["Skill X from JD", "Skill Y from JD", "Tool Z from JD"] }
  ],
  "updatedExperience": [
    { "id": "original_id_of_experience_1", "updatedJobTitle": "Job Title (see instructions below)", "responsibilities": ["Tailored responsibility 1.1 reflecting JD keywords like 'cloud migration' and 'cost optimization'.", "Tailored responsibility 1.2 emphasizing relevant achievement with metrics if possible."] }
  ],
  "suggestedNewExperienceEntries": [ 
    // Example (see instructions below): 
    // { "jobTitle": "Senior Project Lead", "company": "Growth Phase Inc.", "location": "Remote", "startDate": "Jan 2018", "endDate": "Dec 2020", "responsibilities": ["Led cross-functional teams for JD-relevant projects."] }
  ]
}

Detailed instructions for each field:
- "updatedSummary": String. Must be concise and compelling, reflecting the most critical aspects of the JD.
- "updatedSkills": Array of SkillEntry objects. Each MUST have "id" (preserve original ID if a similar category exists and is being updated, otherwise generate a new unique string ID like 'new_skill_cat_xyz'), "category" (string, derived from JD or adapted from existing), and "skills" (array of strings, prioritize skills from JD). This list should replace the entire old skills section.
- "updatedExperience": Array of objects. For EACH experience entry in the "Current CV Content", include its original "id" (string).
    - "updatedJobTitle" (string, REQUIRED): 
        - If user preference ALLOWS updates (User preference is true): Critically evaluate the original job title against the target Job Description. Provide an \`updatedJobTitle\` that *maximizes* its alignment and relevance. If the original title is already perfectly optimal and cannot be improved for this JD, return the original title. Otherwise, return a revised title that enhances keyword matching, clarity, or better reflects the JD's focus for this experience entry.
        - If user preference wants to KEEP existing titles (User preference is false): This field MUST be the *original* job title from the "Current CV Content" for this experience ID. Do not change it.
    - "responsibilities" (array of strings, 2-4 bullet points): ALWAYS tailor these to highlight achievements and skills directly relevant to the Job Description, using strong action verbs and keywords from the JD. Quantify achievements where possible.
- "suggestedNewExperienceEntries" (array of objects, optional):
    - If user preference ALLOWS updates (User preference is true) AND if the Job Description implies a significantly more senior role than the "Current CV Content" suggests (e.g., JD is for a Director with 10+ years experience, but CV shows 3 years as an engineer), suggest 1 or 2 NEW, distinct experience entries that would bridge this gap. These new entries should be plausible and align with a career progression towards the target role. Each object here should have: "jobTitle", "company", "location", "startDate", "endDate", and "responsibilities". Do NOT include 'id' for these new suggestions.
    - If user preference does NOT want new entries suggested (User preference is false): This array MUST be empty or omitted entirely from the JSON response.

Ensure all IDs for "updatedSkills" are unique strings.
Focus on making the CV highly competitive for the specific Job Description.
`;
      isJsonResponseType = true;
      break;
    default:
      // TypeScript will error here if any SectionContentType is not handled.
      const exhaustiveCheck: never = sectionType; 
      throw new Error(`Unsupported section type for generation: ${exhaustiveCheck}`);
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: isJsonResponseType 
                ? { responseMimeType: "application/json" } 
                : { thinkingConfig: { thinkingBudget: 0 } }
    });

    let textOutput = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = textOutput.match(fenceRegex);
    if (match && match[2]) {
      textOutput = match[2].trim();
    }
    
    if (sectionType === "experience_responsibilities" || sectionType === "education_details" || sectionType === "skill_suggestions") {
      try {
        const parsedArray: string[] = JSON.parse(textOutput);
        return parsedArray;
      } catch (e) {
        console.error(`Failed to parse JSON for ${sectionType}:`, e, "\nRaw output:", textOutput);
        if (textOutput.includes(',')) return textOutput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return textOutput ? [textOutput] : []; 
      }
    } else if (sectionType === "new_experience_entry") {
        try {
            const parsedEntry: Omit<ExperienceEntry, 'id'> = JSON.parse(textOutput);
            return { ...parsedEntry, id: crypto.randomUUID() };
        } catch (e) {
            console.error(`Failed to parse JSON for ${sectionType}:`, e, "\nRaw output:", textOutput);
            throw new Error(`Gemini returned an invalid format for new experience entry. Raw: ${textOutput}`);
        }
    } else if (sectionType === "new_education_entry") {
        try {
            const parsedEntry: Omit<EducationEntry, 'id'> = JSON.parse(textOutput);
            return { ...parsedEntry, id: crypto.randomUUID() };
        } catch (e) {
            console.error(`Failed to parse JSON for ${sectionType}:`, e, "\nRaw output:", textOutput);
            throw new Error(`Gemini returned an invalid format for new education entry. Raw: ${textOutput}`);
        }
    } else if (sectionType === "initial_cv_from_title" || sectionType === "initial_cv_from_job_description") {
        try {
            let parsedCVData: CVData = JSON.parse(textOutput);
            const extractedTitle = sectionType === "initial_cv_from_job_description" 
                                   ? (parsedCVData.personalInfo?.title || "Job Title (from JD)")
                                   : userInput;

            const defaultPersonalInfo: Omit<PersonalInfo, 'portraitUrl' | 'showPortrait' | 'showPhone' | 'showEmail' | 'showLinkedin' | 'showGithub' | 'showPortfolio' | 'showAddress'> & Partial<Pick<PersonalInfo, 'portraitUrl' | 'showPortrait' | 'showPhone' | 'showEmail' | 'showLinkedin' | 'showGithub' | 'showPortfolio' | 'showAddress'>> = {
                name: "Your Name (Update Me!)",
                title: extractedTitle,
                phone: "", email: "", linkedin: "", github: "", portfolio: "", address: "",
                portraitUrl: parsedCVData.personalInfo?.portraitUrl || "", 
                showPortrait: parsedCVData.personalInfo?.showPortrait === undefined ? false : parsedCVData.personalInfo.showPortrait,
                showPhone: parsedCVData.personalInfo?.showPhone === undefined ? true : parsedCVData.personalInfo.showPhone,
                showEmail: parsedCVData.personalInfo?.showEmail === undefined ? true : parsedCVData.personalInfo.showEmail,
                showLinkedin: parsedCVData.personalInfo?.showLinkedin === undefined ? true : parsedCVData.personalInfo.showLinkedin,
                showGithub: parsedCVData.personalInfo?.showGithub === undefined ? true : parsedCVData.personalInfo.showGithub,
                showPortfolio: parsedCVData.personalInfo?.showPortfolio === undefined ? true : parsedCVData.personalInfo.showPortfolio,
                showAddress: parsedCVData.personalInfo?.showAddress === undefined ? false : parsedCVData.personalInfo.showAddress,
            };
            // Merge Gemini's personalInfo with defaults, ensuring title is correct.
            parsedCVData.personalInfo = { ...defaultPersonalInfo, ...parsedCVData.personalInfo, title: parsedCVData.personalInfo.title || extractedTitle };


            parsedCVData.experience = (parsedCVData.experience || []).map(exp => ({ ...exp, id: crypto.randomUUID() }));
            parsedCVData.education = (parsedCVData.education || []).map(edu => ({ ...edu, id: crypto.randomUUID() }));
            parsedCVData.skills = (parsedCVData.skills || []).map(skill => ({ ...skill, id: crypto.randomUUID() }));
            
            return parsedCVData;
        } catch (e) {
            console.error(`Failed to parse JSON for ${sectionType}:`, e, "\nRaw output:", textOutput);
            throw new Error(`Gemini returned an invalid format for initial CV data. Raw: ${textOutput}`);
        }
    } else if (sectionType === "tailor_cv_to_job_description") {
        try {
            const tailoredUpdate: TailoredCVUpdate = JSON.parse(textOutput);
            if (tailoredUpdate.updatedSkills) {
                tailoredUpdate.updatedSkills = tailoredUpdate.updatedSkills.map(skill => ({
                    ...skill,
                    id: skill.id || crypto.randomUUID() 
                }));
            }
            // No IDs for suggestedNewExperienceEntries as per prompt, they'll be added in App.tsx
            return tailoredUpdate;
        } catch (e) {
            console.error(`Failed to parse JSON for ${sectionType}:`, e, "\nRaw output:", textOutput);
            throw new Error(`Gemini returned an invalid format for tailored CV data. Raw: ${textOutput}`);
        }
    }
    return textOutput; 

  } catch (error) {
    console.error('Gemini API call failed:', error);
    if (error instanceof Error) {
        if (error.message.includes("Raw:")) { // If we've already added raw output
            throw error;
        }
        // For other errors, provide a generic message
        throw new Error(`Failed to generate content from Gemini: ${error.message}`);
    }
    // Fallback for non-Error objects
    throw new Error('An unknown error occurred while generating content from Gemini.');
  }
}
