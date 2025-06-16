
import React, { useState }from 'react';
import { CVData, PersonalInfo, ExperienceEntry, EducationEntry, SkillEntry, GeminiRequestStatus, AutofillTarget, CVSection } from '../../types';
import { PlusIcon, TrashIcon, SparklesIcon, EyeIcon, EyeSlashIcon, CameraIcon } from '../../constants';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface ContentEditorPanelProps {
  cvData: CVData;
  onCVDataChange: (data: CVData) => void;
  onAutofillRequest: (target: AutofillTarget, prompt: string, context?: any) => void;
  onTailorCvRequest: (jobDescription: string, currentCvData: CVData, applyDetailedUpdates: boolean) => void;
  geminiStatus: GeminiRequestStatus;
  geminiError: string | null;
  clearGeminiError: () => void;
  jobDescriptionForTailoring: string;
  onJobDescriptionChange: (jd: string) => void;
  activeGeminiAction: string | null; // To differentiate between multiple Gemini actions
  setActiveGeminiAction: (action: string | null) => void;
  applyDetailedExperienceUpdates: boolean;
  onApplyDetailedExperienceUpdatesChange: (value: boolean) => void;
}

const InputFieldWithToggle: React.FC<{
  label: string;
  value: string;
  name: keyof PersonalInfo; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showValue?: boolean; 
  onToggleShow?: (visibilityFlagName: keyof PersonalInfo, value: boolean) => void;
  type?: string;
  required?: boolean;
  isToggleable?: boolean;
}> = ({ label, value, name, onChange, showValue, onToggleShow, type = "text", required = false, isToggleable = true }) => {
  
  const handleToggleClick = () => {
    if (onToggleShow && isToggleable) {
      const visibilityFlagName = `show${name.charAt(0).toUpperCase() + name.slice(1)}` as keyof PersonalInfo;
      onToggleShow(visibilityFlagName, !showValue);
    }
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {isToggleable && onToggleShow && (
          <button
            onClick={handleToggleClick}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            aria-label={showValue ? `Hide ${label}` : `Show ${label}`}
          >
            {showValue ? <EyeSlashIcon className="w-4 h-4 mr-1" /> : <EyeIcon className="w-4 h-4 mr-1" />}
            {showValue ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        disabled={isToggleable && !showValue}
      />
    </div>
  );
};


const InputField: React.FC<{label: string, value: string, name: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, required?: boolean}> = 
  ({label, value, name, onChange, type="text", required=false}) => (
  <div className="mb-3">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"/>
  </div>
);

const TextAreaField: React.FC<{label: string, value: string, name: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, rows?: number, required?: boolean, placeholder?: string}> = 
  ({label, value, name, onChange, rows=3, required=false, placeholder}) => (
  <div className="mb-3">
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea id={name} name={name} value={value} onChange={onChange} rows={rows} required={required} placeholder={placeholder} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"/>
  </div>
);

const ContentEditorPanel: React.FC<ContentEditorPanelProps> = ({ 
    cvData, 
    onCVDataChange, 
    onAutofillRequest, 
    onTailorCvRequest,
    geminiStatus, 
    geminiError, 
    clearGeminiError,
    jobDescriptionForTailoring,
    onJobDescriptionChange,
    activeGeminiAction,
    setActiveGeminiAction,
    applyDetailedExperienceUpdates,
    onApplyDetailedExperienceUpdatesChange,
}) => {
  
  const [geminiPrompts, setGeminiPrompts] = useState<{[key: string]: string}>({});
  const [newExperiencePrompt, setNewExperiencePrompt] = useState<string>('');
  const [personalInfoSaveMessageVisible, setPersonalInfoSaveMessageVisible] = useState<boolean>(false);


  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    // @ts-ignore
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    onCVDataChange({ ...cvData, personalInfo: { ...cvData.personalInfo, [name]: val } });
  };
  
  const handleToggleShowPersonalInfoField = (visibilityFlagName: keyof PersonalInfo, value: boolean) => {
     onCVDataChange({ ...cvData, personalInfo: { ...cvData.personalInfo, [visibilityFlagName]: value } });
  };

  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCVDataChange({
          ...cvData,
          personalInfo: { ...cvData.personalInfo, portraitUrl: reader.result as string },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePortrait = () => {
    onCVDataChange({
      ...cvData,
      personalInfo: { ...cvData.personalInfo, portraitUrl: '', showPortrait: cvData.personalInfo.showPortrait ? false : cvData.personalInfo.showPortrait }, 
    });
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onCVDataChange({ ...cvData, summary: e.target.value });
  };
  
  const handleItemChange = <T extends ExperienceEntry | EducationEntry | SkillEntry>(
    section: keyof CVData, 
    index: number, 
    field: keyof T, 
    value: any
  ) => {
    const items = cvData[section] as T[];
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    onCVDataChange({ ...cvData, [section]: updatedItems });
  };

  const handleNestedListChange = <T extends ExperienceEntry | EducationEntry | SkillEntry>(
    section: keyof CVData,
    itemIndex: number,
    listField: keyof T, 
    listItemIndex: number,
    value: string
  ) => {
    const items = cvData[section] as T[];
    const updatedItems = items.map((item, i) => {
      if (i === itemIndex) {
        const list = (item[listField] as string[]).map((li, liIndex) => 
          liIndex === listItemIndex ? value : li
        );
        return { ...item, [listField]: list };
      }
      return item;
    });
    onCVDataChange({ ...cvData, [section]: updatedItems });
  };
  
  const addNestedListItem = <T extends ExperienceEntry | EducationEntry | SkillEntry>(
    section: keyof CVData,
    itemIndex: number,
    listField: keyof T
  ) => {
    const items = cvData[section] as T[];
    const updatedItems = items.map((item, i) => {
      if (i === itemIndex) {
        return { ...item, [listField]: [...(item[listField] as string[]), ''] };
      }
      return item;
    });
    onCVDataChange({ ...cvData, [section]: updatedItems });
  };

  const removeNestedListItem = <T extends ExperienceEntry | EducationEntry | SkillEntry>(
    section: keyof CVData,
    itemIndex: number,
    listField: keyof T,
    listItemIndex: number
  ) => {
    const items = cvData[section] as T[];
    const updatedItems = items.map((item, i) => {
      if (i === itemIndex) {
        const list = (item[listField] as string[]).filter((_, liIndex) => liIndex !== listItemIndex);
        return { ...item, [listField]: list };
      }
      return item;
    });
    onCVDataChange({ ...cvData, [section]: updatedItems });
  };

  const addItem = (section: 'experience' | 'education' | 'skills') => {
    let newItem: ExperienceEntry | EducationEntry | SkillEntry;
    const id = crypto.randomUUID();
    if (section === 'experience') {
      newItem = { id, jobTitle: '', company: '', location: '', startDate: '', endDate: '', responsibilities: [''] };
    } else if (section === 'education') {
      newItem = { id, degree: '', institution: '', location: '', graduationDate: '', details: [''] };
    } else { 
      newItem = { id, category: '', skills: [''] };
    }
    onCVDataChange({ ...cvData, [section]: [...cvData[section], newItem] });
  };

  const removeItem = (section: keyof CVData, index: number) => {
    const items = (cvData[section] as Array<any>).filter((_, i) => i !== index);
    onCVDataChange({ ...cvData, [section]: items });
  };

  const handleGeminiPromptChange = (key: string, value: string) => {
    setGeminiPrompts(prev => ({ ...prev, [key]: value }));
  };

  const handleGeminiGenerateClick = (
    fieldKey: string, 
    target: AutofillTarget, 
    generationType: string, 
    contextData?: any,
    promptOverride?: string 
  ) => {
    const prompt = promptOverride ?? geminiPrompts[fieldKey] ?? '';
     if (!prompt && generationType !== 'new_experience_entry' && generationType !== 'initial_cv_from_title' && generationType !== 'skill_suggestions') {
       const existingContent = target.section === 'summary' ? cvData.summary : ''; 
       onAutofillRequest(target, existingContent, {...contextData, generationType});
    } else {
        onAutofillRequest(target, prompt, {...contextData, generationType});
    }
    setActiveGeminiAction(fieldKey);
  };
  
  const handleNewExperienceGeminiGenerate = () => {
    if (!newExperiencePrompt.trim()) {
        clearGeminiError(); 
        alert("Please enter a job title or keywords for the new experience.");
        return;
    }
    const fieldKey = `new_experience_entry_${cvData.experience.length}`;
    setActiveGeminiAction(fieldKey);
    onAutofillRequest(
        { section: 'experience', action: 'add_new_gemini' },
        newExperiencePrompt,
        { generationType: 'new_experience_entry', existingCV: cvData }
    );
    setNewExperiencePrompt(''); 
  };

  const handleTailorButtonClick = () => {
    if (!jobDescriptionForTailoring.trim()) {
        clearGeminiError();
        alert("Please paste a job description first.");
        return;
    }
    setActiveGeminiAction('tailor_cv');
    onTailorCvRequest(jobDescriptionForTailoring, cvData, applyDetailedExperienceUpdates);
  };

  const handleSavePersonalInfo = () => {
    // Data is already saved by useEffect in App.tsx on any cvData change.
    // This function provides user feedback.
    setPersonalInfoSaveMessageVisible(true);
    setTimeout(() => {
        setPersonalInfoSaveMessageVisible(false);
    }, 2500);
  };

  const renderListEditor = <T extends ExperienceEntry | EducationEntry | SkillEntry>(
    sectionTitle: string, 
    sectionKey: 'experience' | 'education' | 'skills',
    itemFields: Array<{key: keyof T, label: string, type?: string, listKey?: keyof T, listLabel?: string, genType?: string, genContextKeys?: (keyof T)[]}>
  ) => {
    const items = cvData[sectionKey] as T[];
    return (
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{sectionTitle}</h3>
        </div>
        
        {sectionKey === 'experience' && (
            <div className="mb-4 p-3 border border-dashed border-blue-400 rounded-md bg-blue-50">
                <label htmlFor="newExperiencePrompt" className="block text-sm font-medium text-gray-700 mb-1">New Experience Entry with Gemini</label>
                <input
                    id="newExperiencePrompt"
                    type="text"
                    placeholder="Job title or keywords for new Gemini entry..."
                    value={newExperiencePrompt}
                    onChange={(e) => setNewExperiencePrompt(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2"
                />
                <button
                    onClick={handleNewExperienceGeminiGenerate}
                    disabled={geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === `new_experience_entry_${cvData.experience.length}`}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center justify-center gap-1 disabled:opacity-60"
                >
                    {geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === `new_experience_entry_${cvData.experience.length}` ? <LoadingSpinner size="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                    Generate New Experience
                </button>
            </div>
        )}
        <button
            onClick={() => addItem(sectionKey)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs flex items-center justify-center gap-1 mb-3"
        >
            <PlusIcon className="w-4 h-4" /> Add Empty {sectionTitle === "Work Experience" ? "Experience" : sectionTitle === "Skills" ? "Skill Category" : sectionTitle} Entry Manually
        </button>

        {items.map((item, index) => (
          <div key={item.id} className="mb-4 p-3 border border-gray-200 rounded-md relative bg-gray-50">
            <button onClick={() => removeItem(sectionKey, index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full bg-white bg-opacity-50 hover:bg-opacity-100 transition-colors" aria-label={`Delete this ${sectionTitle} entry`}>
              <TrashIcon className="w-4 h-4"/>
            </button>
            {itemFields.map(field => {
              const fieldKeyBase = `${sectionKey}-${index}-${String(field.key)}`;
              if (field.listKey) { 
                const listItems = item[field.listKey] as string[];
                return (
                  <div key={String(field.key)} className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    {listItems.map((li, liIndex) => (
                      <div key={liIndex} className="flex items-center gap-2 mb-1">
                        <input 
                          type="text" 
                          value={li} 
                          onChange={(e) => handleNestedListChange(sectionKey, index, field.listKey!, liIndex, e.target.value)}
                          className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-sm"
                        />
                        <button onClick={() => removeNestedListItem(sectionKey, index, field.listKey!, liIndex)} className="text-red-500 hover:text-red-600" aria-label={`Remove ${field.listLabel || 'item'}`}>
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addNestedListItem(sectionKey, index, field.listKey!)} className="text-blue-500 hover:text-blue-600 text-xs flex items-center gap-1 mt-1">
                        <PlusIcon className="w-3 h-3"/> Add {field.listLabel || 'Item'}
                    </button>
                    {field.genType && ( 
                        <div className="mt-2 p-2 border-t border-gray-200">
                            <input 
                                type="text"
                                placeholder={`Keywords for Gemini to generate ${field.label}...`}
                                value={geminiPrompts[fieldKeyBase] || ''}
                                onChange={(e) => handleGeminiPromptChange(fieldKeyBase, e.target.value)}
                                className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-xs mb-1"
                            />
                            <button 
                                onClick={() => {
                                  let contextData: any = {};
                                  if (field.genContextKeys) {
                                    contextData = field.genContextKeys.reduce((acc, k) => ({...acc, [k]: item[k]}), {});
                                  }
                                  if (sectionKey === 'skills' && field.key === 'skills' && (item as SkillEntry).category) {
                                    contextData.skillCategory = (item as SkillEntry).category;
                                  }

                                  handleGeminiGenerateClick(
                                      fieldKeyBase, 
                                      {section: `${sectionKey}.${index}.${String(field.listKey)}` as CVSection, index: index, field: String(field.listKey), action: 'update_list'}, 
                                      field.genType!,
                                      contextData
                                  );
                                }}
                                disabled={geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === fieldKeyBase}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 w-full justify-center"
                            >
                                {geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === fieldKeyBase ? <LoadingSpinner size="w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                                Generate {field.label} with AI
                            </button>
                        </div>
                    )}
                  </div>
                );
              }
              return (
                <InputField 
                    key={String(field.key)} 
                    label={field.label} 
                    name={String(field.key)} 
                    value={item[field.key] as string} 
                    onChange={(e) => handleItemChange(sectionKey, index, field.key, e.target.value)}
                    type={field.type || 'text'}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-4 space-y-6 bg-slate-50 rounded-lg shadow-inner max-h-full overflow-y-auto">
      {geminiError && <ErrorMessage message={geminiError} onClear={clearGeminiError}/>}

      {/* Tailor CV to Job Description Section */}
      <div className="p-4 border border-blue-300 rounded-lg bg-blue-50 shadow-sm">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Tailor CV to Job Description</h3>
        <TextAreaField
          label="Paste Job Description Here"
          name="jobDescriptionForTailoring"
          value={jobDescriptionForTailoring}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          rows={6}
          placeholder="Paste the full job description to help Gemini tailor your CV..."
        />
        <div className="mt-3 mb-3">
            <label htmlFor="applyDetailedExperienceUpdatesToggle" className="flex items-center text-sm text-gray-700 cursor-pointer">
                <input
                    type="checkbox"
                    id="applyDetailedExperienceUpdatesToggle"
                    checked={applyDetailedExperienceUpdates}
                    onChange={(e) => onApplyDetailedExperienceUpdatesChange(e.target.checked)}
                    className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Allow AI to update existing job titles and suggest new experience entries for alignment.
            </label>
        </div>
        <button
          onClick={handleTailorButtonClick}
          disabled={geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === 'tailor_cv'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center justify-center gap-1 mt-2 disabled:opacity-60"
        >
          {geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === 'tailor_cv' ? <LoadingSpinner size="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
          Tailor CV with Gemini
        </button>
      </div>
      
      <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
        <InputField label="Full Name" name="name" value={cvData.personalInfo.name} onChange={handlePersonalInfoChange} required />
        <InputField label="Title (e.g., Software Engineer)" name="title" value={cvData.personalInfo.title} onChange={handlePersonalInfoChange} />
        
        <InputFieldWithToggle label="Phone" name="phone" value={cvData.personalInfo.phone || ''} onChange={handlePersonalInfoChange} type="tel" showValue={cvData.personalInfo.showPhone} onToggleShow={handleToggleShowPersonalInfoField} />
        <InputFieldWithToggle label="Email" name="email" value={cvData.personalInfo.email || ''} onChange={handlePersonalInfoChange} type="email" showValue={cvData.personalInfo.showEmail} onToggleShow={handleToggleShowPersonalInfoField} />
        <InputFieldWithToggle label="LinkedIn Profile URL" name="linkedin" value={cvData.personalInfo.linkedin || ''} onChange={handlePersonalInfoChange} showValue={cvData.personalInfo.showLinkedin} onToggleShow={handleToggleShowPersonalInfoField}/>
        <InputFieldWithToggle label="GitHub Profile URL" name="github" value={cvData.personalInfo.github || ''} onChange={handlePersonalInfoChange} showValue={cvData.personalInfo.showGithub} onToggleShow={handleToggleShowPersonalInfoField}/>
        <InputFieldWithToggle label="Portfolio URL" name="portfolio" value={cvData.personalInfo.portfolio || ''} onChange={handlePersonalInfoChange} showValue={cvData.personalInfo.showPortfolio} onToggleShow={handleToggleShowPersonalInfoField}/>
        <InputFieldWithToggle label="Address" name="address" value={cvData.personalInfo.address || ''} onChange={handlePersonalInfoChange} showValue={cvData.personalInfo.showAddress} onToggleShow={handleToggleShowPersonalInfoField}/>

        <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 flex items-center"><CameraIcon className="w-4 h-4 mr-2 text-gray-500"/>Portrait Image</label>
                <button
                    onClick={() => handleToggleShowPersonalInfoField('showPortrait', !cvData.personalInfo.showPortrait)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                    {cvData.personalInfo.showPortrait ? <EyeSlashIcon className="w-4 h-4 mr-1" /> : <EyeIcon className="w-4 h-4 mr-1" />}
                    {cvData.personalInfo.showPortrait ? 'Hide' : 'Show'} Portrait
                </button>
            </div>
            {cvData.personalInfo.showPortrait && (
                <>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortraitUpload}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-2"
                        aria-label="Upload portrait image"
                    />
                    {cvData.personalInfo.portraitUrl && (
                        <div className="mt-2 text-center">
                            <img src={cvData.personalInfo.portraitUrl} alt="Portrait Preview" className="w-24 h-24 object-cover rounded-md inline-block border shadow-sm" />
                            <button onClick={removePortrait} className="mt-1 text-xs text-red-500 hover:text-red-700">Remove Portrait</button>
                        </div>
                    )}
                </>
            )}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center">
            <button
                onClick={handleSavePersonalInfo}
                className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            >
                Save Personal Info
            </button>
            {personalInfoSaveMessageVisible && (
                <span className="ml-3 text-sm text-green-700 italic">Personal info saved!</span>
            )}
        </div>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Professional Summary</h3>
        <TextAreaField label="Summary" name="summary" value={cvData.summary} onChange={handleSummaryChange} rows={4}/>
        <div className="mt-2">
            <input 
                type="text"
                placeholder="Keywords for Gemini (e.g., 'dynamic leader, 10 yrs exp')"
                value={geminiPrompts['summary'] || ''}
                onChange={(e) => handleGeminiPromptChange('summary', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm mb-1"
            />
            <button 
                onClick={() => handleGeminiGenerateClick('summary', {section: 'summary'}, 'summary', { existingCV: cvData } )}
                disabled={geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === 'summary'}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1"
            >
               {geminiStatus === GeminiRequestStatus.LOADING && activeGeminiAction === 'summary' ? <LoadingSpinner size="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
               Generate with Gemini
            </button>
        </div>
      </div>
      
      {renderListEditor<ExperienceEntry>('Work Experience', 'experience', [
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'company', label: 'Company' },
        { key: 'location', label: 'Location' },
        { key: 'startDate', label: 'Start Date (e.g., Jan 2020)' },
        { key: 'endDate', label: 'End Date (e.g., Present or Dec 2022)' },
        { key: 'responsibilities', label: 'Responsibilities', listKey: 'responsibilities', listLabel: 'Responsibility', genType: 'experience_responsibilities', genContextKeys: ['jobTitle', 'company'] }
      ])}

      {renderListEditor<EducationEntry>('Education', 'education', [
        { key: 'degree', label: 'Degree (e.g., B.S. in Computer Science)' },
        { key: 'institution', label: 'Institution Name' },
        { key: 'location', label: 'Location' },
        { key: 'graduationDate', label: 'Graduation Date (e.g., May 2020)' },
        { key: 'details', label: 'Details (e.g., GPA, Honors, Relevant Coursework)', listKey: 'details', listLabel: 'Detail', genType: 'education_details', genContextKeys: ['degree', 'institution'] }
      ])}

      {renderListEditor<SkillEntry>('Skills', 'skills', [
        { key: 'category', label: 'Skill Category (e.g., Programming Languages)' },
        { key: 'skills', label: 'Skills', listKey: 'skills', listLabel: 'Skill', genType: 'skill_suggestions', genContextKeys: ['category'] 
        }
      ])}

    </div>
  );
};

export default ContentEditorPanel;