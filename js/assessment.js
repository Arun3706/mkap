// Assessment JavaScript
let currentAssessment = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let assessmentTimer = null;
let timeRemaining = 0;
let startTime = null;

// Make assessment functions globally available
window.loadAssignedAssessments = loadAssignedAssessments;
window.startAssessment = startAssessment;
window.nextQuestion = nextQuestion;
window.previousQuestion = previousQuestion;
window.saveAndNext = saveAndNext;
window.submitAssessment = submitAssessment;
window.confirmSubmit = confirmSubmit;
window.selectLikert = selectLikert;

function initializeAssessmentInterface() {
    // Check if assessment templates are loaded
    if (!window.assessmentTemplates || Object.keys(window.assessmentTemplates).length === 0) {
        console.error('Assessment templates not loaded. Attempting to load...');
        $.getScript('data/assessment-templates.js')
            .done(function() {
                console.log('Assessment templates loaded successfully');
                continueAssessmentInitialization();
            })
            .fail(function(jqxhr, settings, exception) {
                console.error('Failed to load assessment templates:', exception);
                showError('Failed to load assessment data. Please refresh the page.');
            });
    } else {
        continueAssessmentInitialization();
    }
}

function continueAssessmentInitialization() {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    console.log('Initializing assessment interface...');
    console.log('Available templates:', Object.keys(window.assessmentTemplates || {}));
    
    // Check if we're on the assessment page or dashboard
    if (window.location.pathname.includes('assessment.html') || 
        window.location.pathname.includes('dashboard.html')) {
        // For dashboard, this will be triggered when the tab is shown
        if (!window.location.pathname.includes('dashboard.html')) {
            loadAssignedAssessments();
        }
    }
    
    // Initialize assessment
    initializeAssessment();
    
    // Set up event handlers
    if (typeof setupAssessmentHandlers === 'function') {
        setupAssessmentHandlers();
    }
}

// Start initialization when document is ready
$(document).ready(initializeAssessmentInterface);

function initializeAssessment() {
    // Check if returning to assessment or starting new
    const selectedCategory = getStorageItem('selectedAssessmentCategory');
    
    if (selectedCategory) {
        // Load specific assessment
        loadAssessmentByCategory(selectedCategory);
    } else {
        // Show assessment selection
        showAssessmentSelection();
    }
}

function showAssessmentSelection() {
    $('#assessmentSelection').removeClass('d-none');
    $('#assessmentInstructions, #assessmentQuestions, #assessmentComplete').addClass('d-none');
    
    loadAvailableAssessments();
}

