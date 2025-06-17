// AI CV Builder Main Frontend Logic
document.addEventListener('DOMContentLoaded', function () {
    const AICVB_LOCAL_STORAGE_KEY = 'aicvb_cvData';
    let cvData = null;

    /*
    Expected CV Data Structure:
    cvData = {
        personalInfo: { name: '', title: '', phone: '', email: '', linkedin: '', github: '', portfolio: '', address: '' },
        summary: '',
        experience: [ // { id: 'uuid', jobTitle: '', company: '', location: '', startDate: '', endDate: '', responsibilities: ['resp1', 'resp2'] } ],
        education: [ // { id: 'uuid', degree: '', institution: '', location: '', graduationDate: '', details: ['detail1', 'detail2'] } ],
        skills: [ // { id: 'uuid', category: '', skills: ['skill1', 'skill2'] } ]
    };
    */

    function saveCvDataToLocalStorage() {
        if (cvData) {
            localStorage.setItem(AICVB_LOCAL_STORAGE_KEY, JSON.stringify(cvData));
            console.log('CV Data saved to localStorage.');
        }
    }

    function loadCvDataFromLocalStorage() {
        const savedDataString = localStorage.getItem(AICVB_LOCAL_STORAGE_KEY);
        if (savedDataString) {
            try {
                const parsedData = JSON.parse(savedDataString);
                if (parsedData && typeof parsedData === 'object') {
                    // Normalize loaded data to ensure all expected top-level keys are present
                    cvData = {
                        personalInfo: parsedData.personalInfo || { name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '' },
                        summary: parsedData.summary || '',
                        experience: parsedData.experience || [],
                        education: parsedData.education || [],
                        skills: parsedData.skills || []
                    };
                    console.log('CV Data loaded from localStorage:', cvData);
                    return true;
                }
            } catch (e) {
                console.error('Error parsing CV data from localStorage:', e);
                localStorage.removeItem(AICVB_LOCAL_STORAGE_KEY);
            }
        }
        return false;
    }

    function generateUniqueId(prefix = 'item_') {
        return prefix + Date.now() + Math.random().toString(36).substring(2, 9);
    }

    const appContainer = document.getElementById('aicvb-cv-builder-app');
    if (!appContainer) {
        console.error('AI CV Builder: App container not found.');
        return;
    }

    if (typeof aicvb_params === 'undefined' || !aicvb_params.ajax_url || !aicvb_params.nonce) {
        appContainer.innerHTML = '<p style="color:red;">AI CV Builder: Critical parameters missing. Please contact support.</p>';
        console.error('AI CV Builder: Localized parameters (aicvb_params) not found or incomplete.');
        return;
    }

    console.log('AI CV Builder script loaded.');

    const initialSetupForm = document.getElementById('aicvb-initial-setup-form');
    const initialSetupSection = document.getElementById('aicvb-initial-setup-section');
    const cvDisplayEditSection = document.getElementById('aicvb-cv-display-edit-section');
    const cvPreviewArea = document.getElementById('aicvb-cv-preview');
    const cvEditorFormsArea = document.getElementById('aicvb-cv-editor-forms');

    function renderTextSection(title, content, parentElement, sectionKey, isTextarea = false) {
        let sectionHTML = `<div class="aicvb-section" id="aicvb-section-${sectionKey}">`;
        sectionHTML += `<h4>${title}</h4>`;
        sectionHTML += `<div class="aicvb-preview-content"><p>${content ? content.replace(/\n/g, '<br>') : '<em>Not specified. Click "Generate with AI" or edit below.</em>'}</p></div>`;
        sectionHTML += `<div class="aicvb-edit-form">`;
        if (isTextarea) {
            sectionHTML += `<textarea name="${sectionKey}" rows="5" placeholder="Enter your ${title.toLowerCase()} here...">${content || ''}</textarea>`;
        } else {
            sectionHTML += `<input type="text" name="${sectionKey}" value="${content || ''}" placeholder="Enter ${title.toLowerCase()} here...">`;
        }
        sectionHTML += `<button class="aicvb-save-btn" data-section="${sectionKey}">Save ${title}</button>`;
        sectionHTML += `<button class="aicvb-generate-ai-btn" data-section="${sectionKey}" data-context="${sectionKey}">Generate with AI</button>`;
        sectionHTML += `</div></div>`;
        parentElement.innerHTML += sectionHTML;
    }

    function renderPersonalInfoSection(personalInfo, parentElement) {
        let sectionHTML = '<div class="aicvb-section" id="aicvb-section-personalInfo"><h4>Personal Information</h4>';
        sectionHTML += '<div class="aicvb-preview-content">';
        const piPreviewOrder = ['name', 'title', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'address'];
        let hasContent = false;
        const currentPersonalInfo = personalInfo || {}; // Ensure personalInfo is an object
        piPreviewOrder.forEach(key => {
            if (currentPersonalInfo.hasOwnProperty(key) && currentPersonalInfo[key]) {
                 sectionHTML += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${currentPersonalInfo[key]}</p>`;
                 hasContent = true;
            }
        });
        if (!hasContent) {
            sectionHTML += '<p><em>No personal information specified. Edit below.</em></p>';
        }
        sectionHTML += '</div>';
        sectionHTML += '<div class="aicvb-edit-form"><div class="aicvb-form-grid">';
        const personalInfoSchema = { name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '' };
        for (const key in personalInfoSchema) {
             if (personalInfoSchema.hasOwnProperty(key)) {
                sectionHTML += `<div class="aicvb-form-field"><label for="pi-${key}">${key.charAt(0).toUpperCase() + key.slice(1)}:</label>`;
                sectionHTML += `<input type="text" id="pi-${key}" name="${key}" value="${currentPersonalInfo[key] || ''}" placeholder="Enter ${key.toLowerCase()}..."></div>`;
            }
        }
        sectionHTML += '</div>';
        sectionHTML += '<button class="aicvb-save-btn" data-section="personalInfo">Save Personal Info</button>';
        sectionHTML += '</div></div>';
        parentElement.innerHTML += sectionHTML;
    }

    function renderListSection(title, items, parentElement, sectionKey, fieldConfig) {
        let sectionHTML = `<div class="aicvb-section" id="aicvb-section-${sectionKey}"><h4>${title}</h4>`;
        const currentItems = items || []; // Ensure items is an array
        if (currentItems.length > 0) {
            currentItems.forEach(item => {
                const itemId = item.id || generateUniqueId(sectionKey + '_');
                item.id = itemId;

                sectionHTML += `<div class="aicvb-list-item" data-id="${itemId}">`;
                sectionHTML += `<div class="aicvb-preview-content">`;
                if (sectionKey === 'experience') {
                    sectionHTML += `<h5>${item.jobTitle || 'New Job'} at ${item.company || 'New Company'}</h5>`;
                    sectionHTML += `<p><small>${item.startDate || 'Date'} - ${item.endDate || 'Date'} | ${item.location || 'Location'}</small></p>`;
                    if (item.responsibilities && item.responsibilities.length > 0) {
                        sectionHTML += `<ul>${item.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>`;
                    } else {
                        sectionHTML += `<p><em>No responsibilities listed.</em></p>`;
                    }
                } else if (sectionKey === 'education') {
                    sectionHTML += `<h5>${item.degree || 'New Degree'} - ${item.institution || 'New Institution'}</h5>`;
                    sectionHTML += `<p><small>${item.graduationDate || 'Date'} | ${item.location || 'Location'}</small></p>`;
                    if (item.details && item.details.length > 0) {
                        sectionHTML += `<ul>${item.details.map(d => `<li>${d}</li>`).join('')}</ul>`;
                    } else {
                        sectionHTML += `<p><em>No details listed.</em></p>`;
                    }
                } else if (sectionKey === 'skills') {
                    sectionHTML += `<h5>${item.category || 'New Category'}</h5>`;
                    if (item.skills && item.skills.length > 0) {
                        sectionHTML += `<p>${item.skills.join(', ')}</p>`;
                    } else {
                        sectionHTML += `<p><em>No skills listed.</em></p>`;
                    }
                }
                sectionHTML += `</div>`;

                sectionHTML += `<div class="aicvb-edit-form">`;
                if (sectionKey === 'experience') {
                    sectionHTML += `<label for="exp_jobTitle_${itemId}">Job Title:</label><input type="text" id="exp_jobTitle_${itemId}" name="jobTitle" value="${item.jobTitle || ''}">`;
                    sectionHTML += `<label for="exp_company_${itemId}">Company:</label><input type="text" id="exp_company_${itemId}" name="company" value="${item.company || ''}">`;
                    sectionHTML += `<label for="exp_location_${itemId}">Location:</label><input type="text" id="exp_location_${itemId}" name="location" value="${item.location || ''}">`;
                    sectionHTML += `<label for="exp_startDate_${itemId}">Start Date:</label><input type="text" id="exp_startDate_${itemId}" name="startDate" value="${item.startDate || ''}">`;
                    sectionHTML += `<label for="exp_endDate_${itemId}">End Date:</label><input type="text" id="exp_endDate_${itemId}" name="endDate" value="${item.endDate || ''}">`;
                    sectionHTML += `<label for="exp_responsibilities_${itemId}">Responsibilities (one per line):</label><textarea id="exp_responsibilities_${itemId}" name="responsibilities" rows="4">${(item.responsibilities || []).join('\n')}</textarea>`;
                } else if (sectionKey === 'education') {
                    sectionHTML += `<label for="edu_degree_${itemId}">Degree:</label><input type="text" id="edu_degree_${itemId}" name="degree" value="${item.degree || ''}">`;
                    sectionHTML += `<label for="edu_institution_${itemId}">Institution:</label><input type="text" id="edu_institution_${itemId}" name="institution" value="${item.institution || ''}">`;
                    sectionHTML += `<label for="edu_location_${itemId}">Location:</label><input type="text" id="edu_location_${itemId}" name="location" value="${item.location || ''}">`;
                    sectionHTML += `<label for="edu_graduationDate_${itemId}">Graduation Date:</label><input type="text" id="edu_graduationDate_${itemId}" name="graduationDate" value="${item.graduationDate || ''}">`;
                    sectionHTML += `<label for="edu_details_${itemId}">Details (one per line):</label><textarea id="edu_details_${itemId}" name="details" rows="3">${(item.details || []).join('\n')}</textarea>`;
                } else if (sectionKey === 'skills') {
                    sectionHTML += `<label for="skill_category_${itemId}">Category:</label><input type="text" id="skill_category_${itemId}" name="category" value="${item.category || ''}">`;
                    sectionHTML += `<label for="skill_skills_${itemId}">Skills (comma-separated):</label><input type="text" id="skill_skills_${itemId}" name="skills" value="${(item.skills || []).join(', ')}">`;
                }

                sectionHTML += `<button class="aicvb-save-item-btn" data-section="${sectionKey}" data-id="${itemId}">Save Entry</button>`;
                sectionHTML += `<button class="aicvb-delete-item-btn" data-section="${sectionKey}" data-id="${itemId}">Delete Entry</button>`;
                if (sectionKey === 'experience') {
                     sectionHTML += `<button class="aicvb-generate-ai-btn" data-section="${sectionKey}" data-id="${itemId}" data-context="responsibilities">AI Responsibilities</button>`;
                } else if (sectionKey === 'education') {
                     sectionHTML += `<button class="aicvb-generate-ai-btn" data-section="${sectionKey}" data-id="${itemId}" data-context="details">AI Details</button>`;
                } else if (sectionKey === 'skills') {
                    sectionHTML += `<button class="aicvb-generate-ai-btn" data-section="${sectionKey}" data-id="${itemId}" data-context="skills">Suggest Skills</button>`;
                }
                sectionHTML += `</div></div>`;
            });
        } else {
            sectionHTML += `<p><em>No ${title.toLowerCase()} entries yet. Click "Add ${title.replace(/s$/, '')}" to create one.</em></p>`;
        }
        sectionHTML += `<button class="aicvb-add-item-btn" data-section="${sectionKey}">Add ${title.replace(/s$/, '')}</button>`;
        sectionHTML += `</div>`;
        parentElement.innerHTML += sectionHTML;
    }

    function renderCvDisplayAndForms(cvDataToRender) {
        if (!cvDataToRender && !loadCvDataFromLocalStorage()) { // Try loading if not provided
             // If still no cvData, initialize to an empty structure to render forms correctly
            cvData = {
                personalInfo: { name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '' },
                summary: '', experience: [], education: [], skills: []
            };
            cvDataToRender = cvData;
        } else if (!cvDataToRender && cvData) { // cvData was loaded by loadCvDataFromLocalStorage prior to this call
            cvDataToRender = cvData;
        }


        if(cvPreviewArea) cvPreviewArea.innerHTML = '';
        if(cvEditorFormsArea) cvEditorFormsArea.innerHTML = '';

        renderPersonalInfoSection(cvDataToRender.personalInfo, cvEditorFormsArea);
        renderTextSection('Summary', cvDataToRender.summary, cvEditorFormsArea, 'summary', true);
        renderListSection('Experience', cvDataToRender.experience, cvEditorFormsArea, 'experience', { itemTitleField: 'jobTitle' });
        renderListSection('Education', cvDataToRender.education, cvEditorFormsArea, 'education', { itemTitleField: 'degree' });
        renderListSection('Skills', cvDataToRender.skills, cvEditorFormsArea, 'skills', { itemTitleField: 'category' });
    }

    if (loadCvDataFromLocalStorage()) {
        if (initialSetupSection && cvDisplayEditSection) {
            initialSetupSection.classList.add('aicvb-hidden');
            cvDisplayEditSection.classList.remove('aicvb-hidden');
        }
        renderCvDisplayAndForms(cvData);
    } else {
        if (initialSetupSection && cvDisplayEditSection) {
            initialSetupSection.classList.remove('aicvb-hidden');
            cvDisplayEditSection.classList.add('aicvb-hidden');
        }
    }

    if (initialSetupForm && initialSetupSection && cvDisplayEditSection) {
        initialSetupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const jobTitleInput = document.getElementById('aicvb-job-title');
            const jobDescriptionInput = document.getElementById('aicvb-job-description');
            const selectedInputType = document.querySelector('input[name="aicvb_input_type"]:checked');
            if (!jobTitleInput || !jobDescriptionInput || !selectedInputType) return;
            const jobTitle = jobTitleInput.value;
            const jobDescription = jobDescriptionInput.value;
            const inputType = selectedInputType.value;
            const inputValue = inputType === 'title' ? jobTitle : jobDescription;
            if (!inputValue.trim()) { alert('Please enter a job title or description.'); return; }

            const submitButton = initialSetupForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Generating...';
            const existingError = appContainer.querySelector('.aicvb-error-message');
            if (existingError) existingError.remove();

            const formData = new FormData();
            formData.append('action', 'aicvb_generate_initial_cv');
            formData.append('nonce', aicvb_params.nonce);
            formData.append('input_type', inputType);
            formData.append('input_value', inputValue);

            fetch(aicvb_params.ajax_url, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                if (data.success) {
                    cvData = { // Ensure a complete structure from AI response
                        personalInfo: data.data.cv_data.personalInfo || { name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '' },
                        summary: data.data.cv_data.summary || '',
                        experience: data.data.cv_data.experience || [],
                        education: data.data.cv_data.education || [],
                        skills: data.data.cv_data.skills || []
                    };
                    saveCvDataToLocalStorage();
                    initialSetupSection.classList.add('aicvb-hidden');
                    cvDisplayEditSection.classList.remove('aicvb-hidden');
                    renderCvDisplayAndForms(cvData);
                } else {
                    appContainer.insertAdjacentHTML('beforeend', '<p class="aicvb-error-message" style="color:red;">Error: ' + (data.data.message || 'Unknown error') + '</p>');
                }
            })
            .catch(error => {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                appContainer.insertAdjacentHTML('beforeend', '<p class="aicvb-error-message" style="color:red;">Request failed: ' + error.message + '</p>');
            });
        });
    }

    const inputTypeTitleRadio = document.getElementById('aicvb-input-type-title');
    const inputTypeDescriptionRadio = document.getElementById('aicvb-input-type-description');
    const jobTitleFieldDiv = document.getElementById('aicvb-job-title-field');
    const jobDescriptionFieldDiv = document.getElementById('aicvb-job-description-field');

    if (inputTypeTitleRadio && inputTypeDescriptionRadio && jobTitleFieldDiv && jobDescriptionFieldDiv) {
        inputTypeTitleRadio.addEventListener('change', function() { if (this.checked) { jobTitleFieldDiv.classList.remove('aicvb-hidden'); jobDescriptionFieldDiv.classList.add('aicvb-hidden'); } });
        inputTypeDescriptionRadio.addEventListener('change', function() { if (this.checked) { jobDescriptionFieldDiv.classList.remove('aicvb-hidden'); jobTitleFieldDiv.classList.add('aicvb-hidden'); } });
    }

    cvEditorFormsArea.addEventListener('click', function(event) {
        const target = event.target;
        const sectionKey = target.dataset.section;
        const itemId = target.dataset.id;

        if (target.classList.contains('aicvb-save-btn')) {
            if (sectionKey === 'personalInfo') {
                const inputs = cvEditorFormsArea.querySelectorAll(`#aicvb-section-personalInfo .aicvb-form-grid input[type="text"]`);
                if (!cvData.personalInfo) cvData.personalInfo = { name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '' };
                inputs.forEach(input => { cvData.personalInfo[input.name] = input.value; });
                saveCvDataToLocalStorage();
                alert('Personal Info saved!'); renderCvDisplayAndForms(cvData);
            } else if (sectionKey === 'summary') {
                cvData.summary = cvEditorFormsArea.querySelector(`#aicvb-section-summary textarea`).value;
                saveCvDataToLocalStorage();
                alert('Summary saved!'); renderCvDisplayAndForms(cvData);
            }
        } else if (target.classList.contains('aicvb-save-item-btn')) {
            if (!sectionKey || !itemId || !cvData[sectionKey]) return;
            const itemIndex = cvData[sectionKey].findIndex(item => item.id === itemId);
            if (itemIndex === -1) return;
            const itemForm = target.closest('.aicvb-edit-form');
            itemForm.querySelectorAll('input[type="text"], textarea').forEach(input => {
                const fieldName = input.name;
                if (input.type === 'textarea' && (fieldName === 'responsibilities' || fieldName === 'details')) {
                    cvData[sectionKey][itemIndex][fieldName] = input.value.split('\n').map(s => s.trim()).filter(s => s);
                } else if (fieldName === 'skills' && sectionKey === 'skills') {
                     cvData[sectionKey][itemIndex][fieldName] = input.value.split(',').map(s => s.trim()).filter(s => s);
                } else {
                    cvData[sectionKey][itemIndex][fieldName] = input.value;
                }
            });
            saveCvDataToLocalStorage();
            alert(`${sectionKey.replace(/s$/, '')} entry saved!`); renderCvDisplayAndForms(cvData);
        } else if (target.classList.contains('aicvb-add-item-btn')) {
            if (!sectionKey) return;
            let newItem = { id: generateUniqueId(sectionKey + '_') };
            const defaultExperience = { jobTitle: 'New Job', company: '', location: '', startDate: '', endDate: '', responsibilities: [] };
            const defaultEducation = { degree: 'New Degree', institution: '', location: '', graduationDate: '', details: [] };
            const defaultSkills = { category: 'New Category', skills: [] };

            if (sectionKey === 'experience') newItem = { ...newItem, ...defaultExperience };
            else if (sectionKey === 'education') newItem = { ...newItem, ...defaultEducation };
            else if (sectionKey === 'skills') newItem = { ...newItem, ...defaultSkills };

            if (!cvData[sectionKey]) cvData[sectionKey] = [];
            cvData[sectionKey].push(newItem);
            saveCvDataToLocalStorage();
            renderCvDisplayAndForms(cvData);
        } else if (target.classList.contains('aicvb-delete-item-btn')) {
            if (!sectionKey || !itemId || !cvData[sectionKey]) return;
            const itemIndex = cvData[sectionKey].findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                if (confirm(`Are you sure you want to delete this ${sectionKey.replace(/s$/, '')} entry?`)) {
                    cvData[sectionKey].splice(itemIndex, 1);
                    saveCvDataToLocalStorage();
                    renderCvDisplayAndForms(cvData);
                }
            }
        } else if (target.classList.contains('aicvb-generate-ai-btn')) {
            const currentSectionKey = target.dataset.section;
            const currentItemId = target.dataset.id;
            const currentContext = target.dataset.context;
            let promptData = { section_key: currentSectionKey, item_id: currentItemId, gen_context: currentContext };

            if (currentSectionKey === 'summary') { /* existing context prep */ }
            else if (currentSectionKey === 'experience' && currentItemId && currentContext === 'responsibilities') { /* existing context prep */ }
            else if (currentSectionKey === 'education' && currentItemId && currentContext === 'details') { /* existing context prep */ }
            else if (currentSectionKey === 'skills' && currentItemId && currentContext === 'skills') { /* existing context prep */ }
            else { alert('AI for this context is not fully implemented.'); return; }

            const originalButtonText = target.textContent; target.disabled = true; target.textContent = 'Generating...';
            const formData = new FormData();
            formData.append('action', 'aicvb_generate_section_content');
            formData.append('nonce', aicvb_params.nonce);
            for (const keyInPrompt in promptData) { formData.append(keyInPrompt, promptData[keyInPrompt]); }

            fetch(aicvb_params.ajax_url, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                target.disabled = false; target.textContent = originalButtonText;
                if (data.success) {
                    if (currentSectionKey === 'summary') cvData.summary = data.data.generated_content;
                    else if (cvData[currentSectionKey] && currentItemId) {
                        const itemIndex = cvData[currentSectionKey].findIndex(item => item.id === currentItemId);
                        if (itemIndex !== -1 && data.data.generated_content) {
                            if (currentContext === 'responsibilities' || currentContext === 'details' || currentContext === 'skills') {
                                cvData[currentSectionKey][itemIndex][currentContext] = data.data.generated_content; // Assuming array
                            }
                        }
                    }
                    saveCvDataToLocalStorage();
                    renderCvDisplayAndForms(cvData);
                    alert('AI content generated and updated!');
                } else {
                    alert('Error from AI: ' + (data.data.message || 'Unknown error'));
                }
            })
            .catch(error => { target.disabled = false; target.textContent = originalButtonText; alert('Request failed: ' + error.message); });
        }
    });

    const resetButton = document.getElementById('aicvb-reset-cv-btn');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to start a new CV? All current data in this browser session will be lost.')) {
                localStorage.removeItem(AICVB_LOCAL_STORAGE_KEY);
                cvData = { personalInfo: { name: '', title: '', email: '', phone: '', linkedin: '', github: '', portfolio: '', address: '' }, summary: '', experience: [], education: [], skills: [] };

                if(cvEditorFormsArea) cvEditorFormsArea.innerHTML = '';
                if(cvPreviewArea) cvPreviewArea.innerHTML = '';

                if (initialSetupSection && cvDisplayEditSection) {
                    initialSetupSection.classList.remove('aicvb-hidden');
                    cvDisplayEditSection.classList.add('aicvb-hidden');
                }
                const jobTitleInput = document.getElementById('aicvb-job-title');
                const jobDescriptionInput = document.getElementById('aicvb-job-description');
                if(jobTitleInput) jobTitleInput.value = '';
                if(jobDescriptionInput) jobDescriptionInput.value = '';
                alert('CV has been reset. You can start a new one.');
            }
        });
    }
});
