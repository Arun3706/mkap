// Main Application JavaScript
$(document).ready(function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    checkAuthentication();
    
    // Initialize demo data if needed
    initializeDemoData();
    
    // Load dashboard data if on dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
        initializeAssessmentTab();
    }
    
    // Set up global event handlers
    setupGlobalEventHandlers();
    
    // Initialize tooltips and popovers
    initializeBootstrapComponents();
}

// Initialize assessment tab functionality
function initializeAssessmentTab() {
    // Load assigned assessments when Take Assessment tab is shown
    $('#take-assessment-tab').on('shown.bs.tab', function() {
        if (typeof loadAssignedAssessments === 'function') {
            loadAssignedAssessments();
        }
    });
    
    // Make assessment functions available globally
    window.goBackToSelection = function() {
        $('#assignedAssessments').removeClass('d-none');
        $('#assessmentInstructions, #assessmentQuestions, #assessmentComplete').addClass('d-none');
    };
    
    window.goToDashboard = function() {
        // Reload the dashboard to show updated assessment data
        window.location.href = 'dashboard.html';
    };
    
    window.viewResults = function() {
        // Navigate to the reports page or show detailed results
        window.location.href = 'reports.html';
    };
}

function checkAuthentication() {
    // Check if authentication functions are available
    if (typeof getCurrentUser !== 'function') {
        console.log('Authentication functions not yet loaded');
        return;
    }
    
    const currentUser = getCurrentUser();
    const publicPages = ['index.html', 'login.html', 'register.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    
    // Redirect to login if not authenticated and not on public page
    if (!currentUser && !publicPages.includes(currentPage)) {
        window.location.href = 'login.html';
        return;
    }
    
    // Redirect admin to admin panel
    if (currentUser && currentUser.role === 'admin' && 
        !window.location.pathname.endsWith('admin-panel.html')) {
        window.location.href = 'admin-panel.html';
        return;
    }
    
    // Prevent regular users from accessing admin panel
    if (currentUser && currentUser.role !== 'admin' && 
        window.location.pathname.endsWith('admin-panel.html')) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Update user display if authenticated
    if (currentUser) {
        $('#userName').text(currentUser.fullName);
        $('#welcomeUserName').text(currentUser.fullName);
        $('#welcomeUserNameFull').text(currentUser.fullName);
        
        // Check if this is a first-time login and show Home tab by default
        if (currentPage === 'dashboard.html' && shouldShowWelcomePage(currentUser)) {
            showHomeTab();
        }
        // Note: For returning users, we keep the default Home tab active as set in HTML
    }
}

function initializeDemoData() {
    // Check if storage functions are available
    if (typeof getStorageItem !== 'function') {
        console.log('Storage functions not yet loaded');
        return;
    }
    
    // Check if demo data already exists
    const users = getStorageItem('users');
    if (!users || users.length === 0) {
        // Load demo data
        if (typeof window.demoUsers !== 'undefined') {
            setStorageItem('users', window.demoUsers);
        }
        
        if (typeof window.demoAssessmentResults !== 'undefined') {
            setStorageItem('assessmentResults', window.demoAssessmentResults);
        }
        
        if (typeof window.demoAssessmentAssignments !== 'undefined') {
            setStorageItem('assessmentAssignments', window.demoAssessmentAssignments);
        }
        
        console.log('Demo data initialized');
    }
}

function loadDashboardData() {
    // Check if authentication functions are available
    if (typeof getCurrentUser !== 'function') {
        console.log('Authentication functions not yet loaded for dashboard');
        return;
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Load user statistics
    loadUserStatistics(currentUser);
    
    // Load available assessments
    loadAvailableAssessments();
    
    // Load recent activity
    loadRecentActivity(currentUser);
    
    // Load skill progress chart
    loadSkillProgressChart(currentUser);
    
    // Load assessment data
    loadAssessmentData(currentUser);
}

function loadUserStatistics(user) {
    const assessments = getStorageItem('assessmentResults') || [];
    const userAssessments = assessments.filter(a => a.userId === user.id);
    
    // Update completed assessments
    $('#completedAssessments').text(userAssessments.length);
    
    // Calculate average score
    if (userAssessments.length > 0) {
        const avgScore = userAssessments.reduce((sum, a) => sum + a.score, 0) / userAssessments.length;
        $('#averageScore').text(Math.round(avgScore) + '%');
    } else {
        $('#averageScore').text('0%');
    }
    
    // Calculate user rank
    const allUsers = getStorageItem('users') || [];
    const userScores = allUsers.map(u => {
        const uAssessments = assessments.filter(a => a.userId === u.id);
        const avgScore = uAssessments.length > 0 ? 
            uAssessments.reduce((sum, a) => sum + a.score, 0) / uAssessments.length : 0;
        return { userId: u.id, score: avgScore };
    }).sort((a, b) => b.score - a.score);
    
    const userRank = userScores.findIndex(u => u.userId === user.id) + 1;
    $('#userRank').text(userRank > 0 ? `#${userRank}` : '-');
    
    // Pending assessments (all available minus completed)
    const availableAssessments = typeof window.assessmentTemplates !== 'undefined' ? 
        Object.keys(window.assessmentTemplates).length : 3;
    const completedCategories = [...new Set(userAssessments.map(a => a.category))].length;
    $('#pendingAssessments').text(Math.max(0, availableAssessments - completedCategories));
}

function loadAvailableAssessments() {
    const container = $('#availableAssessments');
    
    // Check if assessment templates are available
    if (typeof window.assessmentTemplates === 'undefined' || Object.keys(window.assessmentTemplates).length === 0) {
        // Try to load assessment templates
        $.getScript('data/assessment-templates.js')
            .done(function() {
                console.log('Assessment templates loaded successfully');
                loadAvailableAssessments(); // Retry loading
            })
            .fail(function() {
                container.html('<p class="text-muted">Assessment templates not available</p>');
            });
        return;
    }
    
    const currentUser = getCurrentUser();
    const completedAssessments = getStorageItem('assessmentResults') || [];
    const userCompletedCategories = completedAssessments
        .filter(a => a.userId === currentUser.id)
        .map(a => a.category);
    
    const assessmentHTML = Object.entries(window.assessmentTemplates).map(([category, template]) => {
        const isCompleted = userCompletedCategories.includes(category);
        const statusBadge = isCompleted ? 
            '<span class="badge bg-success">Completed</span>' : 
            '<span class="badge bg-warning">Pending</span>';
        
        return `
            <div class="col-md-6 mb-3">
                <div class="card assessment-card h-100" onclick="goToAssessment('${category}')">
                    <div class="card-body">
                        <div class="assessment-category ${category}">${category.replace('_', ' ').toUpperCase()}</div>
                        <h5 class="card-title">${template.title}</h5>
                        <p class="card-text">${template.description}</p>
                        <div class="assessment-info">
                            <span class="assessment-duration">
                                <i class="fas fa-clock me-1"></i>${template.timeLimit} min
                            </span>
                            <span class="assessment-questions">
                                <i class="fas fa-question-circle me-1"></i>${template.questions.length} questions
                            </span>
                        </div>
                        <div class="mt-3">
                            ${statusBadge}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.html(assessmentHTML);
}

function loadRecentActivity(user) {
    const container = $('#recentActivity');
    const assessments = getStorageItem('assessmentResults') || [];
    const userAssessments = assessments
        .filter(a => a.userId === user.id)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5);
    
    if (userAssessments.length === 0) {
        container.html('<p class="text-muted">No recent activity</p>');
        return;
    }
    
    const activityHTML = userAssessments.map(assessment => `
        <div class="activity-item">
            <div class="activity-time">${formatDate(assessment.completedAt)}</div>
            <div class="activity-content">
                <h6>Assessment Completed</h6>
                <p>Completed ${assessment.assessmentTitle} with a score of ${assessment.score}%</p>
            </div>
        </div>
    `).join('');
    
    container.html(activityHTML);
}

function loadSkillProgressChart(user) {
    const canvas = document.getElementById('skillProgressChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const assessments = getStorageItem('assessmentResults') || [];
    const userAssessments = assessments.filter(a => a.userId === user.id);
    
    // Group by category and calculate averages
    const skillData = {};
    userAssessments.forEach(assessment => {
        const category = assessment.category || 'General';
        if (!skillData[category]) {
            skillData[category] = { total: 0, count: 0 };
        }
        skillData[category].total += assessment.score;
        skillData[category].count++;
    });
    
    const labels = Object.keys(skillData);
    const data = labels.map(skill => 
        Math.round(skillData[skill].total / skillData[skill].count)
    );
    
    if (labels.length === 0) {
        ctx.fillStyle = '#6c757d';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#667eea',
                    '#4facfe',
                    '#43e97b',
                    '#fa709a',
                    '#fdbb2d'
                ],
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
}

function goToAssessment(category) {
    setStorageItem('selectedAssessmentCategory', category);
    window.location.href = 'assessment.html';
}

function setupGlobalEventHandlers() {
    // Logout handler
    $(document).on('click', '#logoutBtn', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Global error handler
    window.addEventListener('error', function(e) {
        console.error('Global error:', e.error);
        showAlert('An unexpected error occurred. Please try again.', 'danger');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e.reason);
        showAlert('An error occurred while processing your request.', 'danger');
    });
}

function initializeBootstrapComponents() {
    // Initialize all tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize all popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Utility functions for common operations
function showAlert(message, type = 'info', duration = 5000) {
    const alertId = 'alert-' + Date.now();
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('body').append(alertHTML);
    
    // Auto dismiss after duration
    setTimeout(() => {
        $(`#${alertId}`).fadeOut(() => {
            $(`#${alertId}`).remove();
        });
    }, duration);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle',
        'primary': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
}