function loadAssignedAssessments() {
    console.log('Loading assigned assessments...');
    const currentUser = getCurrentUser();
    console.log('Current user:', currentUser);
    
    const assignments = getStorageItem('assessmentAssignments') || [];
    console.log('All assignments:', assignments);
    
    const userAssignments = assignments.filter(assignment => {
        const isAssigned = assignment.assignedTo.some(assignee => {
            return (assignee.type === 'user' && assignee.value === currentUser.id) ||
                   (assignee.type === 'department' && assignee.value === currentUser.department) ||
                   (assignee.type === 'department' && assignee.value === 'all');
        });
        console.log(`Assignment ${assignment.id} is assigned to user:`, isAssigned);
        return isAssigned;
    });
    
    console.log('Filtered user assignments:', userAssignments);

    if (userAssignments.length > 0) {
        $('#assignedAssessments').removeClass('d-none');
        $('#assessmentSelection').addClass('d-none');
        const container = $('#assignedAssessmentsList');
        console.log('Available templates:', Object.keys(window.assessmentTemplates || {}));
        
        const assessmentHTML = userAssignments.map(assignment => {
            console.log(`Processing assignment with template: ${assignment.template}`);
            const template = window.assessmentTemplates[assignment.template];
            console.log('Template data:', template);
            
            if (!template) {
                console.error(`Template not found: ${assignment.template}`);
                return ''; // Skip this assignment if template not found
            }
            
            return `
                <div class="col-md-4">
                    <div class="card assessment-option" onclick="selectAssessment('${assignment.template}')">
                        <div class="card-body text-center">
                            <div class="assessment-icon ${assignment.template}">
                                <i class="fas ${template.icon || 'fa-clipboard-list'}"></i>
                            </div>
                            <h5 class="card-title">${template.title}</h5>
                            <p class="card-text">${template.description}</p>
                            <div class="assessment-meta">
                                <span><i class="fas fa-clock me-1"></i>${template.timeLimit} min</span>
                                <span><i class="fas fa-question-circle me-1"></i>${template.questions.length} questions</span>
                            </div>
                            <div class="mt-3">
                                <button class="btn btn-primary btn-sm" onclick="selectAssessment('${assignment.template}')">
                                    <i class="fas fa-play-circle me-2"></i>
                                    Start Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.html(assessmentHTML);
    } else {
        $('#assessmentSelection').removeClass('d-none');
    }
}

function loadAvailableAssessments() {
    const container = $('#assessmentOptions');
    
    const merged = (typeof getMergedAssessmentTemplates === 'function') ? getMergedAssessmentTemplates() : window.assessmentTemplates;
    if (!merged) {
        container.html('<p class="text-center text-muted">Assessment templates not available</p>');
        return;
    }
    
    const currentUser = getCurrentUser();
    const completedAssessments = getStorageItem('assessmentResults') || [];
    const userCompletedCategories = completedAssessments
        .filter(a => a.userId === currentUser.id)
        .map(a => a.category);
    
    const assessmentHTML = Object.entries(merged).map(([category, template]) => {
        const isCompleted = userCompletedCategories.includes(category);
        const statusIcon = isCompleted ? 'fa-check-circle text-success' : 'fa-play-circle text-primary';
        const actionText = isCompleted ? 'Retake Assessment' : 'Start Assessment';
        
        return `
            <div class="col-md-4">
                <div class="card assessment-option" onclick="selectAssessment('${category}')">
                    <div class="card-body text-center">
                        <div class="assessment-icon ${category}">
                            <i class="fas ${template.icon || 'fa-clipboard-list'}"></i>
                        </div>
                        <h5 class="card-title">${template.title}</h5>
                        <p class="card-text">${template.description}</p>
                        <div class="assessment-meta">
                            <span><i class="fas fa-clock me-1"></i>${template.timeLimit} min</span>
                            <span><i class="fas fa-question-circle me-1"></i>${template.questions.length} questions</span>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-primary btn-sm" onclick="selectAssessment('${category}')">
                                <i class="fas ${statusIcon} me-2"></i>
                                ${actionText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.html(assessmentHTML);
}

function selectAssessment(category) {
    const merged = (typeof getMergedAssessmentTemplates === 'function') ? getMergedAssessmentTemplates() : window.assessmentTemplates;
    if (!merged || !merged[category]) {
        showAlert('Assessment template not found', 'danger');
        return;
    }
    
    currentAssessment = {
        category: category,
        ...merged[category]
    };
    
    // Reset assessment state
    currentQuestionIndex = 0;
    userAnswers = {};
    
    showInstructions();
}

function showInstructions() {
    $('#assessmentSelection').addClass('d-none');
    $('#assessmentInstructions').removeClass('d-none');
    $('#assessmentQuestions, #assessmentComplete').addClass('d-none');
    
    // Update instruction content
    $('#assessmentTitle').text(currentAssessment.title);
    
    const instructionsHTML = `
        <div class="row">
            <div class="col-md-8">
                <h5>Assessment Overview</h5>
                <p>${currentAssessment.description}</p>
                
                <h6>Instructions:</h6>
                <ul class="instruction-list">
                    <li>
                        <i class="fas fa-clock instruction-icon"></i>
                        <div>
                            <strong>Time Limit:</strong> You have ${currentAssessment.timeLimit} minutes to complete this assessment.
                        </div>
                    </li>
                    <li>
                        <i class="fas fa-question-circle instruction-icon"></i>
                        <div>
                            <strong>Questions:</strong> This assessment contains ${currentAssessment.questions.length} questions of various types.
                        </div>
                    </li>
                    <li>
                        <i class="fas fa-save instruction-icon"></i>
                        <div>
                            <strong>Auto-Save:</strong> Your answers are automatically saved as you progress.
                        </div>
                    </li>
                    <li>
                        <i class="fas fa-exclamation-triangle instruction-icon"></i>
                        <div>
                            <strong>Important:</strong> Once submitted, you cannot modify your answers.
                        </div>
                    </li>
                </ul>
                
                <h6>Question Types:</h6>
                <div class="row">
                    ${getQuestionTypesHTML()}
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Assessment Details</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Category:</strong><br>
                            <span class="badge bg-primary">${currentAssessment.category.toUpperCase()}</span>
                        </div>
                        <div class="mb-3">
                            <strong>Duration:</strong><br>
                            ${currentAssessment.timeLimit} minutes
                        </div>
                        <div class="mb-3">
                            <strong>Questions:</strong><br>
                            ${currentAssessment.questions.length} questions
                        </div>
                        <div class="mb-3">
                            <strong>Difficulty:</strong><br>
                            <span class="badge bg-warning">${currentAssessment.difficulty || 'Mixed'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#instructionsContent').html(instructionsHTML);
}

function getQuestionTypesHTML() {
    const questionTypes = [...new Set(currentAssessment.questions.map(q => q.type))];
    
    const typeDescriptions = {
        'multiple_choice': {
            icon: 'fa-check-circle',
            title: 'Multiple Choice',
            description: 'Select one correct answer from the options'
        },
        'multiple_select': {
            icon: 'fa-check-square',
            title: 'Multiple Select',
            description: 'Select all correct answers from the options'
        },
        'ranking': {
            icon: 'fa-sort',
            title: 'Ranking',
            description: 'Drag and drop items to rank them in order'
        },
        'text_input': {
            icon: 'fa-keyboard',
            title: 'Text Input',
            description: 'Type your answer in the text area'
        },
        'rating_scale': {
            icon: 'fa-star',
            title: 'Rating Scale',
            description: 'Rate items on a numerical scale'
        },
        'likert': {
            icon: 'fa-balance-scale',
            title: 'Likert Scale',
            description: 'Rate your agreement on a 1-5 scale'
        }
    };
    
    return questionTypes.map(type => {
        const desc = typeDescriptions[type] || { icon: 'fa-question', title: type, description: 'Answer the question' };
        return `
            <div class="col-md-6 mb-2">
                <div class="d-flex align-items-center">
                    <i class="fas ${desc.icon} text-primary me-2"></i>
                    <div>
                        <strong>${desc.title}</strong><br>
                        <small class="text-muted">${desc.description}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function goBackToSelection() {
    showAssessmentSelection();
}

function startAssessment() {
    $('#assessmentInstructions').addClass('d-none');
    $('#assessmentQuestions').removeClass('d-none');
    $('#assessmentComplete').addClass('d-none');
    startTime = new Date();
    timeRemaining = currentAssessment.timeLimit * 60; // seconds
    initializeQuestionNavigation();
    loadQuestion(0);
    startTimer();
}

function initializeQuestionNavigation() {
    $('#totalQuestions').text(currentAssessment.questions.length);
    
    const navigation = $('#questionNavigation');
    const navHTML = currentAssessment.questions.map((_, index) => 
        `<button class="btn question-nav-item" onclick="navigateToQuestion(${index})" title="Question ${index + 1}">${index + 1}</button>`
    ).join('');
    
    navigation.html(navHTML);
    updateNavigationState();
}

function loadQuestion(index) {
    if (index < 0 || index >= currentAssessment.questions.length) return;
    
    currentQuestionIndex = index;
    const question = currentAssessment.questions[index];
    
    // Update question number
    $('#currentQuestionNum').text(index + 1);
    
    // Update progress bar
    const progress = ((index + 1) / currentAssessment.questions.length) * 100;
    $('#progressBar').css('width', progress + '%');
    
    // Load question content
    const questionHTML = generateQuestionHTML(question, index);
    $('#questionContent').html(questionHTML);
    
    // Update navigation
    updateNavigationState();
    
    // Update button states
    updateNavigationButtons();
    
    // Initialize question-specific handlers
    initializeQuestionHandlers(question.type);
    
    // Load existing answer if any
    loadExistingAnswer(index);
    
    // Update navigation state after loading
    updateNavigationState();
}

function generateQuestionHTML(question, index) {
    const questionHeader = `
        <div class="question-header">
            <div class="question-number">Question ${index + 1}</div>
            <div class="question-category">${currentAssessment.category.toUpperCase()}</div>
        </div>
        <div class="question-text">${question.text}</div>
    `;
    
    let questionBody = '';
    
    switch (question.type) {
        case 'multiple_choice':
            questionBody = generateMultipleChoiceHTML(question, index);
            break;
        case 'multiple_select':
            questionBody = generateMultipleSelectHTML(question, index);
            break;
        case 'ranking':
            questionBody = generateRankingHTML(question, index);
            break;
        case 'text_input':
            questionBody = generateTextInputHTML(question, index);
            break;
        case 'rating_scale':
            questionBody = generateRatingScaleHTML(question, index);
            break;
        case 'likert':
            questionBody = generateLikertHTML(question, index);
            break;
        default:
            questionBody = '<p class="text-danger">Unsupported question type</p>';
    }
    
    return questionHeader + questionBody;
}

function generateMultipleChoiceHTML(question, index) {
    const optionsHTML = question.options.map((option, optionIndex) => `
        <div class="option-container">
            <div class="option-item" onclick="selectOption(${index}, ${optionIndex})">
                <div class="option-letter">${String.fromCharCode(65 + optionIndex)}</div>
                <input type="radio" name="question_${index}" value="${optionIndex}" style="display: none;">
                <div class="option-text">${option}</div>
            </div>
        </div>
    `).join('');
    
    return `<div class="options-container">${optionsHTML}</div>`;
}

function generateMultipleSelectHTML(question, index) {
    const optionsHTML = question.options.map((option, optionIndex) => `
        <div class="option-container">
            <div class="option-item" onclick="toggleOption(${index}, ${optionIndex})">
                <input type="checkbox" name="question_${index}" value="${optionIndex}">
                <div class="option-text">${option}</div>
            </div>
        </div>
    `).join('');
    
    return `<div class="options-container">${optionsHTML}</div>`;
}

function generateRankingHTML(question, index) {
    const itemsHTML = question.options.map((option, optionIndex) => `
        <div class="ranking-item" data-option-index="${optionIndex}">
            <div class="ranking-number">${optionIndex + 1}</div>
            <div class="ranking-text">${option}</div>
            <div class="drag-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="ranking-container" id="ranking_${index}">
            <p class="text-muted mb-3">Drag and drop the items below to rank them in order of preference (1 = highest, ${question.options.length} = lowest):</p>
            ${itemsHTML}
        </div>
    `;
}

function generateTextInputHTML(question, index) {
    const maxLength = question.maxLength || 500;
    
    return `
        <div class="text-input-container">
            <textarea class="text-input" id="text_${index}" placeholder="Enter your answer here..." maxlength="${maxLength}"></textarea>
            <div class="character-counter">
                <span id="charCount_${index}">0</span> / ${maxLength}
            </div>
        </div>
    `;
}

function generateRatingScaleHTML(question, index) {
    const scale = question.scale || { min: 1, max: 5 };
    const labels = question.labels || { low: 'Strongly Disagree', high: 'Strongly Agree' };
    
    const ratingOptions = [];
    for (let i = scale.min; i <= scale.max; i++) {
        ratingOptions.push(`
            <div class="rating-option" onclick="selectRating(${index}, ${i})">
                <div class="rating-circle">${i}</div>
                <div class="rating-label">${i === scale.min ? labels.low : i === scale.max ? labels.high : ''}</div>
            </div>
        `);
    }
    
    return `
        <div class="rating-container">
            <div class="rating-scale">
                ${ratingOptions.join('')}
            </div>
            <div class="rating-endpoints">
                <span>${labels.low}</span>
                <span>${labels.high}</span>
            </div>
        </div>
    `;
}

function generateLikertHTML(question, index) {
    const likertOptions = [
        { value: 1, label: 'Strongly disagree' },
        { value: 2, label: 'Disagree' },
        { value: 3, label: 'Neither/Neutral' },
        { value: 4, label: 'Agree' },
        { value: 5, label: 'Strongly agree' }
    ];
    
    const optionsHTML = likertOptions.map(option => `
        <div class="likert-option" onclick="selectLikert(${index}, ${option.value})">
            <div class="likert-circle" id="likert_${index}_${option.value}">${option.value}</div>
            <div class="likert-label">${option.label}</div>
        </div>
    `).join('');
    
    return `
        <div class="likert-container">
            <div class="likert-scale">
                ${optionsHTML}
            </div>
            <div class="likert-subscale-info">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Subscale: ${question.subscale || 'General'}
                    ${question.reverse ? '<span class="badge bg-warning ms-2">Reverse-coded</span>' : ''}
                </small>
            </div>
        </div>
    `;
}

function initializeQuestionHandlers(questionType) {
    switch (questionType) {
        case 'ranking':
            initializeSortable();
            break;
        case 'text_input':
            initializeTextInput();
            break;
    }
}

function initializeSortable() {
    const container = document.querySelector(`#ranking_${currentQuestionIndex}`);
    if (container && typeof Sortable !== 'undefined') {
        new Sortable(container, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                updateRankingAnswer();
            }
        });
    }
}

function initializeTextInput() {
    const textArea = $(`#text_${currentQuestionIndex}`);
    const charCounter = $(`#charCount_${currentQuestionIndex}`);
    
    textArea.on('input', function() {
        const length = $(this).val().length;
        const maxLength = parseInt($(this).attr('maxlength'));
        
        charCounter.text(length);
        
        // Update counter color based on usage
        charCounter.removeClass('warning danger');
        if (length > maxLength * 0.8) {
            charCounter.addClass('warning');
        }
        if (length > maxLength * 0.95) {
            charCounter.addClass('danger');
        }
        
        // Save answer
        saveAnswer(currentQuestionIndex, $(this).val());
    });
}

// Answer handling functions
function selectOption(questionIndex, optionIndex) {
    // Clear previous selections
    $(`.option-item input[name="question_${questionIndex}"]`).prop('checked', false);
    $('.option-item').removeClass('selected');
    
    // Select current option
    const selectedOption = $(`.option-item input[name="question_${questionIndex}"]`).eq(optionIndex);
    selectedOption.prop('checked', true);
    selectedOption.closest('.option-item').addClass('selected');
    
    // Save answer
    saveAnswer(questionIndex, optionIndex);
}

function toggleOption(questionIndex, optionIndex) {
    const checkbox = $(`.option-item input[name="question_${questionIndex}"]`).eq(optionIndex);
    const optionItem = checkbox.closest('.option-item');
    
    // Toggle selection
    const isChecked = !checkbox.prop('checked');
    checkbox.prop('checked', isChecked);
    
    if (isChecked) {
        optionItem.addClass('selected');
    } else {
        optionItem.removeClass('selected');
    }
    
    // Get all selected options
    const selectedOptions = [];
    $(`.option-item input[name="question_${questionIndex}"]:checked`).each(function() {
        selectedOptions.push(parseInt($(this).val()));
    });
    
    // Save answer
    saveAnswer(questionIndex, selectedOptions);
}

function selectRating(questionIndex, rating) {
    // Clear previous selections
    $('.rating-option').removeClass('selected');
    
    // Select current rating
    $(`.rating-option`).eq(rating - 1).addClass('selected');
    
    // Save answer
    saveAnswer(questionIndex, rating);
}

function selectLikert(questionIndex, value) {
    // Clear previous selections for this question
    $(`.likert-circle[id^="likert_${questionIndex}_"]`).removeClass('selected');
    $(`.likert-option`).removeClass('selected');
    
    // Select current likert option
    $(`#likert_${questionIndex}_${value}`).addClass('selected');
    $(`#likert_${questionIndex}_${value}`).closest('.likert-option').addClass('selected');
    
    // Save answer
    saveAnswer(questionIndex, value);
}

function updateRankingAnswer() {
    const container = $(`#ranking_${currentQuestionIndex}`);
    const rankings = [];
    
    container.find('.ranking-item').each(function(index) {
        const optionIndex = parseInt($(this).data('option-index'));
        rankings.push(optionIndex);
        
        // Update ranking number
        $(this).find('.ranking-number').text(index + 1);
    });
    
    saveAnswer(currentQuestionIndex, rankings);
}

function saveAnswer(questionIndex, answer) {
    userAnswers[questionIndex] = {
        questionIndex: questionIndex,
        answer: answer,
        timestamp: new Date().toISOString()
    };
    
    // Update navigation state
    updateNavigationState();
    
    // Auto-save to storage
    setStorageItem('currentAssessmentAnswers', userAnswers);
}

function loadExistingAnswer(questionIndex) {
    const answer = userAnswers[questionIndex];
    if (!answer) return;
    
    const question = currentAssessment.questions[questionIndex];
    
    switch (question.type) {
        case 'multiple_choice':
            selectOption(questionIndex, answer.answer);
            break;
        case 'multiple_select':
            answer.answer.forEach(optionIndex => {
                toggleOption(questionIndex, optionIndex);
            });
            break;
        case 'text_input':
            $(`#text_${questionIndex}`).val(answer.answer);
            $(`#charCount_${questionIndex}`).text(answer.answer.length);
            break;
        case 'rating_scale':
            selectRating(questionIndex, answer.answer);
            break;
        case 'likert':
            selectLikert(questionIndex, answer.answer);
            break;
        case 'ranking':
            // Restore ranking order
            const container = $(`#ranking_${currentQuestionIndex}`);
            const items = container.find('.ranking-item').toArray();
            
            answer.answer.forEach((optionIndex, newIndex) => {
                const item = items.find(el => parseInt($(el).data('option-index')) === optionIndex);
                if (item) {
                    container.append(item);
                    $(item).find('.ranking-number').text(newIndex + 1);
                }
            });
            break;
    }
}

// Navigation functions
function updateNavigationState() {
    $('.question-nav-item').removeClass('current answered');
    
    currentAssessment.questions.forEach((_, index) => {
        const navItem = $('.question-nav-item').eq(index);
        
        if (index === currentQuestionIndex) {
            navItem.addClass('current');
        }
        
        if (userAnswers[index]) {
            navItem.addClass('answered');
        }
    });
}

function updateNavigationButtons() {
    const isFirstQuestion = currentQuestionIndex === 0;
    const isLastQuestion = currentQuestionIndex === currentAssessment.questions.length - 1;
    
    $('#prevBtn').prop('disabled', isFirstQuestion);
    
    if (isLastQuestion) {
        $('#nextBtn').addClass('d-none');
        $('#submitBtn').removeClass('d-none').show();
    } else {
        $('#nextBtn').removeClass('d-none');
        $('#submitBtn').addClass('d-none').hide();
    }
}

function navigateToQuestion(index) {
    loadQuestion(index);
}

function previousQuestion() {
    // Save current answer before moving to previous question
    saveCurrentAnswer();
    
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
}

function nextQuestion() {
    // Save current answer before moving to next question
    saveCurrentAnswer();
    
    if (currentQuestionIndex < currentAssessment.questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    }
}

function saveAndNext() {
    saveCurrentAnswer();
    if (currentQuestionIndex < currentAssessment.questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
    } else {
        // Automatically trigger submit modal when last question is answered
        submitAssessment();
    }
}
window.saveAndNext = saveAndNext;

// Timer functions
function startTimer() {
    updateTimerDisplay();
    
    assessmentTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(assessmentTimer);
            autoSubmitAssessment();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    $('#timeRemaining').text(timeString);
    
    // Add warning classes
    $('#timeRemaining').removeClass('timer-warning timer-danger');
    if (timeRemaining <= 300) { // 5 minutes
        $('#timeRemaining').addClass('timer-warning');
    }
    if (timeRemaining <= 60) { // 1 minute
        $('#timeRemaining').addClass('timer-danger');
    }
}

function submitAssessment() {
    console.log('Submit assessment called');
    
    // Save current answer before submitting
    saveCurrentAnswer();
    
    const unansweredCount = currentAssessment.questions.length - Object.keys(userAnswers).length;
    
    if (unansweredCount > 0) {
        $('#unansweredCount').text(unansweredCount);
        $('#unansweredQuestions').removeClass('d-none');
    } else {
        $('#unansweredQuestions').addClass('d-none');
    }
    
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));
    submitModal.show();
}

function saveCurrentAnswer() {
    const question = currentAssessment.questions[currentQuestionIndex];
    
    switch (question.type) {
        case 'multiple_choice':
            const selectedOption = $(`input[name="question_${currentQuestionIndex}"]:checked`).val();
            if (selectedOption !== undefined) {
                userAnswers[currentQuestionIndex] = { answer: parseInt(selectedOption) };
            }
            break;
        case 'multiple_select':
            const selectedOptions = [];
            $(`input[name="question_${currentQuestionIndex}"]:checked`).each(function() {
                selectedOptions.push(parseInt($(this).val()));
            });
            if (selectedOptions.length > 0) {
                userAnswers[currentQuestionIndex] = { answer: selectedOptions };
            }
            break;
        case 'text_input':
            const textAnswer = $(`#textInput_${currentQuestionIndex}`).val();
            if (textAnswer.trim()) {
                userAnswers[currentQuestionIndex] = { answer: textAnswer };
            }
            break;
        case 'rating_scale':
            const ratingAnswer = $(`input[name="rating_${currentQuestionIndex}"]:checked`).val();
            if (ratingAnswer !== undefined) {
                userAnswers[currentQuestionIndex] = { answer: parseInt(ratingAnswer) };
            }
            break;
        case 'likert':
            const likertAnswer = $(`input[name="likert_${currentQuestionIndex}"]:checked`).val();
            if (likertAnswer !== undefined) {
                userAnswers[currentQuestionIndex] = { answer: parseInt(likertAnswer) };
            }
            break;
    }
    
    // Update navigation state after saving
    updateNavigationState();
}

function confirmSubmit() {
    const submitModal = bootstrap.Modal.getInstance(document.getElementById('submitModal'));
    submitModal.hide();
    
    processAssessmentSubmission();
}

function autoSubmitAssessment() {
    showAlert('Time is up! Your assessment has been automatically submitted.', 'warning');
    processAssessmentSubmission();
}

function processAssessmentSubmission() {
    // Clear timer
    if (assessmentTimer) {
        clearInterval(assessmentTimer);
    }

    // Calculate results
    const results = calculateAssessmentResults();

    // Check for missing answers before saving
    if (!results.answers || Object.keys(results.answers).length !== results.totalQuestions) {
        showAlert('Some answers are missing or incomplete. Please answer all questions before submitting.', 'danger');
        return;
    }

    // Save results
    saveAssessmentResults(results);

    // Show completion screen
    showAssessmentComplete(results);
}

function calculateAssessmentResults() {
    const totalQuestions = currentAssessment.questions.length;
    const answeredQuestions = Object.keys(userAnswers).length;
    const endTime = new Date();
    const timeSpent = Math.round((endTime - startTime) / 1000); // in seconds
    
    // Check if this is a Likert scale assessment
    const isLikertAssessment = currentAssessment.questions.length > 0 && 
                              currentAssessment.questions[0].type === "likert";
    
    let score, correctAnswers, subscaleScores;
    
    if (isLikertAssessment) {
        // Use the assessment helpers for Likert scale scoring
        if (typeof window.assessmentHelpers !== 'undefined' && window.assessmentHelpers.calculateScore) {
            const likertResults = window.assessmentHelpers.calculateScore(currentAssessment, userAnswers);
            subscaleScores = likertResults;
            
            // Calculate overall average score for Likert assessments
            const subscaleValues = Object.values(likertResults).map(Number);
            const overallAverage = subscaleValues.reduce((sum, val) => sum + val, 0) / subscaleValues.length;
            score = Math.round(overallAverage * 20); // Convert 1-5 scale to percentage (1=20%, 5=100%)
            correctAnswers = answeredQuestions; // For Likert, all answered questions are "correct"
        } else {
            // Fallback calculation
            score = Math.round((answeredQuestions / totalQuestions) * 100);
            correctAnswers = answeredQuestions;
        }
    } else {
        // Traditional MCQ scoring
        correctAnswers = 0;
        currentAssessment.questions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            if (userAnswer && question.correctAnswer !== undefined) {
                if (Array.isArray(question.correctAnswer)) {
                    // Multiple select or ranking
                    if (JSON.stringify(userAnswer.answer) === JSON.stringify(question.correctAnswer)) {
                        correctAnswers++;
                    }
                } else {
                    // Single answer
                    if (userAnswer.answer === question.correctAnswer) {
                        correctAnswers++;
                    }
                }
            }
        });
        
        score = Math.round((correctAnswers / totalQuestions) * 100);
    }
    
    return {
        id: generateAssessmentId(),
        userId: getCurrentUser().id,
        category: currentAssessment.category,
        assessmentTitle: currentAssessment.title,
        totalQuestions: totalQuestions,
        answeredQuestions: answeredQuestions,
        correctAnswers: correctAnswers,
        score: score,
        timeSpent: timeSpent,
        completedAt: new Date().toISOString(),
        answers: userAnswers,
        subscaleScores: subscaleScores, // Add subscale scores for Likert assessments
        isLikertAssessment: isLikertAssessment
    };
}

