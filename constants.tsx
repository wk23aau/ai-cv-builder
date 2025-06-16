
import React from 'react';
import { ThemeOptions, CVData } from './types';

export const DEFAULT_THEME: ThemeOptions = {
  primaryColor: 'blue-600',
  secondaryColor: 'gray-700',
  backgroundColor: 'white',
  textColor: 'gray-900',
  fontFamily: 'font-sans',
  previewScale: 1,
};

export const AVAILABLE_THEMES: { name: string; options: ThemeOptions }[] = [
  { name: 'Default Blue', options: DEFAULT_THEME },
  {
    name: 'Modern Teal',
    options: { ...DEFAULT_THEME, primaryColor: 'teal-600', secondaryColor: 'slate-700', textColor: 'slate-900' },
  },
  {
    name: 'Classic Gray',
    options: { ...DEFAULT_THEME, primaryColor: 'gray-800', secondaryColor: 'gray-600', textColor: 'black', fontFamily: 'font-serif' },
  },
  {
    name: 'Creative Purple',
    options: { ...DEFAULT_THEME, primaryColor: 'purple-600', secondaryColor: 'pink-500', backgroundColor: 'gray-50', textColor: 'gray-800' },
  },
];

export const INITIAL_CV_DATA: CVData = {
  personalInfo: {
    name: 'Alex Johnson',
    title: 'Senior Software Engineer',
    phone: '(555) 123-4567',
    email: 'alex.johnson@email.com',
    linkedin: 'linkedin.com/in/alexjohnson',
    github: 'github.com/alexj',
    portfolio: 'alexjohnson.dev',
    address: '123 Tech Avenue, Silicon Valley, CA',

    portraitUrl: '',
    showPortrait: false,

    showPhone: true,
    showEmail: true,
    showLinkedin: true,
    showGithub: true,
    showPortfolio: true,
    showAddress: false,
  },
  summary:
    'Highly motivated and results-oriented Senior Software Engineer with 8+ years of experience in developing scalable web applications. Proficient in full-stack development with a strong focus on frontend technologies. Seeking to leverage expertise in a challenging new role.',
  experience: [
    {
      id: crypto.randomUUID(),
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'San Francisco, CA',
      startDate: 'Jan 2020',
      endDate: 'Present',
      responsibilities: [
        'Led the development of a new customer portal, improving user satisfaction by 25%.',
        'Mentored junior engineers, fostering a collaborative and productive team environment.',
        'Architected and implemented microservices, enhancing system scalability and performance.',
      ],
    },
    {
      id: crypto.randomUUID(),
      jobTitle: 'Software Engineer',
      company: 'Innovatech Ltd.',
      location: 'Austin, TX',
      startDate: 'Jun 2016',
      endDate: 'Dec 2019',
      responsibilities: [
        'Developed and maintained features for a SaaS product using React and Node.js.',
        'Contributed to a 15% reduction in bug reports through rigorous testing and code reviews.',
        'Collaborated with cross-functional teams to deliver high-quality software solutions.',
      ],
    },
  ],
  education: [
    {
      id: crypto.randomUUID(),
      degree: 'M.S. in Computer Science',
      institution: 'Stanford University',
      location: 'Stanford, CA',
      graduationDate: 'May 2016',
      details: ['GPA: 3.9/4.0', 'Thesis on Distributed Systems'],
    },
    {
      id: crypto.randomUUID(),
      degree: 'B.S. in Software Engineering',
      institution: 'University of Texas at Austin',
      location: 'Austin, TX',
      graduationDate: 'May 2014',
      details: ['Graduated with Honors'],
    },
  ],
  skills: [
    {
      id: crypto.randomUUID(),
      category: 'Programming Languages',
      skills: ['JavaScript (ES6+)', 'TypeScript', 'Python', 'Java'],
    },
    {
      id: crypto.randomUUID(),
      category: 'Frameworks/Libraries',
      skills: ['React', 'Next.js', 'Node.js', 'Express.js', 'Spring Boot'],
    },
    {
      id: crypto.randomUUID(),
      category: 'Tools & Platforms',
      skills: ['Git', 'Docker', 'Kubernetes', 'AWS', 'Jenkins'],
    },
  ],
};

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

export const PlusIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

export const TrashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.243.096 3.242.26m3.242-.26M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

export const PaletteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125V5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.15-.15.337-.273.53-.365m0 0a4.878 4.878 0 0 1 7.426 0l.928.928a4.878 4.878 0 0 1 0 7.426l-.928.928a4.878 4.878 0 0 1-7.426 0l-.928-.928a4.878 4.878 0 0 1 0-7.426Z" />
    </svg>
);

export const DocumentTextIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

export const WandSparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
    </svg>
);

export const DownloadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

export const EyeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const EyeSlashIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.15 10.15 0 0 1 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639A10.154 10.154 0 0 1 12 19.5c-1.897 0-3.7-.467-5.283-1.25M12 15V9.75M15 12a3 3 0 0 1-6 0m3 0a3 3 0 0 0-3 3m0 0H6.75M17.25 12H18m-3.75 3.75H15M11.25 3.75H12M4.5 12.75H6M12 21V19.5" />
  </svg>
);

export const CameraIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.04l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);