function showLoadingSpinner(elementId) {
    const element = $(`#${elementId}`);
    const spinner = `
        <div class="d-flex justify-content-center align-items-center" style="height: 200px;">
            <div class="loading-spinner"></div>
        </div>
    `;
    element.html(spinner);
}

function hideLoadingSpinner(elementId) {
    const element = $(`#${elementId}`);
    element.find('.loading-spinner').parent().remove();
}

// Performance monitoring
function measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
}

function loadAssessmentData(user) {
    try {
        // Get assessment results from storage or use demo data
        let assessments = getStorageItem('assessmentResults') || [];
        
        // Filter assessments for the current user
        const userAssessments = user.role === 'admin' 
            ? assessments 
            : assessments.filter(a => a.userId === user.id);
        
        const $tableBody = $('#assessmentTableBody');
        $tableBody.empty();
        
        if (userAssessments.length === 0) {
            $tableBody.append(`
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="text-muted">
                            <i class="fas fa-inbox fa-3x mb-3"></i>
                            <p class="mb-0">No assessment data available</p>
                            ${user.role === 'user' ? '<a href="assessment.html" class="btn btn-primary mt-3">Take an Assessment</a>' : ''}
                        </div>
                    </td>
                </tr>
            `);
            return;
        }
        
        // Sort by most recent first
        userAssessments.sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken));
        
        // Display up to 5 most recent assessments
        const recentAssessments = userAssessments.slice(0, 5);
        
        recentAssessments.forEach(assessment => {
            const statusClass = assessment.status === 'Completed' ? 'success' : 
                              assessment.status === 'In Progress' ? 'warning' : 'secondary';
            
            const scoreDisplay = assessment.score !== undefined 
                ? `${assessment.score}%` 
                : 'N/A';
            
            const dateTaken = formatDate(assessment.dateTaken) || 'N/A';
            
            $tableBody.append(`
                <tr>
                    <td>
                        <strong>${assessment.assessmentName || 'Untitled Assessment'}</strong>
                        ${assessment.category ? `<div class="text-muted small">${assessment.category}</div>` : ''}
                    </td>
                    <td>
                        <span class="badge bg-${statusClass}">
                            ${assessment.status || 'Pending'}
                        </span>
                    </td>
                    <td>
                        ${scoreDisplay}
                        ${assessment.score >= 70 ? 
                            '<i class="fas fa-check-circle text-success ms-1"></i>' : 
                            assessment.score < 70 && assessment.score > 0 ? 
                            '<i class="fas fa-exclamation-circle text-warning ms-1"></i>' : ''
                        }
                    </td>
                    <td>${dateTaken}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary view-assessment" data-id="${assessment.id}">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `);
        });
        
        // Add event listeners for view buttons
        $('.view-assessment').on('click', function() {
            const assessmentId = $(this).data('id');
            // Navigate to assessment results or show details in a modal
            window.location.href = `assessment.html?view=${assessmentId}`;
        });
        
        // Show "View All" button if there are more assessments
        if (userAssessments.length > 5) {
            $tableBody.append(`
                <tr>
                    <td colspan="5" class="text-center">
                        <a href="reports.html" class="btn btn-sm btn-link">
                            View All ${userAssessments.length} Assessments <i class="fas fa-arrow-right ms-1"></i>
                        </a>
                    </td>
                </tr>
            `);
        }
        
    } catch (error) {
        console.error('Error loading assessment data:', error);
        showAlert('Failed to load assessment data. Please try again.', 'danger');
    }
}

