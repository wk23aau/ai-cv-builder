
export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  linkedin: string;
  github?: string;
  portfolio?: string;
  address?: string;

  // New fields for portrait
  portraitUrl?: string;
  showPortrait?: boolean;

  // Visibility toggles for existing fields
  showPhone?: boolean;
  showEmail?: boolean;
  showLinkedin?: boolean;
  showGithub?: boolean;
  showPortfolio?: boolean;
  showAddress?: boolean;
}

export interface ExperienceEntry {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
}

export interface EducationEntry {
  id:string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  details?: string[];
}

export interface SkillEntry {
  id: string;
  category: string;
  skills: string[];
}

export interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
}

// Minimal CV data for initial generation request
export type InitialCVData = Pick<CVData, 'personalInfo' | 'summary'> & {
  experience?: Pick<ExperienceEntry, 'jobTitle' | 'company' | 'responsibilities'>[];
  education?: Pick<EducationEntry, 'degree' | 'institution'>[];
  skills?: Pick<SkillEntry, 'category' | 'skills'>[];
};


export enum GeminiRequestStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ThemeOptions {
  primaryColor: string; // Tailwind color class e.g. 'blue-600'
  secondaryColor: string; // e.g. 'gray-700'
  backgroundColor: string; // e.g. 'white'
  textColor: string; // e.g. 'gray-900'
  fontFamily: string; // Tailwind font family class e.g. 'font-sans'
  previewScale?: number; // Zoom level for CV Preview
}

export type CVSection = keyof CVData | `experience.${number}.responsibilities` | `education.${number}.details` | `skills.${number}.skills`;

export interface AutofillTarget {
  section: CVSection | Extract<keyof CVData, "experience" | "education" | "skills">; // Allow targeting a whole array section for additions
  index?: number; // For array items like experience, education, skills
  field?: string; // For specific fields within an object, e.g., 'responsibilities'
  action?: 'add_new_gemini' | 'update_list'; // Clarify action for complex targets
}

export interface TailoredCVUpdate {
  updatedSummary: string;
  updatedSkills: SkillEntry[];
  updatedExperience: Array<{ id: string; responsibilities: string[]; updatedJobTitle?: string; }>;
  suggestedNewExperienceEntries?: Array<Omit<ExperienceEntry, 'id'>>; // New field
}

// Union type for all possible generation types Gemini service can handle
export type SectionContentType = 
  | "summary" 
  | "experience_responsibilities" 
  | "education_details" 
  | "skill_suggestions"
  | "new_experience_entry" 
  | "new_education_entry" 
  | "initial_cv_from_title"
  | "initial_cv_from_job_description" // New type for initial generation from JD
  | "tailor_cv_to_job_description";