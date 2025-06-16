// This file is now for the WordPress plugin context.
// It communicates with the WordPress backend, which then calls the Gemini API.

import { CVData, ExperienceEntry, EducationEntry, SkillEntry, TailoredCVUpdate, SectionContentType } from "../types"; 

// Access WordPress localized data
// Ensure this matches the objectName in wp_localize_script
declare global {
  interface Window {
    aiCvBuilderData: {
      ajax_url: string;
      nonce: string;
      api_key_configured: boolean;
    };
  }
}

interface GenerationContext {
  jobTitle?: string;
  company?: string;
  degree?: string;
  institution?: string;
  skillCategory?: string;
  existingCV?: CVData; 
  prompt?: string; 
  generationType?: SectionContentType;
  jobDescription?: string;
  applyDetailedExperienceUpdates?: boolean;
}

export async function generateCVContent(
  sectionType: SectionContentType,
  userInput: string,
  context?: GenerationContext
): Promise<string | string[] | ExperienceEntry | EducationEntry | CVData | TailoredCVUpdate> {
  
  if (!window.aiCvBuilderData || !window.aiCvBuilderData.ajax_url) {
    console.error("AI CV Builder WordPress data not available (aiCvBuilderData).");
    throw new Error("WordPress AJAX configuration is missing.");
  }
  
  if (!window.aiCvBuilderData.api_key_configured) {
     console.warn("Gemini API key is not configured in WordPress settings.");
     // Allow app to proceed but show warning, backend will ultimately block if still not configured
  }

  const formData = new FormData();
  formData.append('action', 'ai_cv_generate_content');
  formData.append('nonce', window.aiCvBuilderData.nonce);
  formData.append('sectionType', sectionType);
  formData.append('userInput', userInput);
  if (context) {
    formData.append('context', JSON.stringify(context));
  }

  try {
    const response = await fetch(window.aiCvBuilderData.ajax_url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If response is not JSON
        const textError = await response.text();
        throw new Error(`Network response was not ok (${response.status} ${response.statusText}). Server response: ${textError}`);
      }
      throw new Error(errorData?.data?.message || `Request failed with status ${response.status}. Details: ${JSON.stringify(errorData?.data?.details || errorData?.data || 'No details')}`);
    }

    const jsonResponse = await response.json();

    if (jsonResponse.success) {
      // The PHP AJAX handler should return data in the format expected by the original service.
      // If PHP already parsed the JSON for arrays/objects, this is straightforward.
      // If PHP returned a string that needs to be parsed (e.g. for responsibilities), that logic needs to be here.
      // For this refactor, assuming PHP returns the data in its final expected type.
      
      const result = jsonResponse.data;

      // The original service added IDs for new entries on the client side.
      // This should now ideally be handled by PHP if possible, or done here if PHP returns data without IDs.
      // For consistency with original structure for now, let's keep client-side ID generation for new entries.

      if (sectionType === "new_experience_entry" && typeof result === 'object' && result !== null && !Array.isArray(result)) {
        return { ...(result as Omit<ExperienceEntry, 'id'>), id: crypto.randomUUID() };
      }
      if (sectionType === "new_education_entry" && typeof result === 'object' && result !== null && !Array.isArray(result)) {
        return { ...(result as Omit<EducationEntry, 'id'>), id: crypto.randomUUID() };
      }
      if ((sectionType === "initial_cv_from_title" || sectionType === "initial_cv_from_job_description") && typeof result === 'object' && result !== null) {
        let cvDataResult = result as CVData;
        cvDataResult.experience = (cvDataResult.experience || []).map(exp => ({ ...exp, id: exp.id || crypto.randomUUID() }));
        cvDataResult.education = (cvDataResult.education || []).map(edu => ({ ...edu, id: edu.id || crypto.randomUUID() }));
        cvDataResult.skills = (cvDataResult.skills || []).map(skill => ({ ...skill, id: skill.id || crypto.randomUUID() }));
        return cvDataResult;
      }
      if (sectionType === "tailor_cv_to_job_description" && typeof result === 'object' && result !== null) {
        let tailoredUpdate = result as TailoredCVUpdate;
        if (tailoredUpdate.updatedSkills) {
          tailoredUpdate.updatedSkills = tailoredUpdate.updatedSkills.map(skill => ({
            ...skill,
            id: skill.id || crypto.randomUUID() 
          }));
        }
        // New experience entries from tailoring will get IDs in App.tsx
        return tailoredUpdate;
      }

      return result; // For string, string[], or already processed objects.

    } else {
      throw new Error(jsonResponse.data?.message || 'AJAX request failed to generate content.');
    }
  } catch (error) {
    console.error('WordPress AJAX call for Gemini failed:', error);
    if (error instanceof Error) {
        // Re-throw the error to be caught by the UI layer
        throw error;
    }
    throw new Error('An unknown error occurred during content generation via WordPress.');
  }
}