// Tab Navigation Functions
function showHomeTab() {
    // Hide dashboard content
    $('#dashboardTabContent').hide();
    
    // Show home content
    $('#homeTabContent').show();
    
    // Update active nav link
    $('.sidebar .nav-link').removeClass('active');
    $('.sidebar .nav-link').eq(0).addClass('active'); // Home tab is first
    
    // Ensure user name is updated in welcome content
    const currentUser = getCurrentUser();
    if (currentUser) {
        $('#welcomeUserNameFull').text(currentUser.fullName);
    }
}

function showDashboardTab() {
    // Hide home content
    $('#homeTabContent').hide();
    
    // Show dashboard content
    $('#dashboardTabContent').show();
    
    // Update active nav link
    $('.sidebar .nav-link').removeClass('active');
    $('.sidebar .nav-link').eq(1).addClass('active'); // Dashboard tab is second
    
    // Load dashboard data if not already loaded
    const currentUser = getCurrentUser();
    if (currentUser) {
        loadDashboardData();
    }
}

// Welcome Page Functions
function shouldShowWelcomePage(user) {
    // Check if this is a first-time login
    const isFirstTimeLogin = getStorageItem('firstTimeLogin_' + user.id);
    
    // Check if user has seen the welcome page before
    const welcomeShown = getStorageItem('welcomeShown_' + user.id);
    
    // Show welcome page if it's first-time login and welcome hasn't been shown
    return isFirstTimeLogin && !welcomeShown;
}

