// Admin Panel JavaScript
let currentTab = 'dashboard';
let adminData = {
    users: [],
    assessments: [],
    analytics: {}
};
let categoryScoreChartInstance = null;

$(document).ready(function() {
    // Check admin authentication
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize admin panel
    initializeAdminPanel();
    
    // Set up event handlers
    setupAdminEventHandlers();
    
    // Load initial data
    loadAdminData();
});

function initializeAdminPanel() {
    // Set up tab navigation
    $('.sidebar .nav-link').on('click', function(e) {
        const tab = $(this).data('tab');
        // Only intercept clicks for in-page tabs
        if (tab) {
            e.preventDefault();
            switchTab(tab);
        }
    });
    
    // Initialize search and filter handlers
    setupSearchAndFilters();
    
    // Initialize chart containers
    initializeCharts();

    // Initialize builder and departments UIs
    initializeBuilderUI();
    initializeDepartmentsUI();
}

function initializeCharts() {
    // Destroy existing chart instances to prevent conflicts
    if (window.performanceChartInstance) {
        window.performanceChartInstance.destroy();
        window.performanceChartInstance = null;
    }
    if (window.departmentChartInstance) {
        window.departmentChartInstance.destroy();
        window.departmentChartInstance = null;
    }
    if (window.scoreDistributionChartInstance) {
        window.scoreDistributionChartInstance.destroy();
        window.scoreDistributionChartInstance = null;
    }
    if (window.skillComparisonChartInstance) {
        window.skillComparisonChartInstance.destroy();
        window.skillComparisonChartInstance = null;
    }
    if (window.userComparisonChartInstance) {
        window.userComparisonChartInstance.destroy();
        window.userComparisonChartInstance = null;
    }
}

function setupAdminEventHandlers() {
    // Logout handler
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Refresh data handler
    $(document).on('click', '[onclick="refreshData()"]', refreshData);
    
    // Export handlers
    $(document).on('click', '[onclick="exportUsers()"]', exportUsers);
    $(document).on('click', '[onclick="exportAssessments()"]', exportAssessments);
    $(document).on('click', '[onclick="generateReport()"]', generateReport);
    $(document).on('click', '[onclick="exportAllData()"]', exportAllData);
    $(document).on('click', '[onclick="exportUserProfiles()"]', exportUserProfiles);
    $(document).on('click', '[onclick="exportAssessmentData()"]', exportAssessmentData);
    $(document).on('click', '[onclick="clearOldData()"]', clearOldData);
    
    // Period selector for analytics
    $(document).on('click', '[data-period]', function() {
        $('[data-period]').removeClass('active');
        $(this).addClass('active');
        const period = $(this).data('period');
        updateAnalyticsPeriod(period);
    });
}

function loadAdminData() {
    try {
        // Load users from storage or use demo data
        adminData.users = getStorageItem('users') || [];
        if (adminData.users.length === 0 && typeof window.demoUsers !== 'undefined') {
            adminData.users = [...window.demoUsers];
            setStorageItem('users', adminData.users);
        }
        
        // Load assessment results from storage or use demo data
        adminData.assessments = getStorageItem('assessmentResults') || [];
        if (adminData.assessments.length === 0 && typeof window.demoAssessmentResults !== 'undefined') {
            adminData.assessments = [...window.demoAssessmentResults];
            setStorageItem('assessmentResults', adminData.assessments);
        }
        
        // Update dashboard
        updateDashboardStats();
        // Load current tab content
        switchTab('dashboard');
    } catch (error) {
        handleError(error, 'Loading admin data');
    }
}

function switchTab(tabName) {
    // Update active state
    $('.sidebar .nav-link').removeClass('active');
    $(`.sidebar .nav-link[data-tab="${tabName}"]`).addClass('active');
    
    // Hide all tab content
    $('.tab-content').addClass('d-none');
    
    // Show selected tab
    $(`#${tabName}-tab`).removeClass('d-none');
    
    currentTab = tabName;
    
    // Load tab-specific content
    switch (tabName) {
        case 'dashboard':
            loadDashboardTab();
            break;
        case 'users':
            loadUsersTab();
            break;
        case 'assessments':
            loadAssessmentsTab();
            break;
        case 'analytics':
            loadAnalyticsTab();
            break;
        case 'builder':
            loadBuilderTab();
            break;
        case 'departments':
            loadDepartmentsTab();
            break;
        case 'reports':
            loadReportsTab();
            break;
    }
}

function updateDashboardStats() {
    const users = adminData.users.filter(u => u.role !== 'admin');
    const assessments = adminData.assessments;
    
    // Total users
    $('#totalUsers').text(users.length);
    
    // Completed assessments
    $('#assessmentsCompleted').text(assessments.length);
    
    // Average score
    if (assessments.length > 0) {
        const avgScore = calculateAverage(assessments.map(a => a.score));
        $('#averageScore').text(Math.round(avgScore) + '%');
    } else {
        $('#averageScore').text('0%');
    }
    
    // Active users (logged in within last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const activeUsers = users.filter(u => 
        u.lastLogin && new Date(u.lastLogin) > weekAgo
    ).length;
    $('#activeUsers').text(activeUsers);
}

function loadDashboardTab() {
    // Load performance chart
    loadPerformanceChart();
    
    // Load department chart
    loadDepartmentChart();
    
    // Load recent activity
    loadRecentActivity();
}

function loadPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    try {
        // Validate data exists
        if (!adminData.assessments || adminData.assessments.length === 0) {
            console.warn('No assessment data available for performance chart');
            return;
        }
        
        // Group assessments by completion date
        const assessmentsByDate = groupBy(adminData.assessments, assessment => {
            const date = new Date(assessment.completedAt);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD format
        });
        
        // Get last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const chartData = last7Days.map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: assessmentsByDate[date] ? assessmentsByDate[date].length : 0,
            avgScore: assessmentsByDate[date] ? 
                Math.round(calculateAverage(assessmentsByDate[date].map(a => a.score))) : 0
        }));
        
        window.performanceChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => d.date),
                datasets: [{
                    label: 'Assessments Completed',
                    data: chartData.map(d => d.count),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'Average Score (%)',
                    data: chartData.map(d => d.avgScore),
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Assessments Count'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Average Score (%)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading performance chart:', error);
    }
}

