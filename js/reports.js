// User Reports JavaScript
let reportCharts = {};

$(document).ready(function() {
    // Check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Initialize reports
    initializeReports();
    
    // Load user data
    loadUserReports();
});

function initializeReports() {
    // Update user name
    const currentUser = getCurrentUser();
    $('#userName').text(currentUser.fullName);
    
    // Set up event handlers
    setupReportEventHandlers();
}

function setupReportEventHandlers() {
    // Logout handler
    $('#logoutBtn').on('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Export handler
    $(document).on('click', '[onclick="exportMyData()"]', exportMyData);
}

function loadUserReports() {
    const currentUser = getCurrentUser();
    const assessments = getStorageItem('assessmentResults') || [];
    const userAssessments = assessments.filter(a => a.userId === currentUser.id);
    
    if (userAssessments.length === 0) {
        showNoDataState();
        return;
    }
    
    // Load all report components
    loadOverallRatingStats(userAssessments);
    loadPerformanceTrendChart(userAssessments);
    loadSkillDistributionChart(userAssessments);
    loadAssessmentSummaryTable(userAssessments);
    loadSkillRadarChart(userAssessments);
    loadPeerComparisonChart(userAssessments, currentUser);
    loadRecommendations(userAssessments);
}

function showNoDataState() {
    const noDataHTML = `
        <div class="row justify-content-center">
            <div class="col-md-6 text-center">
                <div class="empty-state">
                    <i class="fas fa-chart-bar empty-state-icon"></i>
                    <h3 class="empty-state-title">No Assessment Data</h3>
                    <p class="empty-state-description">
                        You haven't completed any assessments yet. Take your first assessment to see detailed reports and analytics.
                    </p>
                    <a href="assessment.html" class="btn btn-primary">
                        <i class="fas fa-play me-2"></i>Take Assessment
                    </a>
                </div>
            </div>
        </div>
    `;
    
    $('.container-fluid main').html(noDataHTML);
}

function loadOverallRatingStats(assessments) {
    const container = $('#overallRatingStats');
    if (!container.length) return;
    
    try {
        if (assessments.length === 0) {
            container.html('<div class="col-12 text-center text-muted">No assessment data available</div>');
            return;
        }
        
        // Calculate overall statistics
        const averageScore = Math.round(calculateAverage(assessments.map(a => a.score)));
        const bestScore = Math.max(...assessments.map(a => a.score));
        const totalAssessments = assessments.length;
        
        // Calculate rating distribution
        const ratingDistribution = {
            excellent: 0,
            good: 0,
            average: 0,
            belowAverage: 0,
            poor: 0
        };
        
        assessments.forEach(assessment => {
            const rating = getOverallRating(assessment.score);
            ratingDistribution[rating.class]++;
        });
        
        // Calculate overall rating
        const overallRating = getOverallRating(averageScore);
        
        const statsHTML = `
            <div class="col-md-3 text-center">
                <div class="overall-rating-display">
                    <div class="rating-summary">
                        <div class="rating-header">
                            <strong>Overall Rating</strong>
                        </div>
                        <div class="star-rating-large">
                            ${generateStarRating(overallRating.stars)}
                        </div>
                        <div class="mt-2">
                            <span class="rating-label ${overallRating.class}">${overallRating.rating}</span>
                        </div>
                        <div class="mt-2">
                            <small class="text-muted">Average Score: ${averageScore}%</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 text-center">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-trophy text-warning"></i>
                    </div>
                    <div class="stat-value">${bestScore}%</div>
                    <div class="stat-label">Best Score</div>
                </div>
            </div>
            <div class="col-md-3 text-center">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clipboard-check text-primary"></i>
                    </div>
                    <div class="stat-value">${totalAssessments}</div>
                    <div class="stat-label">Total Assessments</div>
                </div>
            </div>
            <div class="col-md-3 text-center">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-star text-success"></i>
                    </div>
                    <div class="stat-value">${ratingDistribution.excellent + ratingDistribution.good}</div>
                    <div class="stat-label">High Performances</div>
                </div>
            </div>
        `;
        
        container.html(statsHTML);
    } catch (error) {
        console.error('Error loading overall rating stats:', error);
        container.html('<div class="col-12 text-center text-danger">Error loading statistics</div>');
    }
}

function loadPerformanceTrendChart(assessments) {
    const ctx = document.getElementById('performanceTrendChart');
    if (!ctx) return;
    
    try {
        // Sort assessments by completion date
        const sortedAssessments = [...assessments].sort((a, b) => 
            new Date(a.completedAt) - new Date(b.completedAt)
        );
        
        const labels = sortedAssessments.map((assessment, index) => 
            `Assessment ${index + 1}`
        );
        const scores = sortedAssessments.map(a => a.score);
        const timeSpent = sortedAssessments.map(a => Math.round(a.timeSpent / 60)); // Convert to minutes
        
        reportCharts.performanceTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score (%)',
                    data: scores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                }, {
                    label: 'Time Spent (min)',
                    data: timeSpent,
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
                            text: 'Score (%)'
                        },
                        min: 0,
                        max: 100
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Time (minutes)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            afterLabel: function(context) {
                                const assessment = sortedAssessments[context.dataIndex];
                                return [
                                    `Category: ${assessment.category.toUpperCase()}`,
                                    `Date: ${formatDate(assessment.completedAt, { 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}`
                                ];
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    } catch (error) {
        console.error('Error loading performance trend chart:', error);
    }
}

function loadSkillDistributionChart(assessments) {
    const ctx = document.getElementById('skillDistributionChart');
    if (!ctx) return;
    
    try {
        // Group assessments by category
        const skillData = groupBy(assessments, 'category');
        const skills = Object.keys(skillData);
        const averages = skills.map(skill => 
            Math.round(calculateAverage(skillData[skill].map(a => a.score)))
        );
        const colors = generateChartColors(skills.length);
        
        reportCharts.skillDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: skills.map(s => s.toUpperCase()),
                datasets: [{
                    data: averages,
                    backgroundColor: colors,
                    borderWidth: 3,
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
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const skill = skills[context.dataIndex];
                                const assessmentCount = skillData[skill].length;
                                return [
                                    `${context.label}: ${context.parsed}%`,
                                    `Assessments: ${assessmentCount}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading skill distribution chart:', error);
    }
}

function loadAssessmentSummaryTable(assessments) {
    const tbody = $('#assessmentSummary tbody');
    
    try {
        if (assessments.length === 0) {
            tbody.html('<tr><td colspan="7" class="text-center text-muted">No assessments completed</td></tr>');
            return;
        }
        
        // Calculate user rank for each assessment
        const allAssessments = getStorageItem('assessmentResults') || [];
        
        const summaryHTML = assessments.map(assessment => {
            // Calculate rank within the same category
            const categoryAssessments = allAssessments.filter(a => a.category === assessment.category);
            const sortedByScore = categoryAssessments
                .sort((a, b) => b.score - a.score)
                .map((a, index) => ({ ...a, rank: index + 1 }));
            
            const userRank = sortedByScore.find(a => a.id === assessment.id)?.rank || 'N/A';
            const totalInCategory = categoryAssessments.length;
            
            const scoreClass = getScoreClass(assessment.score);
            const rankBadge = getRankBadge(userRank, totalInCategory);
            
            return `
                <tr>
                    <td>
                        <div class="fw-semibold">${sanitizeInput(assessment.assessmentTitle)}</div>
                        <small class="text-muted">${assessment.totalQuestions} questions</small>
                    </td>
                    <td>
                        <span class="badge bg-primary">${sanitizeInput(assessment.category.toUpperCase())}</span>
                    </td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="score-badge ${scoreClass} me-2">${assessment.score}%</div>
                            ${assessment.isLikertAssessment ? 
                                `<small class="text-muted">Likert Scale</small>` : 
                                `<small class="text-muted">${assessment.correctAnswers}/${assessment.totalQuestions}</small>`
                            }
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
                        ${assessment.subscaleScores ? 
                            `<div class="mt-1">
                                <small class="text-info">
                                    <i class="fas fa-chart-pie me-1"></i>
                                    ${Object.keys(assessment.subscaleScores).length} subscales
                                </small>
                            </div>` : ''
                        }
                    </td>
                    <td>
                        <span class="${rankBadge.class}">#${userRank}</span>
                        <small class="d-block text-muted">of ${totalInCategory}</small>
                    </td>
                    <td>${formatDate(assessment.completedAt)}</td>
                    <td>${formatDuration(assessment.timeSpent)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewDetailedResults('${assessment.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tbody.html(summaryHTML);
    } catch (error) {
        console.error('Error loading assessment summary:', error);
    }
}

function loadSkillRadarChart(assessments) {
    const ctx = document.getElementById('skillRadarChart');
    if (!ctx) return;
    
    try {
        // Group by category and calculate averages
        const skillData = groupBy(assessments, 'category');
        const skills = Object.keys(skillData);
        const userAverages = skills.map(skill => 
            Math.round(calculateAverage(skillData[skill].map(a => a.score)))
        );
        
        // Calculate global averages for comparison
        const allAssessments = getStorageItem('assessmentResults') || [];
        const globalSkillData = groupBy(allAssessments, 'category');
        const globalAverages = skills.map(skill => {
            const globalData = globalSkillData[skill] || [];
            return globalData.length > 0 ? 
                Math.round(calculateAverage(globalData.map(a => a.score))) : 0;
        });
        
        reportCharts.skillRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: skills.map(s => s.toUpperCase()),
                datasets: [{
                    label: 'Your Performance',
                    data: userAverages,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: '#667eea',
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#667eea',
                    pointRadius: 6
                }, {
                    label: 'Average Performance',
                    data: globalAverages,
                    backgroundColor: 'rgba(108, 117, 125, 0.1)',
                    borderColor: '#6c757d',
                    pointBackgroundColor: '#6c757d',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#6c757d',
                    pointRadius: 4
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
                        suggestedMax: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading skill radar chart:', error);
    }
}

function loadPeerComparisonChart(assessments, currentUser) {
    const ctx = document.getElementById('peerComparisonChart');
    if (!ctx) return;
    
    try {
        // Get all users in the same department
        const allUsers = getStorageItem('users') || [];
        const allAssessments = getStorageItem('assessmentResults') || [];
        
        const departmentUsers = allUsers.filter(u => 
            u.department === currentUser.department && u.role !== 'admin'
        );
        
        // Calculate average scores for each user in the department
        const userScores = departmentUsers.map(user => {
            const userAssessments = allAssessments.filter(a => a.userId === user.id);
            const avgScore = userAssessments.length > 0 ? 
                calculateAverage(userAssessments.map(a => a.score)) : 0;
            
            return {
                name: user.id === currentUser.id ? 'You' : user.fullName,
                score: Math.round(avgScore),
                isCurrentUser: user.id === currentUser.id,
                assessmentCount: userAssessments.length
            };
        }).filter(u => u.assessmentCount > 0) // Only include users with assessments
          .sort((a, b) => b.score - a.score);
        
        if (userScores.length === 0) {
            ctx.getContext('2d').fillText('No peer data available', 10, 50);
            return;
        }
        
        const colors = userScores.map(u => u.isCurrentUser ? '#667eea' : '#e9ecef');
        const borderColors = userScores.map(u => u.isCurrentUser ? '#667eea' : '#6c757d');
        
        reportCharts.peerComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: userScores.map(u => u.name),
                datasets: [{
                    label: 'Average Score (%)',
                    data: userScores.map(u => u.score),
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const user = userScores[context.dataIndex];
                                return `Assessments: ${user.assessmentCount}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Average Score (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: `${currentUser.department} Department`
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading peer comparison chart:', error);
    }
}

function loadRecommendations(assessments) {
    const container = $('#recommendations');
    
    try {
        const recommendations = generateRecommendations(assessments);
        
        if (recommendations.length === 0) {
            container.html('<p class="text-muted">No recommendations available at this time.</p>');
            return;
        }
        
        const recommendationsHTML = recommendations.map(rec => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-start">
                        <div class="recommendation-icon me-3">
                            <i class="fas ${rec.icon} ${rec.iconClass}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="card-title">${rec.title}</h6>
                            <p class="card-text">${rec.description}</p>
                            ${rec.action ? `
                                <a href="${rec.action.url}" class="btn btn-sm btn-outline-primary">
                                    ${rec.action.text}
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.html(recommendationsHTML);
    } catch (error) {
        console.error('Error loading recommendations:', error);
    }
}

function generateRecommendations(assessments) {
    const recommendations = [];
    
    // Calculate overall performance
    const averageScore = calculateAverage(assessments.map(a => a.score));
    
    // Skill-based recommendations
    const skillData = groupBy(assessments, 'category');
    Object.keys(skillData).forEach(skill => {
        const skillAverage = calculateAverage(skillData[skill].map(a => a.score));
        
        if (skillAverage < 70) {
            recommendations.push({
                icon: 'fa-exclamation-triangle',
                iconClass: 'text-warning',
                title: `Improve ${skill.toUpperCase()} Skills`,
                description: `Your average score in ${skill} assessments is ${Math.round(skillAverage)}%. Consider additional practice in this area.`,
                action: {
                    text: 'Retake Assessment',
                    url: 'assessment.html'
                }
            });
        } else if (skillAverage >= 90) {
            recommendations.push({
                icon: 'fa-star',
                iconClass: 'text-success',
                title: `Excellent ${skill.toUpperCase()} Performance`,
                description: `Outstanding work! Your ${skill} skills are performing at ${Math.round(skillAverage)}%. Consider helping others or taking advanced assessments.`,
                action: null
            });
        }
    });
    
    // Time-based recommendations
    const avgTimeSpent = calculateAverage(assessments.map(a => a.timeSpent));
    const avgTimeInMinutes = Math.round(avgTimeSpent / 60);
    
    if (avgTimeInMinutes < 5) {
        recommendations.push({
            icon: 'fa-clock',
            iconClass: 'text-info',
            title: 'Take More Time',
            description: `You're completing assessments very quickly (avg: ${avgTimeInMinutes} min). Consider taking more time to ensure accuracy.`,
            action: null
        });
    }
    
    // Progress recommendations
    if (assessments.length < 3) {
        recommendations.push({
            icon: 'fa-chart-line',
            iconClass: 'text-primary',
            title: 'Complete More Assessments',
            description: 'Take more assessments to get a comprehensive view of your skills and track your progress over time.',
            action: {
                text: 'Browse Assessments',
                url: 'assessment.html'
            }
        });
    }
    
    // Recent activity recommendation
    const lastAssessment = assessments.sort((a, b) => 
        new Date(b.completedAt) - new Date(a.completedAt)
    )[0];
    
    const daysSinceLastAssessment = Math.floor(
        (new Date() - new Date(lastAssessment.completedAt)) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastAssessment > 7) {
        recommendations.push({
            icon: 'fa-calendar',
            iconClass: 'text-warning',
            title: 'Stay Active',
            description: `It's been ${daysSinceLastAssessment} days since your last assessment. Regular practice helps maintain and improve your skills.`,
            action: {
                text: 'Take Assessment',
                url: 'assessment.html'
            }
        });
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
}

// Utility functions
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

function getRankBadge(rank, total) {
    const percentage = (rank / total) * 100;
    
    if (percentage <= 10) {
        return { class: 'badge bg-success', label: 'Top 10%' };
    } else if (percentage <= 25) {
        return { class: 'badge bg-info', label: 'Top 25%' };
    } else if (percentage <= 50) {
        return { class: 'badge bg-warning', label: 'Top 50%' };
    } else {
        return { class: 'badge bg-secondary', label: 'Bottom 50%' };
    }
}

function viewDetailedResults(assessmentId) {
    const assessments = getStorageItem('assessmentResults') || [];
    const assessment = assessments.find(a => a.id === assessmentId);
    
    if (!assessment) {
        showAlert('Assessment not found', 'danger');
        return;
    }
    
    if (assessment.isLikertAssessment && assessment.subscaleScores) {
        // Show detailed Likert scale results
        showLikertDetailedResults(assessment);
    } else {
        // Show traditional assessment results
        showTraditionalDetailedResults(assessment);
    }
}

function showLikertDetailedResults(assessment) {
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
        <div class="modal fade" id="likertResultsModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-chart-pie me-2"></i>
                            ${assessment.assessmentTitle} - Detailed Results
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
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
    $('#likertResultsModal').remove();
    
    // Add modal to body and show it
    $('body').append(modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('likertResultsModal'));
    modal.show();
}

function showTraditionalDetailedResults(assessment) {
    const overallRating = getOverallRating(assessment.score);
    
    const modalHTML = `
        <div class="modal fade" id="traditionalResultsModal" tabindex="-1">
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
                            <div class="col-md-12">
                                <div class="overall-rating-display">
                                    <div class="rating-summary">
                                        <div class="rating-header">
                                            <strong>Overall Rating:</strong>
                                            <span class="rating-label ${overallRating.class}">${overallRating.rating}</span>
                                        </div>
                                        <div class="star-rating-large">
                                            ${generateStarRating(overallRating.stars)}
                                        </div>
                                    </div>
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
    $('#traditionalResultsModal').remove();
    
    // Add modal to body and show it
    $('body').append(modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('traditionalResultsModal'));
    modal.show();
}

function exportAssessmentResult(assessmentId) {
    try {
        const assessments = getStorageItem('assessmentResults') || [];
        const assessment = assessments.find(a => a.id === assessmentId);
        
        if (!assessment) {
            showAlert('Assessment not found', 'danger');
            return;
        }
        
        const currentUser = getCurrentUser();
        let exportData = {
            user: {
                name: currentUser.fullName,
                email: currentUser.email,
                department: currentUser.department
            },
            assessment: {
                title: assessment.assessmentTitle,
                category: assessment.category,
                score: assessment.score,
                timeSpent: assessment.timeSpent,
                completedAt: assessment.completedAt,
                totalQuestions: assessment.totalQuestions,
                answeredQuestions: assessment.answeredQuestions
            },
            exportDate: new Date().toISOString()
        };
        
        if (assessment.isLikertAssessment && assessment.subscaleScores) {
            exportData.assessment.subscaleScores = assessment.subscaleScores;
            exportData.assessment.type = 'Likert Scale Assessment';
        } else {
            exportData.assessment.correctAnswers = assessment.correctAnswers;
            exportData.assessment.type = 'Traditional Assessment';
        }
        
        const filename = `${currentUser.fullName.replace(/\s+/g, '_')}_${assessment.assessmentTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        exportToJSON(exportData, filename);
        
        showAlert('Assessment result exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting assessment result:', error);
        showAlert('Failed to export assessment result', 'danger');
    }
}

function exportMyData() {
    try {
        const currentUser = getCurrentUser();
        const assessments = getStorageItem('assessmentResults') || [];
        const userAssessments = assessments.filter(a => a.userId === currentUser.id);
        
        if (userAssessments.length === 0) {
            showAlert('No assessment data to export', 'warning');
            return;
        }
        
        // Prepare export data
        const exportData = {
            user: {
                name: currentUser.fullName,
                email: currentUser.email,
                department: currentUser.department,
                experience: currentUser.experience
            },
            summary: {
                totalAssessments: userAssessments.length,
                averageScore: Math.round(calculateAverage(userAssessments.map(a => a.score))),
                bestScore: Math.max(...userAssessments.map(a => a.score)),
                totalTimeSpent: userAssessments.reduce((sum, a) => sum + a.timeSpent, 0),
                categoriesCompleted: [...new Set(userAssessments.map(a => a.category))].length
            },
            assessments: userAssessments.map(assessment => ({
                title: assessment.assessmentTitle,
                category: assessment.category,
                score: assessment.score,
                correctAnswers: assessment.correctAnswers,
                totalQuestions: assessment.totalQuestions,
                timeSpent: assessment.timeSpent,
                completedAt: assessment.completedAt
            })),
            skillBreakdown: generateSkillBreakdown(userAssessments),
            exportDate: new Date().toISOString()
        };
        
        const filename = `${currentUser.fullName.replace(/\s+/g, '_')}_assessment_report.json`;
        exportToJSON(exportData, filename);
        
        showAlert('Your assessment data has been exported successfully!', 'success');
    } catch (error) {
        handleError(error, 'Exporting user data');
    }
}

function generateSkillBreakdown(assessments) {
    const skillData = groupBy(assessments, 'category');
    
    return Object.keys(skillData).map(skill => {
        const skillAssessments = skillData[skill];
        return {
            category: skill,
            assessmentCount: skillAssessments.length,
            averageScore: Math.round(calculateAverage(skillAssessments.map(a => a.score))),
            bestScore: Math.max(...skillAssessments.map(a => a.score)),
            totalTimeSpent: skillAssessments.reduce((sum, a) => sum + a.timeSpent, 0),
            lastAssessment: skillAssessments.sort((a, b) => 
                new Date(b.completedAt) - new Date(a.completedAt)
            )[0].completedAt
        };
    });
}

// Cleanup function to destroy charts when navigating away
$(window).on('beforeunload', function() {
    Object.keys(reportCharts).forEach(chartKey => {
        if (reportCharts[chartKey]) {
            reportCharts[chartKey].destroy();
        }
    });
});