function saveAssessmentResults(results) {
    const existingResults = getStorageItem('assessmentResults') || [];
    existingResults.push(results);
    setStorageItem('assessmentResults', existingResults);
    
    // Clear temporary data
    localStorage.removeItem('currentAssessmentAnswers');
    localStorage.removeItem('selectedAssessmentCategory');
}

function showAssessmentComplete(results) {
    $('#assessmentQuestions').addClass('d-none');
    $('#assessmentComplete').removeClass('d-none');
    
    // Update completion stats
    $('#questionsAnswered').text(results.answeredQuestions);
    $('#timeSpent').text(Math.round(results.timeSpent / 60) + ' min');
    $('#completionRate').text(Math.round((results.answeredQuestions / results.totalQuestions) * 100) + '%');
}

// Utility functions
function generateAssessmentId() {
    return 'assessment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Export functions for use in other modules
window.assessmentUtils = {
    generateAssessmentId,
    calculateAssessmentResults
};


function loadAssessmentByCategory(category) {
    if (typeof window.assessmentTemplates === 'undefined' || !window.assessmentTemplates[category]) {
        showAlert('Assessment template not found', 'danger');
        return;
    }

    currentAssessment = {
        category: category,
        ...window.assessmentTemplates[category]
    };

    // Reset assessment state
    currentQuestionIndex = 0;
    userAnswers = {};

    // Save selected category
    setStorageItem('selectedAssessmentCategory', category);

    // Show instructions page
    showInstructions();
}
