
import React, { useState, useCallback, useEffect, startTransition } from 'react';
import { CVData, ThemeOptions, GeminiRequestStatus, AutofillTarget, ExperienceEntry, CVSection, SkillEntry, EducationEntry, TailoredCVUpdate, SectionContentType as SectionGenType } from './types'; // Renamed SectionContentType to avoid conflict
import { INITIAL_CV_DATA, DEFAULT_THEME, PaletteIcon, DocumentTextIcon, DownloadIcon, SparklesIcon, WandSparklesIcon } from './constants';
import CVPreview from './components/CVPreview';
import ThemeSelectorPanel from './components/panels/ThemeSelectorPanel';
import ContentEditorPanel from './components/panels/ContentEditorPanel';
import LoadingSpinner from './components/shared/LoadingSpinner';
import ErrorMessage from './components/shared/ErrorMessage';
import { generateCVContent } from './services/geminiService';

declare var html2pdf: any; 

type ActivePanel = 'theme' | 'content';
type InitialInputType = 'title' | 'description';

interface InitialCVGeneratorProps {
    onCvGenerated: (generatedData: CVData) => void;
    onGenerationError: (errorMessage: string) => void;
    isLoading: boolean;
    triggerGeneration: (inputValue: string, inputType: InitialInputType) => Promise<void>;
}