function loadDepartmentChart() {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;
    
    try {
        const users = adminData.users.filter(u => u.role !== 'admin');
        if (users.length === 0) {
            console.warn('No user data available for department chart');
            return;
        }
        
        const departmentCounts = groupBy(users, 'department');
        
        const labels = Object.keys(departmentCounts);
        const data = Object.values(departmentCounts).map(dept => dept.length);
        const colors = generateChartColors(labels.length);
        
        window.departmentChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading department chart:', error);
    }
}

function loadRecentActivity() {
    const container = $('#recentActivity');
    
    try {
        // Combine user registrations and assessment completions
        const activities = [];
        
        // User registrations
        adminData.users.forEach(user => {
            if (user.role !== 'admin') {
                activities.push({
                    type: 'user_registration',
                    user: user.fullName,
                    timestamp: user.registeredAt,
                    description: `${user.fullName} registered as a new user`
                });
            }
        });
        
        // Assessment completions
        adminData.assessments.forEach(assessment => {
            const user = adminData.users.find(u => u.id === assessment.userId);
            activities.push({
                type: 'assessment_completion',
                user: user ? user.fullName : 'Unknown User',
                timestamp: assessment.completedAt,
                description: `Completed ${assessment.assessmentTitle} with ${assessment.score}% score`
            });
        });
        
        // Sort by timestamp (most recent first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Take last 10 activities
        const recentActivities = activities.slice(0, 10);
        
        if (recentActivities.length === 0) {
            container.html('<p class="text-muted">No recent activity</p>');
            return;
        }
        
        const activityHTML = recentActivities.map(activity => {
            const iconClass = activity.type === 'user_registration' ? 'user-activity' : 'assessment-activity';
            const icon = activity.type === 'user_registration' ? 'fa-user-plus' : 'fa-clipboard-check';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.user}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${formatRelativeTime(activity.timestamp)}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.html(activityHTML);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        container.html('<p class="text-danger">Error loading activity</p>');
    }
}

function loadUsersTab() {
    const tbody = $('#usersTable tbody');
    
    try {
        const users = adminData.users.filter(u => u.role !== 'admin');
        
        if (users.length === 0) {
            tbody.html('<tr><td colspan="7" class="text-center text-muted">No users found</td></tr>');
            return;
        }
        
        const usersHTML = users.map(user => {
            const assessments = adminData.assessments.filter(a => a.userId === user.id);
            const lastActive = user.lastLogin || user.registeredAt;
            
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="user-avatar me-3" style="width: 40px; height: 40px; font-size: 1rem;">
                                ${user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="fw-semibold">${sanitizeInput(user.fullName)}</div>
                                <small class="text-muted">${user.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>${sanitizeInput(user.email)}</td>
                    <td><span class="badge bg-primary">${sanitizeInput(user.department)}</span></td>
                    <td>${sanitizeInput(user.experience)}</td>
                    <td>
                        <span class="badge bg-info">${assessments.length}</span>
                        ${assessments.length > 0 ? 
                            `<small class="text-muted d-block">Avg: ${Math.round(calculateAverage(assessments.map(a => a.score)))}%</small>` 
                            : ''
                        }
                    </td>
                    <td>
                        <div class="user-status">
                            <span class="status-indicator ${getStatusIndicator(lastActive)}"></span>
                            ${formatRelativeTime(lastActive)}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${user.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="exportUserData('${user.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.html(usersHTML);
    } catch (error) {
        handleError(error, 'Loading users table');
    }
}

function loadAssessmentsTab() {
    const tbody = $('#assessmentsTable tbody');
    let selectedCategory = $('.category-btn.active').data('category') || '';
    try {
        let assessments = adminData.assessments;
        if (selectedCategory) {
            assessments = assessments.filter(a => a.category === selectedCategory);
        }
        if (assessments.length === 0) {
            tbody.html('<tr><td colspan="7" class="text-center text-muted">No assessments found</td></tr>');
            return;
        }
        const assessmentsHTML = assessments.map(assessment => {
            const user = adminData.users.find(u => u.id === assessment.userId);
            const scoreClass = getScoreClass(assessment.score);
            let matchBars = '';
            // Find other users who took the same assessment (by category and title)
            const others = adminData.assessments.filter(a =>
                a.id !== assessment.id &&
                a.category === assessment.category &&
                a.assessmentTitle === assessment.assessmentTitle
            );
            
            return `
                <tr>
                    <td>
                        <div class="fw-semibold">${user ? sanitizeInput(user.fullName) : 'Unknown User'}</div>
                        <small class="text-muted">${user ? sanitizeInput(user.email) : 'N/A'}</small>
                    </td>
                    <td>
                        <div>${sanitizeInput(assessment.assessmentTitle)}</div>
                        <span class="badge bg-secondary">${sanitizeInput(assessment.category.toUpperCase())}</span>
                    </td>
                    <td>
                        <span class="score-badge ${scoreClass}">${assessment.score}%</span>
                        <div class="progress mt-2" style="height: 8px;">
                            <div class="progress-bar ${scoreClass}" role="progressbar" style="width: ${assessment.score}%;" aria-valuenow="${assessment.score}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        ${(() => {
                            const overallRating = getOverallRating(assessment.score);
                            return `
                                <div class="mt-1">
                                    <div class="overall-rating">
                                        <span class="rating-label ${overallRating.class}">${overallRating.rating}</span>
                                        <div class="star-rating">
                                            ${generateStarRating(overallRating.stars)}
                                        </div>
                                    </div>
                                </div>
                            `;
                        })()}
                        ${assessment.isLikertAssessment ? 
                            `<small class="d-block text-muted">Likert Scale Assessment</small>
                             ${assessment.subscaleScores ? 
                                `<small class="d-block text-info">
                                    <i class="fas fa-chart-pie me-1"></i>
                                    ${Object.keys(assessment.subscaleScores).length} subscales
                                </small>` : ''
                             }` : 
                            `<small class="d-block text-muted">${assessment.correctAnswers}/${assessment.totalQuestions} correct</small>`
                        }
                    </td>
                    <td>${formatDuration(assessment.timeSpent)}</td>
                    <td>${formatDate(assessment.completedAt)}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewAssessmentDetails('${assessment.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="exportAssessmentResult('${assessment.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-info show-compatibility-btn" data-userid="${assessment.userId}">Show Compatibility</button>
                    </td>
                </tr>
                ${matchBars ? `<tr><td colspan="7">${matchBars}</td></tr>` : ''}
            `;
        }).join('');
        tbody.html(assessmentsHTML);
    } catch (error) {
        handleError(error, 'Loading assessments table');
    }
}

// -----------------------
// Builder (MCQ) functions
// -----------------------

function initializeBuilderUI() {
    // Add question block
    $(document).on('click', '#addMcqQuestionBtn', function() {
        const container = $('#mcqQuestionsContainer');
        const qIndex = container.children('.mcq-question').length;
        const block = `
            <div class="mcq-question card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="mb-0">Question ${qIndex + 1}</h6>
                        <button type="button" class="btn btn-sm btn-outline-danger remove-question-btn"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="mb-3">
                        <input type="text" class="form-control mcq-text" placeholder="Enter question text" required>
                    </div>
                    <div class="mb-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <label class="form-label mb-0">Options</label>
                            <button type="button" class="btn btn-sm btn-outline-secondary add-option-btn"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <div class="mcq-options"></div>
                </div>
            </div>`;
        container.append(block);
        // Seed with 4 options
        for (let i = 0; i < 4; i++) addOptionToQuestion(container.children('.mcq-question').last());
    });

    // Remove question
    $(document).on('click', '.remove-question-btn', function() {
        $(this).closest('.mcq-question').remove();
        renumberQuestions();
    });

    // Add option
    $(document).on('click', '.add-option-btn', function() {
        const q = $(this).closest('.mcq-question');
        addOptionToQuestion(q);
    });

    // Remove option
    $(document).on('click', '.remove-option-btn', function() {
        const q = $(this).closest('.mcq-question');
        $(this).closest('.mcq-option').remove();
        renumberOptions(q);
    });

    // Handle save form
    $(document).on('submit', '#mcqBuilderForm', function(e) {
        e.preventDefault();
        try {
            const categoryKey = $('#builderCategoryKey').val().trim();
            const title = $('#builderTitle').val().trim();
            const description = $('#builderDescription').val().trim();
            const timeLimit = parseInt($('#builderTimeLimit').val(), 10) || 20;
            const difficulty = $('#builderDifficulty').val();
            if (!categoryKey || !title || !description) {
                showAlert('Please fill all required fields.', 'warning');
                return;
            }
            // Build questions array
            const questions = [];
            let valid = true;
            $('#mcqQuestionsContainer .mcq-question').each(function() {
                const qText = $(this).find('.mcq-text').val().trim();
                const opts = [];
                let correctIndex = -1;
                $(this).find('.mcq-option').each(function(i) {
                    const text = $(this).find('.mcq-option-text').val().trim();
                    const checked = $(this).find('.mcq-correct').prop('checked');
                    if (text) opts.push(text); else valid = false;
                    if (checked) correctIndex = i;
                });
                if (!qText || opts.length < 2 || correctIndex < 0) valid = false;
                questions.push({ type: 'multiple_choice', text: qText, options: opts, correctAnswer: correctIndex });
            });
            if (!valid || questions.length === 0) {
                showAlert('Each question needs text, at least 2 options, and a correct answer.', 'danger');
                return;
            }
            const template = {
                title,
                description,
                timeLimit,
                difficulty,
                icon: 'fa-clipboard-list',
                questions
            };
            saveCustomAssessmentTemplate(categoryKey, template);
            showAlert('Assessment saved successfully!', 'success');
            $('#mcqBuilderForm')[0].reset();
            $('#mcqQuestionsContainer').empty();
            renderCustomAssessmentsList();
        } catch (error) {
            handleError(error, 'Saving custom assessment');
        }
    });
}

function addOptionToQuestion(questionEl) {
    const optionsContainer = questionEl.find('.mcq-options');
    const optIndex = optionsContainer.children('.mcq-option').length;
    const optionBlock = `
        <div class="mcq-option input-group mb-2">
            <span class="input-group-text">${String.fromCharCode(65 + optIndex)}</span>
            <input type="text" class="form-control mcq-option-text" placeholder="Option text" required>
            <div class="input-group-text">
                <input class="form-check-input mt-0 mcq-correct" type="radio" name="correct_${questionEl.index()}" title="Mark as correct">
            </div>
            <button class="btn btn-outline-danger remove-option-btn" type="button" title="Remove option"><i class="fas fa-times"></i></button>
        </div>`;
    optionsContainer.append(optionBlock);
}

function renumberQuestions() {
    $('#mcqQuestionsContainer .mcq-question').each(function(i) {
        $(this).find('h6').text(`Question ${i + 1}`);
        // Update radio group name to keep exclusivity per question
        $(this).find('.mcq-option .mcq-correct').attr('name', `correct_${i}`);
        renumberOptions($(this));
    });
}

function renumberOptions(questionEl) {
    questionEl.find('.mcq-option').each(function(i) {
        $(this).find('.input-group-text:first').text(String.fromCharCode(65 + i));
    });
}

function loadBuilderTab() {
    renderCustomAssessmentsList();
}

function renderCustomAssessmentsList() {
    const container = $('#customAssessmentsList');
    const custom = getCustomAssessmentTemplates();
    const keys = Object.keys(custom);
    if (keys.length === 0) {
        container.html('<div class="text-muted">No custom assessments yet.</div>');
        return;
    }
    const html = keys.map(key => {
        const t = custom[key];
        return `
            <div class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="fw-semibold">${sanitizeInput(t.title)} <small class="text-muted">(${sanitizeInput(key)})</small></div>
                    <small class="text-muted">${sanitizeInput(t.description)}</small>
                </div>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-secondary" onclick="exportCustomTemplate('${key}')"><i class="fas fa-download"></i></button>
                    <button class="btn btn-outline-danger" onclick="deleteCustomTemplate('${key}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>`;
    }).join('');
    container.html(html);
}

function exportCustomTemplate(key) {
    const custom = getCustomAssessmentTemplates();
    const t = custom[key];
    if (!t) return;
    exportToJSON({ key, template: t }, `custom_assessment_${key}.json`);
    showAlert('Template exported.', 'success');
}

function deleteCustomTemplate(key) {
    const custom = getCustomAssessmentTemplates();
    if (!custom[key]) return;
    delete custom[key];
    setStorageItem('customAssessmentTemplates', custom);
    renderCustomAssessmentsList();
    showAlert('Template deleted.', 'success');
}

// -----------------------
// Departments functions
// -----------------------

function initializeDepartmentsUI() {
    // Add department
    $(document).on('submit', '#addDepartmentForm', function(e) {
        e.preventDefault();
        const name = $('#newDepartmentName').val();
        if (addDepartment(name)) {
            $('#newDepartmentName').val('');
            renderDepartmentsList();
            showAlert('Department added.', 'success');
        } else {
            showAlert('Department exists or invalid.', 'warning');
        }
    });

    // Remove department
    $(document).on('click', '.remove-dept-btn', function() {
        const name = $(this).data('name');
        removeDepartment(name);
        renderDepartmentsList();
        showAlert('Department removed.', 'success');
    });
}

function loadDepartmentsTab() {
    renderDepartmentsList();
}

function renderDepartmentsList() {
    const list = $('#departmentsList');
    const depts = getDepartments();
    if (!depts || depts.length === 0) {
        list.html('<li class="list-group-item text-muted">No departments found.</li>');
        return;
    }
    const html = depts.map(d => `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>${sanitizeInput(d)}</span>
            <button type="button" class="btn btn-sm btn-outline-danger remove-dept-btn" data-name="${sanitizeInput(d)}"><i class="fas fa-trash"></i></button>
        </li>`).join('');
    list.html(html);
}

// Add event handler for category filter buttons and compatibility button
$(document).on('click', '.category-btn', function() {
    $('.category-btn').removeClass('active');
    $(this).addClass('active');
    loadAssessmentsTab();
});

$(document).on('click', '.show-compatibility-btn', function() {
    const userId = $(this).data('userid');
    showUserCompatibility(userId);
});

function showUserCompatibility(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) return;
    let html = `<h5>Compatibility of <b>${sanitizeInput(user.fullName)}</b> with other users</h5>`;
    const userAssessments = adminData.assessments.filter(a => a.userId === userId);
    const otherUsers = adminData.users.filter(u => u.id !== userId);
    let matchCount = 0;
    let totalComparisons = 0;
    let matchDetails = [];
    let missingAnswers = false;
    if (userAssessments.length === 0) {
        html += '<div class="alert alert-info mt-3">No assessments found for this user.</div>';
    } else {
        // Check if all user assessments have answers
        const hasValidAnswers = userAssessments.some(ua => ua.answers && Object.keys(ua.answers).length > 0);
        if (!hasValidAnswers) {
            html += '<div class="alert alert-warning mt-3">This user has not completed any assessments with recorded answers. Compatibility cannot be calculated.</div>';
        } else {
            otherUsers.forEach(otherUser => {
                let bestMatch = 0;
                let bestAssessment = null;
                userAssessments.forEach(ua => {
                    if (!ua.answers || Object.keys(ua.answers).length === 0) {
                        missingAnswers = true;
                        return;
                    }
                    const otherAssessment = adminData.assessments.find(a => a.userId === otherUser.id && a.category === ua.category && a.assessmentTitle === ua.assessmentTitle);
                    if (otherAssessment) {
                        if (!otherAssessment.answers || Object.keys(otherAssessment.answers).length === 0) {
                            missingAnswers = true;
                            return;
                        }
                        const match = calculateCapabilityMatch(ua.answers, otherAssessment.answers, ua.totalQuestions);
                        if (match > bestMatch) {
                            bestMatch = match;
                            bestAssessment = ua;
                        }
                    }
                });
                if (bestAssessment) {
                    totalComparisons++;
                    if (bestMatch >= 60) matchCount++;
                    matchDetails.push({otherUser, bestMatch, bestAssessment});
                }
            });
            // Sort matchDetails by bestMatch descending
            matchDetails.sort((a, b) => b.bestMatch - a.bestMatch);
            // Render sorted matches
            matchDetails.forEach(({otherUser, bestMatch, bestAssessment}) => {
                const barColor = getMatchBarColor(bestMatch);
                html += `
                    <div class="mt-3">
                        <div class="d-flex align-items-center justify-content-between">
                            <span><b>${sanitizeInput(user.fullName)}</b> vs <b>${sanitizeInput(otherUser.fullName)}</b> (${sanitizeInput(bestAssessment.category.toUpperCase())} - ${sanitizeInput(bestAssessment.assessmentTitle)})</span>
                            <span class="badge ${barColor} text-white ms-2">${bestMatch}%</span>
                        </div>
                        <div class="progress" style="height: 18px;">
                            <div class="progress-bar ${barColor}" role="progressbar" style="width: ${bestMatch}%" aria-valuenow="${bestMatch}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                `;
            });
            // Add summary if at least 60% of matches are >= 60%
            if (totalComparisons > 0) {
                const percentMatched = Math.round((matchCount / totalComparisons) * 100);
                if (percentMatched >= 60) {
                    html = `<div class='alert alert-success'><b>${percentMatched}%</b> of user matches are 60% or higher!</div>` + html;
                } else {
                    html = `<div class='alert alert-warning'><b>Only ${percentMatched}%</b> of user matches are 60% or higher.</div>` + html;
                }
            }
            if (missingAnswers) {
                html = `<div class='alert alert-info'>Some users have missing or incomplete answers, so not all matches could be calculated.</div>` + html;
            }
        }
    }
    $('#compatibilityContent').html(html);
    const modal = new bootstrap.Modal(document.getElementById('compatibilityModal'));
    modal.show();
}

function loadAnalyticsTab() {
    // Load score distribution chart
    loadScoreDistributionChart();
    
    // Load skill comparison chart
    loadSkillComparisonChart();
    
    // Load user comparison chart
    loadUserComparisonChart();
}

function updateAnalyticsPeriod(period) {
    // Reload analytics charts with new period filter
    console.log(`Updating analytics for period: ${period}`);
    
    // You can implement period-specific filtering here
    // For now, just reload the charts
    loadAnalyticsTab();
}

function loadScoreDistributionChart() {
    const ctx = document.getElementById('scoreDistributionChart');
    if (!ctx) return;
    
    try {
        if (!adminData.assessments || adminData.assessments.length === 0) {
            console.warn('No assessment data available for score distribution chart');
            return;
        }
        
        const scores = adminData.assessments.map(a => a.score);
        const ranges = {
            '90-100%': scores.filter(s => s >= 90).length,
            '80-89%': scores.filter(s => s >= 80 && s < 90).length,
            '70-79%': scores.filter(s => s >= 70 && s < 80).length,
            '60-69%': scores.filter(s => s >= 60 && s < 70).length,
            'Below 60%': scores.filter(s => s < 60).length
        };
        
        window.scoreDistributionChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(ranges),
                datasets: [{
                    label: 'Number of Assessments',
                    data: Object.values(ranges),
                    backgroundColor: generateChartColors(5),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading score distribution chart:', error);
    }
}

function loadSkillComparisonChart() {
    const ctx = document.getElementById('skillComparisonChart');
    if (!ctx) return;
    
    try {
        if (!adminData.assessments || adminData.assessments.length === 0) {
            console.warn('No assessment data available for skill comparison chart');
            return;
        }
        
        const skillData = groupBy(adminData.assessments, 'category');
        const skills = Object.keys(skillData);
        const averages = skills.map(skill => 
            Math.round(calculateAverage(skillData[skill].map(a => a.score)))
        );
        
        window.skillComparisonChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: skills.map(s => s.toUpperCase()),
                datasets: [{
                    label: 'Average Score',
                    data: averages,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading skill comparison chart:', error);
    }
}

function loadUserComparisonChart() {
    const ctx = document.getElementById('userComparisonChart');
    if (!ctx) return;
    
    try {
        if (!adminData.users || adminData.users.length === 0) {
            console.warn('No user data available for user comparison chart');
            return;
        }
        
        // Get top 10 users by average score
        const userScores = adminData.users
            .filter(u => u.role !== 'admin')
            .map(user => {
                const assessments = adminData.assessments.filter(a => a.userId === user.id);
                const avgScore = assessments.length > 0 ? 
                    calculateAverage(assessments.map(a => a.score)) : 0;
                return {
                    name: user.fullName,
                    score: Math.round(avgScore),
                    assessmentCount: assessments.length
                };
            })
            .filter(u => u.assessmentCount > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        window.userComparisonChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userScores.map(u => u.name),
                datasets: [{
                    label: 'Average Score (%)',
                    data: userScores.map(u => u.score),
                    backgroundColor: generateChartColors(userScores.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    },
                    x: {
                        ticks: {
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading user comparison chart:', error);
    }
}

function loadReportsTab() {
    // Render category reports when Reports tab is loaded
    renderCategoryReports('personality'); // Default to personality since it has demo data
    setupCategoryTabHandlers();
}

function setupCategoryTabHandlers() {
    // Set up category tabs in reports section
    $('#categoryTabs .nav-link').on('click', function(e) {
        e.preventDefault();
        $('#categoryTabs .nav-link').removeClass('active');
        $(this).addClass('active');
        const category = $(this).data('category');
        renderCategoryReports(category);
    });
    
    // Set up assessment category buttons if they exist
    if ($('#assessmentCategoryButtons').length) {
        $('#assessmentCategoryButtons').html(`
            <button class="btn btn-outline-primary category-btn active" data-category="">All</button>
            <button class="btn btn-outline-primary category-btn" data-category="technical">Technical</button>
            <button class="btn btn-outline-primary category-btn" data-category="behavioral">Behavioral</button>
            <button class="btn btn-outline-primary category-btn" data-category="personality">Personality</button>
        `);
        $('.category-btn').on('click', function() {
            $('.category-btn').removeClass('active');
            $(this).addClass('active');
            loadAssessmentsTab();
        });
    }
}

function renderCategoryReports(category) {
    // Use adminData consistently (which already includes demo data if needed)
    const assessments = adminData.assessments || [];
    const users = adminData.users || [];
    
    // Map category names to match demo data
    let categoryFilter = category;
    if (category === 'personality') {
        categoryFilter = 'myndkonnekt_personality';
    } else if (category === 'behavioral') {
        categoryFilter = 'myndkonnekt_behavioral';
    } else if (category === 'technical') {
        categoryFilter = 'technical';
    } else if (category === 'data') {
        categoryFilter = 'data';
    }
    
    // Filter by category (if category is provided)
    const filtered = categoryFilter ? assessments.filter(a => a.category === categoryFilter) : assessments;

    // --- Render Chart ---
    renderCategoryScoreChart(filtered, users);

    // --- Render Table ---
    let html = '';
    if (filtered.length === 0) {
        html = `<div class="alert alert-info">No reports found for this category.</div>`;
    } else {
        html = `<div class="table-responsive"><table class="table table-bordered table-striped">
            <thead><tr>
                <th>User Name</th>
                <th>Assessment Title</th>
                <th>Score</th>
                <th>Correct Answers</th>
                <th>Total Questions</th>
                <th>Time Spent</th>
                <th>Completed At</th>
            </tr></thead><tbody>`;
        filtered.forEach(a => {
            const user = users.find(u => u.id === a.userId);
            html += `<tr>
                <td>${user ? user.fullName : 'Unknown'}</td>
                <td>${a.assessmentTitle || ''}</td>
                <td>${a.score != null ? a.score + '%' : ''}</td>
                <td>${a.correctAnswers != null ? a.correctAnswers : ''}</td>
                <td>${a.totalQuestions != null ? a.totalQuestions : ''}</td>
                <td>${a.timeSpent != null ? formatDuration(a.timeSpent) : ''}</td>
                <td>${a.completedAt ? formatDate(a.completedAt) : ''}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
    }
    // Only update the table, not the chart container
    $('#categoryReportsContainer').find('.table-responsive, .alert').remove();
    $('#categoryReportsContainer').append(html);
}

function renderCategoryScoreChart(filteredAssessments, users) {
    const ctx = document.getElementById('categoryScoreChart');
    if (!ctx) {
        console.warn('Category score chart canvas not found');
        return;
    }
    
    try {
        // Validate data
        if (!filteredAssessments || filteredAssessments.length === 0) {
            console.warn('No assessment data for category chart');
            // Clear chart area
            if (categoryScoreChartInstance) {
                categoryScoreChartInstance.destroy();
                categoryScoreChartInstance = null;
            }
            return;
        }
        
        // Prepare data
        const labels = filteredAssessments.map(a => {
            const user = users.find(u => u.id === a.userId);
            return user ? user.fullName : 'Unknown';
        });
        const scores = filteredAssessments.map(a => a.score != null ? a.score : 0);

        // Find duplicate scores for highlighting
        const scoreCounts = {};
        scores.forEach(score => {
            scoreCounts[score] = (scoreCounts[score] || 0) + 1;
        });
        
        // Assign colors: same color for matching scores, otherwise default
        const baseColors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#20c997', '#fd7e14', '#17a2b8', '#343a40', '#6610f2'
        ];
        const colorMap = {};
        let colorIdx = 0;
        scores.forEach(score => {
            if (!colorMap[score]) {
                colorMap[score] = (scoreCounts[score] > 1) ? '#ff6384' : baseColors[colorIdx % baseColors.length];
                colorIdx++;
            }
        });
        const backgroundColors = scores.map(score => colorMap[score]);

        // Destroy previous chart instance if exists
        if (categoryScoreChartInstance) {
            categoryScoreChartInstance.destroy();
        }
        
        categoryScoreChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'User Score',
                    data: scores,
                    backgroundColor: backgroundColors,
                    borderColor: '#333',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const score = context.parsed.y;
                                if (scoreCounts[score] > 1) {
                                    return `Score: ${score} (Match)`;
                                }
                                return `Score: ${score}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Score (%)' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error rendering category score chart:', error);
    }
}

// Utility functions
function getStatusIndicator(lastActive) {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffHours = (now - lastActiveDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'online';
    if (diffHours < 24) return 'away';
    return 'offline';
}

function getScoreClass(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-average';
    return 'score-poor';
}

function getOverallRating(score) {
    if (score >= 90) return { rating: 'Excellent', stars: 5, class: 'excellent' };
    if (score >= 80) return { rating: 'Good', stars: 4, class: 'good' };
    if (score >= 70) return { rating: 'Average', stars: 3, class: 'average' };
    if (score >= 60) return { rating: 'Below Average', stars: 2, class: 'below-average' };
    return { rating: 'Poor', stars: 1, class: 'poor' };
}

function generateStarRating(stars, maxStars = 5) {
    const filledStars = Math.min(stars, maxStars);
    const emptyStars = maxStars - filledStars;
    
    let starHTML = '';
    for (let i = 0; i < filledStars; i++) {
        starHTML += '<i class="fas fa-star text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starHTML += '<i class="far fa-star text-muted"></i>';
    }
    
    return starHTML;
}

function calculateCapabilityMatch(answersA, answersB, totalQuestions) {
    let matchCount = 0;
    let compared = 0;
    for (let i = 0; i < totalQuestions; i++) {
        const a = answersA[i]?.answer;
        const b = answersB[i]?.answer;
        if (a === undefined || b === undefined) continue;
        compared++;
        if (Array.isArray(a) && Array.isArray(b)) {
            // Compare arrays (e.g., multiple select, ranking)
            if (a.length === b.length && a.every((val, idx) => val === b[idx])) matchCount++;
        } else if (typeof a === 'string' && typeof b === 'string') {
            // Compare text answers (case-insensitive, trimmed)
            if (a.trim().toLowerCase() === b.trim().toLowerCase()) matchCount++;
        } else {
            // Compare primitive values (number, string)
            if (a === b) matchCount++;
        }
    }
    if (compared === 0) return 0;
    return Math.round((matchCount / compared) * 100);
}

function getMatchBarColor(match) {
    if (match >= 80) return 'bg-success';
    if (match >= 50) return 'bg-warning';
    return 'bg-danger';
}

// Search and filter functions
function setupSearchAndFilters() {
    // User search
    $('#userSearch').on('input', debounce(function() {
        const searchTerm = $(this).val().toLowerCase();
        filterUsersTable(searchTerm);
    }, 300));
    
    // Assessment filter
    $('#assessmentFilter').on('change', function() {
        const category = $(this).val();
        filterAssessmentsTable(category);
    });
}

function filterUsersTable(searchTerm) {
    $('#usersTable tbody tr').each(function() {
        const text = $(this).text().toLowerCase();
        $(this).toggle(text.includes(searchTerm));
    });
}

function filterAssessmentsTable(category) {
    $('#assessmentsTable tbody tr').each(function() {
        if (!category) {
            $(this).show();
        } else {
            const rowCategory = $(this).find('.badge').text().toLowerCase();
            $(this).toggle(rowCategory.includes(category));
        }
    });
}

// Export functions
function exportUsers() {
    try {
        const users = adminData.users.filter(u => u.role !== 'admin');
        const exportData = users.map(user => ({
            'Full Name': user.fullName,
            'Email': user.email,
            'Department': user.department,
            'Experience': user.experience,
            'Registered Date': formatDate(user.registeredAt),
            'Last Login': formatDate(user.lastLogin),
            'Status': user.isActive ? 'Active' : 'Inactive'
        }));
        
        const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
        
        showAlert('User data exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'Exporting users');
    }
}

function exportAssessments() {
    try {
        const exportData = adminData.assessments.map(assessment => {
            const user = adminData.users.find(u => u.id === assessment.userId);
            return {
                'User Name': user ? user.fullName : 'Unknown',
                'User Email': user ? user.email : 'Unknown',
                'Assessment Title': assessment.assessmentTitle,
                'Category': assessment.category,
                'Score': assessment.score + '%',
                'Correct Answers': assessment.correctAnswers,
                'Total Questions': assessment.totalQuestions,
                'Time Spent': formatDuration(assessment.timeSpent),
                'Completion Date': formatDate(assessment.completedAt)
            };
        });
        
        const filename = `assessments_export_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCSV(exportData, filename);
        
        showAlert('Assessment data exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'Exporting assessments');
    }
}

function generateReport() {
    try {
        const reportType = $('#reportType').val();
        const exportFormat = $('#exportFormat').val();
        
        let reportData;
        let filename;
        
        switch (reportType) {
            case 'user-summary':
                reportData = generateUserSummaryReport();
                filename = `user_summary_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'assessment-results':
                reportData = generateAssessmentResultsReport();
                filename = `assessment_results_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'performance-analysis':
                reportData = generatePerformanceAnalysisReport();
                filename = `performance_analysis_${new Date().toISOString().split('T')[0]}`;
                break;
            case 'department-comparison':
                reportData = generateDepartmentComparisonReport();
                filename = `department_comparison_${new Date().toISOString().split('T')[0]}`;
                break;
            default:
                throw new Error('Invalid report type');
        }
        
        if (exportFormat === 'json') {
            exportToJSON(reportData, filename + '.json');
        } else {
            exportToCSV(reportData, filename + '.csv');
        }
        
        showAlert('Report generated successfully!', 'success');
    } catch (error) {
        handleError(error, 'Generating report');
    }
}

function generateUserSummaryReport() {
    return adminData.users.filter(u => u.role !== 'admin').map(user => {
        const assessments = adminData.assessments.filter(a => a.userId === user.id);
        return {
            'User ID': user.id,
            'Full Name': user.fullName,
            'Email': user.email,
            'Department': user.department,
            'Experience Level': user.experience,
            'Registration Date': user.registeredAt,
            'Last Login': user.lastLogin,
            'Total Assessments': assessments.length,
            'Average Score': assessments.length > 0 ? 
                Math.round(calculateAverage(assessments.map(a => a.score))) : 0,
            'Best Score': assessments.length > 0 ? Math.max(...assessments.map(a => a.score)) : 0,
            'Status': user.isActive ? 'Active' : 'Inactive'
        };
    });
}

function generateAssessmentResultsReport() {
    return adminData.assessments.map(assessment => {
        const user = adminData.users.find(u => u.id === assessment.userId);
        return {
            'Assessment ID': assessment.id,
            'User Name': user ? user.fullName : 'Unknown',
            'User Department': user ? user.department : 'Unknown',
            'Assessment Category': assessment.category,
            'Assessment Title': assessment.assessmentTitle,
            'Total Questions': assessment.totalQuestions,
            'Correct Answers': assessment.correctAnswers,
            'Score Percentage': assessment.score,
            'Time Spent (seconds)': assessment.timeSpent,
            'Completion Date': assessment.completedAt
        };
    });
}

function generatePerformanceAnalysisReport() {
    const departments = groupBy(adminData.users.filter(u => u.role !== 'admin'), 'department');
    
    return Object.keys(departments).map(dept => {
        const deptUsers = departments[dept];
        const deptAssessments = adminData.assessments.filter(a => 
            deptUsers.some(u => u.id === a.userId)
        );
        
        return {
            'Department': dept,
            'Total Users': deptUsers.length,
            'Total Assessments': deptAssessments.length,
            'Average Score': deptAssessments.length > 0 ? 
                Math.round(calculateAverage(deptAssessments.map(a => a.score))) : 0,
            'Participation Rate': Math.round((deptAssessments.length / deptUsers.length) * 100) + '%',
            'Best Performer': getBestPerformer(deptUsers, deptAssessments),
            'Most Active Category': getMostActiveCategory(deptAssessments)
        };
    });
}

function generateDepartmentComparisonReport() {
    const categories = ['engineering', 'sales', 'hr'];
    const departments = groupBy(adminData.users.filter(u => u.role !== 'admin'), 'department');
    
    return Object.keys(departments).map(dept => {
        const deptUsers = departments[dept];
        const result = { 'Department': dept };
        
        categories.forEach(category => {
            const categoryAssessments = adminData.assessments.filter(a => 
                a.category === category && deptUsers.some(u => u.id === a.userId)
            );
            
            result[`${category.toUpperCase()} Average Score`] = categoryAssessments.length > 0 ? 
                Math.round(calculateAverage(categoryAssessments.map(a => a.score))) : 0;
            result[`${category.toUpperCase()} Assessments Count`] = categoryAssessments.length;
        });
        
        return result;
    });
}

function getBestPerformer(users, assessments) {
    if (assessments.length === 0) return 'N/A';
    
    const userScores = users.map(user => {
        const userAssessments = assessments.filter(a => a.userId === user.id);
        const avgScore = userAssessments.length > 0 ? 
            calculateAverage(userAssessments.map(a => a.score)) : 0;
        return { name: user.fullName, score: avgScore };
    });
    
    const best = userScores.reduce((max, user) => user.score > max.score ? user : max);
    return `${best.name} (${Math.round(best.score)}%)`;
}

function getMostActiveCategory(assessments) {
    if (assessments.length === 0) return 'N/A';
    
    const categories = groupBy(assessments, 'category');
    const mostActive = Object.keys(categories).reduce((max, cat) => 
        categories[cat].length > categories[max].length ? cat : max
    );
    
    return mostActive.toUpperCase();
}

// Additional export functions
function exportAllData() {
    try {
        const allData = {
            users: adminData.users,
            assessments: adminData.assessments,
            exportDate: new Date().toISOString()
        };
        
        const filename = `hr_assessment_backup_${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(allData, filename);
        
        showAlert('All data exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'Exporting all data');
    }
}

function exportUserProfiles() {
    exportUsers(); // Reuse existing function
}

function exportAssessmentData() {
    exportAssessments(); // Reuse existing function
}

function clearOldData() {
    if (confirm('Are you sure you want to clear old data? This action cannot be undone.')) {
        try {
            // Clear data older than 30 days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            
            const filteredAssessments = adminData.assessments.filter(a => 
                new Date(a.completedAt) > cutoffDate
            );
            
            setStorageItem('assessmentResults', filteredAssessments);
            adminData.assessments = filteredAssessments;
            
            showAlert('Old data cleared successfully!', 'success');
            refreshData();
        } catch (error) {
            handleError(error, 'Clearing old data');
        }
    }
}

// Refresh and view functions
function refreshData() {
    loadAdminData();
    showAlert('Data refreshed successfully!', 'success');
}

function viewUserDetails(userId) {
    const user = adminData.users.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'danger');
        return;
    }
    
    const assessments = adminData.assessments.filter(a => a.userId === userId);
    
    const modalContent = `
        <div class="row">
            <div class="col-md-4 text-center">
                <div class="user-avatar mb-3">${user.fullName.charAt(0).toUpperCase()}</div>
                <h5>${sanitizeInput(user.fullName)}</h5>
                <p class="text-muted">${sanitizeInput(user.email)}</p>
            </div>
            <div class="col-md-8">
                <div class="user-info-grid">
                    <div class="info-item">
                        <div class="info-label">Department</div>
                        <div class="info-value">${sanitizeInput(user.department)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Experience</div>
                        <div class="info-value">${sanitizeInput(user.experience)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Registration Date</div>
                        <div class="info-value">${formatDate(user.registeredAt)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Last Login</div>
                        <div class="info-value">${formatDate(user.lastLogin)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Total Assessments</div>
                        <div class="info-value">${assessments.length}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Average Score</div>
                        <div class="info-value">${assessments.length > 0 ? 
                            Math.round(calculateAverage(assessments.map(a => a.score))) + '%' : 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#userDetailContent').html(modalContent);
    const modal = new bootstrap.Modal(document.getElementById('userDetailModal'));
    modal.show();
}

function viewAssessmentDetails(assessmentId) {
    const assessment = adminData.assessments.find(a => a.id === assessmentId);
    if (!assessment) {
        showAlert('Assessment not found', 'danger');
        return;
    }
    
    const user = adminData.users.find(u => u.id === assessment.userId);
    
    if (assessment.isLikertAssessment && assessment.subscaleScores) {
        showAdminLikertDetailedResults(assessment, user);
    } else {
        showAdminTraditionalDetailedResults(assessment, user);
    }
}

function showAdminLikertDetailedResults(assessment, user) {
    const subscaleHTML = Object.entries(assessment.subscaleScores).map(([subscale, score]) => {
        const scoreValue = parseFloat(score);
        const scoreClass = scoreValue >= 4 ? 'text-success' : scoreValue >= 3 ? 'text-warning' : 'text-danger';
        const scoreLabel = scoreValue >= 4 ? 'High' : scoreValue >= 3 ? 'Moderate' : 'Low';
        
        return `
            <div class="row mb-2">
                <div class="col-md-6">
                    <strong>${subscale}</strong>
                </div>
                <div class="col-md-3">
                    <span class="${scoreClass} fw-bold">${score}</span>
                </div>
                <div class="col-md-3">
                    <span class="badge ${scoreValue >= 4 ? 'bg-success' : scoreValue >= 3 ? 'bg-warning' : 'bg-danger'}">${scoreLabel}</span>
                </div>
            </div>
        `;
    }).join('');
    
    const modalHTML = `
        <div class="modal fade" id="adminAssessmentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-pie me-2"></i>
                            Assessment Details - ${assessment.assessmentTitle}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>User:</strong> ${user ? user.fullName : 'Unknown'}
                            </div>
                            <div class="col-md-6">
                                <strong>Email:</strong> ${user ? user.email : 'N/A'}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Overall Score:</strong> ${assessment.score}%
                            </div>
                            <div class="col-md-6">
                                <strong>Time Spent:</strong> ${formatDuration(assessment.timeSpent)}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <div class="overall-rating-display">
                                    ${(() => {
                                        const overallRating = getOverallRating(assessment.score);
                                        return `
                                            <div class="rating-summary">
                                                <div class="rating-header">
                                                    <strong>Overall Rating:</strong>
                                                    <span class="rating-label ${overallRating.class}">${overallRating.rating}</span>
                                                </div>
                                                <div class="star-rating-large">
                                                    ${generateStarRating(overallRating.stars)}
                                                </div>
                                            </div>
                                        `;
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Questions Answered:</strong> ${assessment.answeredQuestions}/${assessment.totalQuestions}
                            </div>
                            <div class="col-md-6">
                                <strong>Completed:</strong> ${formatDate(assessment.completedAt)}
                            </div>
                        </div>
                        <hr>
                        <h6 class="mb-3">
                            <i class="fas fa-balance-scale me-2"></i>
                            Subscale Scores (1-5 Scale)
                        </h6>
                        <div class="subscale-results">
                            ${subscaleHTML}
                        </div>
                        <div class="mt-3 p-3 bg-light rounded">
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i>
                                <strong>Score Interpretation:</strong><br>
                                • 4.0-5.0: High (Strong agreement/ability)<br>
                                • 3.0-3.9: Moderate (Neutral/moderate agreement)<br>
                                • 1.0-2.9: Low (Disagreement/needs improvement)
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="exportAssessmentResult('${assessment.id}')">
                            <i class="fas fa-download me-1"></i>Export Results
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    $('#adminAssessmentModal').remove();
    
    // Add modal to body and show it
    $('body').append(modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('adminAssessmentModal'));
    modal.show();
}

function showAdminTraditionalDetailedResults(assessment, user) {
    const modalHTML = `
        <div class="modal fade" id="adminAssessmentModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-clipboard-check me-2"></i>
                            Assessment Details - ${assessment.assessmentTitle}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>User:</strong> ${user ? user.fullName : 'Unknown'}
                            </div>
                            <div class="col-md-6">
                                <strong>Email:</strong> ${user ? user.email : 'N/A'}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-12">
                                <div class="overall-rating-display">
                                    ${(() => {
                                        const overallRating = getOverallRating(assessment.score);
                                        return `
                                            <div class="rating-summary">
                                                <div class="rating-header">
                                                    <strong>Overall Rating:</strong>
                                                    <span class="rating-label ${overallRating.class}">${overallRating.rating}</span>
                                                </div>
                                                <div class="star-rating-large">
                                                    ${generateStarRating(overallRating.stars)}
                                                </div>
                                            </div>
                                        `;
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Score:</strong> ${assessment.score}%
                            </div>
                            <div class="col-md-6">
                                <strong>Correct Answers:</strong> ${assessment.correctAnswers}/${assessment.totalQuestions}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Time Spent:</strong> ${formatDuration(assessment.timeSpent)}
                            </div>
                            <div class="col-md-6">
                                <strong>Completed:</strong> ${formatDate(assessment.completedAt)}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary" onclick="exportAssessmentResult('${assessment.id}')">
                            <i class="fas fa-download me-1"></i>Export Results
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    $('#adminAssessmentModal').remove();
    
    // Add modal to body and show it
    $('body').append(modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('adminAssessmentModal'));
    modal.show();
}

function exportUserData(userId) {
    try {
        const user = adminData.users.find(u => u.id === userId);
        const assessments = adminData.assessments.filter(a => a.userId === userId);
        
        const userData = {
            profile: user,
            assessments: assessments,
            summary: {
                totalAssessments: assessments.length,
                averageScore: assessments.length > 0 ? 
                    Math.round(calculateAverage(assessments.map(a => a.score))) : 0,
                bestScore: assessments.length > 0 ? Math.max(...assessments.map(a => a.score)) : 0
            }
        };
        
        const filename = `user_${user.fullName.replace(/\s+/g, '_')}_data.json`;
        exportToJSON(userData, filename);
        
        showAlert('User data exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'Exporting user data');
    }
}

function exportAssessmentResult(assessmentId) {
    try {
        const assessment = adminData.assessments.find(a => a.id === assessmentId);
        const user = adminData.users.find(u => u.id === assessment.userId);
        
        let assessmentData = {
            assessment: {
                title: assessment.assessmentTitle,
                category: assessment.category,
                score: assessment.score,
                timeSpent: assessment.timeSpent,
                completedAt: assessment.completedAt,
                totalQuestions: assessment.totalQuestions,
                answeredQuestions: assessment.answeredQuestions
            },
            user: {
                name: user.fullName,
                email: user.email,
                department: user.department
            },
            exportDate: new Date().toISOString()
        };
        
        if (assessment.isLikertAssessment && assessment.subscaleScores) {
            assessmentData.assessment.subscaleScores = assessment.subscaleScores;
            assessmentData.assessment.type = 'Likert Scale Assessment';
        } else {
            assessmentData.assessment.correctAnswers = assessment.correctAnswers;
            assessmentData.assessment.type = 'Traditional Assessment';
        }
        
        const filename = `assessment_${assessment.category}_${user.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(assessmentData, filename);
        
        showAlert('Assessment result exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'Exporting assessment result');
    }
}

function updateAnalyticsPeriod(period) {
    // Filter data based on period and reload analytics
    showAlert(`Analytics updated for ${period} period`, 'info');
    loadAnalyticsTab();
}

function initializeCharts() {
    // Set Chart.js global defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = '#666';
        Chart.defaults.borderColor = '#e9ecef';
    }
}