function skipWelcome() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Mark welcome as shown for this user
        setStorageItem('welcomeShown_' + currentUser.id, true);
    }
    
    // Switch to dashboard tab
    showDashboardTab();
}

function startWelcomeTour() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Mark welcome as shown for this user
        setStorageItem('welcomeShown_' + currentUser.id, true);
    }
    
    // Switch to dashboard tab and start tour
    showDashboardTab();
    startDashboardTour();
}

function goToDashboard() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Mark welcome as shown for this user
        setStorageItem('welcomeShown_' + currentUser.id, true);
    }
    
    // Switch to dashboard tab
    showDashboardTab();
}

function startDashboardTour() {
    // Create tour overlay
    const tourOverlay = document.createElement('div');
    tourOverlay.id = 'tourOverlay';
    tourOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Create tour content
    const tourContent = document.createElement('div');
    tourContent.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    tourContent.innerHTML = `
        <h4 class="mb-3">Welcome to your Dashboard!</h4>
        <p class="mb-4">Here you can take assessments, view your progress, and track your performance.</p>
        <div class="d-flex gap-2 justify-content-center">
            <button class="btn btn-primary" onclick="endTour()">Got it!</button>
            <button class="btn btn-outline-secondary" onclick="endTour()">Skip Tour</button>
        </div>
    `;
    
    tourOverlay.appendChild(tourContent);
    document.body.appendChild(tourOverlay);
    
    // Auto-end tour after 10 seconds
    setTimeout(() => {
        if (document.getElementById('tourOverlay')) {
            endTour();
        }
    }, 10000);
}

function endTour() {
    const tourOverlay = document.getElementById('tourOverlay');
    if (tourOverlay) {
        tourOverlay.remove();
    }
}

// Make functions globally available
window.showHomeTab = showHomeTab;
window.showDashboardTab = showDashboardTab;
window.skipWelcome = skipWelcome;
window.startWelcomeTour = startWelcomeTour;
window.goToDashboard = goToDashboard;
window.endTour = endTour;

// Function to reset welcome page for testing (can be called from browser console)
window.resetWelcomePage = function() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        removeStorageItem('welcomeShown_' + currentUser.id);
        removeStorageItem('firstTimeLogin_' + currentUser.id);
        console.log('Welcome page reset for user:', currentUser.fullName);
        showAlert('Welcome page has been reset. Refresh the page to see it again.', 'info');
    } else {
        console.log('No user logged in');
    }
};

// Export functions for use in other modules
window.appUtils = {
    showAlert,
    formatDate,
    showLoadingSpinner,
    hideLoadingSpinner,
    measurePerformance,
    initializeBootstrapComponents,
    shouldShowWelcomePage,
    showHomeTab,
    showDashboardTab,
    startDashboardTour
};