const InitialCVGenerator: React.FC<InitialCVGeneratorProps> = ({ onCvGenerated, onGenerationError, isLoading, triggerGeneration }) => {
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [inputType, setInputType] = useState<InitialInputType>('title');
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const inputValue = inputType === 'title' ? jobTitle : jobDescription;
        if (!inputValue.trim()) {
            setLocalError(`Please enter your desired ${inputType === 'title' ? 'job title' : 'job description'}.`);
            return;
        }
        setLocalError(null);
        await triggerGeneration(inputValue, inputType);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-8">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg text-center">
                <WandSparklesIcon className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Let's Craft Your CV!</h2>
                <p className="text-slate-600 mb-6">
                    Start by providing your desired job title or a full job description. Gemini AI will help create a foundational CV for you.
                </p>
                
                <div className="mb-6">
                    <div className="flex justify-center space-x-4">
                        {(['title', 'description'] as InitialInputType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setInputType(type)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                                    ${inputType === type 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                            >
                                {type === 'title' ? 'Use Job Title' : 'Use Job Description'}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {inputType === 'title' ? (
                        <div>
                            <label htmlFor="jobTitle" className="sr-only">Desired Job Title</label>
                            <input
                                type="text"
                                id="jobTitle"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="e.g., Senior Software Engineer"
                                className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-shadow"
                                aria-describedby="jobTitleHelp"
                            />
                            <p id="jobTitleHelp" className="text-xs text-slate-500 mt-2">A specific job title helps us generate relevant content.</p>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="jobDescription" className="sr-only">Job Description</label>
                            <textarea
                                id="jobDescription"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the full job description here..."
                                rows={8}
                                className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-shadow"
                                aria-describedby="jobDescriptionHelp"
                            />
                            <p id="jobDescriptionHelp" className="text-xs text-slate-500 mt-2">A full job description allows for a more tailored CV.</p>
                        </div>
                    )}
                    
                    {localError && <ErrorMessage message={localError} onClear={() => setLocalError(null)} />}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg text-lg flex items-center justify-center gap-3 transition-colors duration-150 disabled:opacity-70"
                    >
                        {isLoading ? <LoadingSpinner size="w-6 h-6" /> : <SparklesIcon className="w-6 h-6" />}
                        {isLoading ? 'Generating Your CV...' : 'Generate CV with AI'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [cvData, setCVData] = useState<CVData>(INITIAL_CV_DATA);
  const [currentTheme, setCurrentTheme] = useState<ThemeOptions>(DEFAULT_THEME);
  const [activePanel, setActivePanel] = useState<ActivePanel>('content');
  const [geminiStatus, setGeminiStatus] = useState<GeminiRequestStatus>(GeminiRequestStatus.IDLE);
  const [geminiError, setGeminiError] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [isInitialCvGenerated, setIsInitialCvGenerated] = useState<boolean>(false);
  const [jobDescriptionForTailoring, setJobDescriptionForTailoring] = useState<string>('');
  const [activeGeminiAction, setActiveGeminiAction] = useState<string | null>(null); // e.g. 'initial_cv_title', 'initial_cv_jd', 'tailor_cv'
  const [applyDetailedExperienceUpdates, setApplyDetailedExperienceUpdates] = useState<boolean>(true);


  useEffect(() => {
    try {
      const savedCVData = localStorage.getItem('geminiCVData');
      const savedTheme = localStorage.getItem('geminiCVTheme');
      const initialCvFlag = localStorage.getItem('geminiInitialCvGenerated');
      const savedJobDescription = localStorage.getItem('geminiJobDescription');
      const savedApplyDetailedUpdates = localStorage.getItem('geminiApplyDetailedUpdates');


      if (savedCVData) setCVData(JSON.parse(savedCVData));
      if (savedTheme) setCurrentTheme(JSON.parse(savedTheme));
      if (initialCvFlag) setIsInitialCvGenerated(JSON.parse(initialCvFlag));
      if (savedJobDescription) setJobDescriptionForTailoring(savedJobDescription);
      if (savedApplyDetailedUpdates) setApplyDetailedExperienceUpdates(JSON.parse(savedApplyDetailedUpdates));
      
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setCVData(prev => (Object.keys(prev).length === 0 ? INITIAL_CV_DATA : prev)); 
      setCurrentTheme(prev => (Object.keys(prev).length === 0 ? DEFAULT_THEME : prev));
      setIsInitialCvGenerated(false); 
      setJobDescriptionForTailoring('');
      setApplyDetailedExperienceUpdates(true);
    }
    setIsAppLoading(false);
  }, []);

  useEffect(() => {
    if(!isAppLoading) {
        localStorage.setItem('geminiCVData', JSON.stringify(cvData));
    }
  }, [cvData, isAppLoading]);

  useEffect(() => {
    if(!isAppLoading) {
        localStorage.setItem('geminiCVTheme', JSON.stringify(currentTheme));
    }
  }, [currentTheme, isAppLoading]);

  useEffect(() => {
    if(!isAppLoading) {
        localStorage.setItem('geminiInitialCvGenerated', JSON.stringify(isInitialCvGenerated));
    }
  }, [isInitialCvGenerated, isAppLoading]);

  useEffect(() => {
    if (!isAppLoading) {
        localStorage.setItem('geminiJobDescription', jobDescriptionForTailoring);
    }
  }, [jobDescriptionForTailoring, isAppLoading]);
  
  useEffect(() => {
    if (!isAppLoading) {
        localStorage.setItem('geminiApplyDetailedUpdates', JSON.stringify(applyDetailedExperienceUpdates));
    }
  }, [applyDetailedExperienceUpdates, isAppLoading]);


  const handleCVDataChange = useCallback((newData: CVData) => {
    setCVData(newData);
  }, []);

  const handleThemeChange = useCallback((theme: ThemeOptions) => {
    setCurrentTheme(theme);
  }, []);
  
  const handleThemeOptionChange = useCallback(<K extends keyof ThemeOptions>(option: K, value: ThemeOptions[K]) => {
    setCurrentTheme(prevTheme => ({ ...prevTheme, [option]: value }));
  }, []);

  const clearGeminiError = useCallback(() => {
    setGeminiError(null);
  }, []);

  const handleInitialCvGeneration = async (inputValue: string, inputType: InitialInputType) => {
    const actionType = inputType === 'title' ? 'initial_cv_title' : 'initial_cv_jd';
    setActiveGeminiAction(actionType);
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    try {
        const generationMode = inputType === 'title' ? 'initial_cv_from_title' : 'initial_cv_from_job_description';
        const result = await generateCVContent(generationMode as SectionGenType, inputValue);
        startTransition(() => {
            setCVData(result as CVData);
            setIsInitialCvGenerated(true);
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            setActiveGeminiAction(null);
        });
    } catch (err) {
        console.error("Initial CV generation error:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to generate initial CV.";
        setGeminiError(errorMessage); 
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
    }
  };

  const handleAutofillRequest = useCallback(async (target: AutofillTarget, promptValue: string, context?: any) => {
    // Determine a unique key for the action to track loading state for specific UI elements
    const fieldKey = context?.generationType === 'new_experience_entry' 
        ? `new_experience_entry_${cvData.experience.length}` 
        : target.field 
            ? `${target.section}-${target.index}-${target.field}` 
            : (target.section as string);

    setActiveGeminiAction(fieldKey);
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    
    const generationType = (context?.generationType as SectionGenType) || null;

    if (!generationType) {
        const errMsg = `Unsupported autofill target or generation type mapping. Target: ${JSON.stringify(target)}`;
        console.error(errMsg);
        setGeminiError(errMsg);
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
        return;
    }
      
    try {
      const result = await generateCVContent(generationType, promptValue, context);
      
      startTransition(() => {
        setCVData(prevCvData => {
          const newCvData = JSON.parse(JSON.stringify(prevCvData)); 

          if (generationType === 'new_experience_entry' && target.section === 'experience' && target.action === 'add_new_gemini') {
              const newEntry = result as ExperienceEntry;
              newCvData.experience.push({ ...newEntry, id: newEntry.id || crypto.randomUUID() });
          } else if (generationType === 'new_education_entry' && target.section === 'education' && target.action === 'add_new_gemini') {
              const newEntry = result as EducationEntry;
              newCvData.education.push({ ...newEntry, id: newEntry.id || crypto.randomUUID() });
          } else if (target.section === 'summary' && typeof result === 'string') {
            newCvData.summary = result;
          } else if (target.section.startsWith('experience.') && target.field === 'responsibilities' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.experience[target.index]) {
              newCvData.experience[target.index].responsibilities = result as string[];
            }
          } else if (target.section.startsWith('education.') && target.field === 'details' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.education[target.index]) {
              newCvData.education[target.index].details = result as string[];
            }
          } else if (target.section.startsWith('skills.') && target.field === 'skills' && Array.isArray(result) && target.index !== undefined) {
            if (newCvData.skills[target.index]) {
              newCvData.skills[target.index].skills = result as string[];
            }
          }
          return newCvData;
        });
        setGeminiStatus(GeminiRequestStatus.SUCCESS);
        setActiveGeminiAction(null);
      });
    } catch (err) {
      console.error("Gemini autofill error:", err);
      setGeminiError(err instanceof Error ? err.message : "An unknown error occurred during content generation.");
      setGeminiStatus(GeminiRequestStatus.ERROR);
      setActiveGeminiAction(null);
    }
  }, [cvData.experience.length]);

  const handleTailorCvRequest = useCallback(async (jobDescription: string, currentCvData: CVData, applyDetailedUpdates: boolean) => {
    setActiveGeminiAction('tailor_cv');
    setGeminiStatus(GeminiRequestStatus.LOADING);
    setGeminiError(null);
    try {
        const result = await generateCVContent(
            'tailor_cv_to_job_description', 
            jobDescription, 
            { 
                existingCV: currentCvData,
                applyDetailedExperienceUpdates: applyDetailedUpdates // Pass the toggle state
            }
        ) as TailoredCVUpdate;
        
        startTransition(() => {
            setCVData(prevCvData => {
                const newCvData = JSON.parse(JSON.stringify(prevCvData));
                
                newCvData.summary = result.updatedSummary;
                
                newCvData.skills = result.updatedSkills.map(updatedSkill => {
                    const existingSkill = prevCvData.skills.find(s => s.id === updatedSkill.id || s.category === updatedSkill.category);
                    return {
                        ...updatedSkill,
                        id: updatedSkill.id || existingSkill?.id || crypto.randomUUID()
                    };
                });

                result.updatedExperience.forEach(updatedExp => {
                    const expIndex = newCvData.experience.findIndex((exp: ExperienceEntry) => exp.id === updatedExp.id);
                    if (expIndex !== -1) {
                        newCvData.experience[expIndex].responsibilities = updatedExp.responsibilities;
                        // Only update job title if the toggle was on during the request
                        if (applyDetailedUpdates && updatedExp.updatedJobTitle && typeof updatedExp.updatedJobTitle === 'string' && updatedExp.updatedJobTitle.trim() !== "") {
                            newCvData.experience[expIndex].jobTitle = updatedExp.updatedJobTitle;
                        }
                    }
                });
                
                // Only add new experience entries if the toggle was on
                if (applyDetailedUpdates && result.suggestedNewExperienceEntries && result.suggestedNewExperienceEntries.length > 0) {
                    const newEntriesWithIds = result.suggestedNewExperienceEntries.map(entry => ({
                        ...entry,
                        id: crypto.randomUUID()
                    }));
                    newCvData.experience.push(...newEntriesWithIds);
                }

                return newCvData;
            });
            setGeminiStatus(GeminiRequestStatus.SUCCESS);
            setActiveGeminiAction(null);
        });
    } catch (err) {
        console.error("CV Tailoring error:", err);
        setGeminiError(err instanceof Error ? err.message : "Failed to tailor CV.");
        setGeminiStatus(GeminiRequestStatus.ERROR);
        setActiveGeminiAction(null);
    }
  }, []);


  const handleDownloadPDF = useCallback(() => {
    const scaleBeforePdf = currentTheme.previewScale || 1;

    startTransition(() => {
        setIsPdfGenerating(true);
        setCurrentTheme(prev => ({ ...prev, previewScale: 1 }));
    });
    setGeminiError(null);

    setTimeout(() => {
        const element = document.getElementById('cv-content-formatted');
        if (element) {
            const pdfFilename = `CV_${cvData.personalInfo.name.replace(/\s+/g, '_') || 'Resume'}.pdf`;
            const options = {
                margin: 0, 
                filename: pdfFilename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false, 
                    backgroundColor: currentTheme.backgroundColor === 'white' ? '#FFFFFF' : (tailwindColorToHex(currentTheme.backgroundColor) || '#FFFFFF')
                }, 
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(element).set(options).save()
                .catch((err: Error) => {
                    console.error("PDF generation failed:", err);
                    setGeminiError(`Failed to generate PDF: ${err.message}`);
                })
                .finally(() => {
                    startTransition(() => {
                        setCurrentTheme(prev => ({ ...prev, previewScale: scaleBeforePdf }));
                        setIsPdfGenerating(false);
                    });
                });
        } else {
            console.error("CV content element not found for PDF generation.");
            setGeminiError("Could not find CV content to generate PDF.");
            startTransition(() => {
                setCurrentTheme(prev => ({ ...prev, previewScale: scaleBeforePdf }));
                setIsPdfGenerating(false);
            });
        }
    }, 250); 
  }, [currentTheme.previewScale, cvData.personalInfo.name, currentTheme.backgroundColor]);

  const tailwindColorToHex = (twColor: string): string | null => {
    if (twColor.startsWith('gray-')) return '#F9FAFB'; 
    if (twColor === 'white') return '#FFFFFF';
    if (twColor === 'black') return '#000000';
    const colorMap: {[key:string]: string} = {
        'slate-50': '#F8FAFC', 'slate-100': '#F1F5F9',
        'blue-50': '#EFF6FF', 'blue-600': '#2563EB',
    };
    return colorMap[twColor] || null; 
  };


  if (isAppLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <LoadingSpinner message="Loading CV Editor..."/>
      </div>
    );
  }

  if (!isInitialCvGenerated && !isAppLoading) { 
    return (
        <InitialCVGenerator
            onCvGenerated={(generatedData) => { 
                startTransition(() => { 
                    setCVData(generatedData);
                    setIsInitialCvGenerated(true);
                    setGeminiStatus(GeminiRequestStatus.IDLE); 
                });
            }}
            onGenerationError={(errorMessage) => { 
                setGeminiError(errorMessage);
                setGeminiStatus(GeminiRequestStatus.ERROR);
            }}
            isLoading={geminiStatus === GeminiRequestStatus.LOADING && (activeGeminiAction === 'initial_cv_title' || activeGeminiAction === 'initial_cv_jd')}
            triggerGeneration={handleInitialCvGeneration} 
        />
    );
  }


  return (
    <div className="flex flex-col h-screen font-sans antialiased">
      <header className="bg-slate-800 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-semibold">Gemini CV Theme Editor</h1>
        <button
            onClick={handleDownloadPDF}
            disabled={isPdfGenerating || geminiStatus === GeminiRequestStatus.LOADING}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
            aria-label="Download CV as PDF"
        >
            <DownloadIcon className="w-4 h-4"/>
            {isPdfGenerating ? 'Generating...' : 'Download PDF'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/3 max-w-md bg-slate-200 p-1 flex flex-col border-r border-slate-300">
            <nav className="flex mb-2 rounded-md bg-slate-300 p-0.5">
                <button 
                    onClick={() => setActivePanel('content')}
                    className={`flex-1 p-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activePanel === 'content' ? `bg-white text-blue-600 shadow-sm` : `text-slate-600 hover:bg-slate-100`}`}
                    aria-pressed={activePanel === 'content'}
                >
                    <DocumentTextIcon className="w-4 h-4"/> Content
                </button>
                <button 
                    onClick={() => setActivePanel('theme')}
                    className={`flex-1 p-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activePanel === 'theme' ? `bg-white text-purple-600 shadow-sm` : `text-slate-600 hover:bg-slate-100`}`}
                    aria-pressed={activePanel === 'theme'}
                >
                    <PaletteIcon className="w-4 h-4"/> Theme
                </button>
            </nav>
            <div className="flex-1 overflow-y-auto pr-1"> 
                {activePanel === 'content' && (
                    <ContentEditorPanel 
                        cvData={cvData} 
                        onCVDataChange={handleCVDataChange} 
                        onAutofillRequest={handleAutofillRequest}
                        onTailorCvRequest={handleTailorCvRequest}
                        geminiStatus={geminiStatus}
                        geminiError={geminiError}
                        clearGeminiError={clearGeminiError}
                        jobDescriptionForTailoring={jobDescriptionForTailoring}
                        onJobDescriptionChange={setJobDescriptionForTailoring}
                        activeGeminiAction={activeGeminiAction}
                        setActiveGeminiAction={setActiveGeminiAction}
                        applyDetailedExperienceUpdates={applyDetailedExperienceUpdates}
                        onApplyDetailedExperienceUpdatesChange={setApplyDetailedExperienceUpdates}
                    />
                )}
                {activePanel === 'theme' && (
                    <ThemeSelectorPanel 
                        currentTheme={currentTheme} 
                        onThemeChange={handleThemeChange}
                        onThemeOptionChange={handleThemeOptionChange}
                    />
                )}
            </div>
        </aside>

        <main className="flex-1 bg-slate-50 overflow-auto p-6 flex justify-center items-start">
            <div className="w-full h-full"> 
                <CVPreview cvData={cvData} theme={currentTheme} />
            </div>
        </main>
      </div>
       {(geminiStatus === GeminiRequestStatus.LOADING || isPdfGenerating) && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" aria-live="assertive" role="alertdialog">
              <LoadingSpinner 
                message={
                    isPdfGenerating ? "Generating PDF..." : 
                    activeGeminiAction === 'tailor_cv' ? "Gemini is tailoring your CV..." :
                    activeGeminiAction === 'initial_cv_title' || activeGeminiAction === 'initial_cv_jd' ? "Gemini is crafting your initial CV..." :
                    (geminiStatus === GeminiRequestStatus.LOADING ? "Gemini is thinking..." : "Processing...")
                } 
                size="w-12 h-12" 
              />
          </div>
      )}
      {geminiError && activePanel !== 'content' && ( 
          <div className="fixed bottom-4 right-4 z-50">
            <ErrorMessage message={geminiError} onClear={clearGeminiError} />
          </div>
      )}
    </div>
  );
};

export default App;