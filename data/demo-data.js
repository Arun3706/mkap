// Demo Data for HR Assessment System
// This file contains sample users and assessment results for demonstration purposes

// Demo Users Data - Only Arun and Vinay
window.demoUsers = [
    {
        id: 'user_admin_001',
        fullName: 'System Administrator',
        email: 'admin@mkap.com',
        department: 'IT',
        experience: '15+',
        salt: 'admin_salt_123',
        password: btoa('admin123' + 'admin_salt_123'),
        role: 'admin',
        registeredAt: '2024-01-01T08:00:00.000Z',
        lastLogin: new Date().toISOString(),
        isActive: true
    },
    {
        id: 'user_001',
        fullName: 'Arun',
        email: 'arun@company.com',
        department: 'Engineering',
        experience: '3-5',
        salt: 'user_salt_001',
        password: btoa('arun123' + 'user_salt_001'),
        role: 'user',
        registeredAt: '2024-01-15T09:00:00.000Z',
        lastLogin: '2024-06-01T10:00:00.000Z',
        isActive: true
    },
    {
        id: 'user_002',
        fullName: 'Vinay',
        email: 'vinay@company.com',
        department: 'Sales',
        experience: '2-4',
        salt: 'user_salt_002',
        password: btoa('vinay123' + 'user_salt_002'),
        role: 'user',
        registeredAt: '2024-01-20T11:30:00.000Z',
        lastLogin: '2024-06-02T12:00:00.000Z',
        isActive: true
    }
];

// Demo Assessment Results - Only Arun and Vinay with Personality and Behavioral Assessments
window.demoAssessmentResults = [
    // Arun's Personality Questionnaire (Likert Scale)
    {
        id: 'assessment_001',
        userId: 'user_001',
        category: 'myndkonnekt_personality',
        assessmentTitle: 'MyndKonnekt 24-item Personality Questionnaire (PQ24)',
        totalQuestions: 24,
        answeredQuestions: 24,
        correctAnswers: 24,
        score: 85,
        timeSpent: 1200,
        completedAt: '2024-06-01T11:00:00.000Z',
        isLikertAssessment: true,
        subscaleScores: {
            'Leadership Drive': '4.2',
            'Team Orientation': '3.8',
            'Cognitive Flexibility': '4.5',
            'Conscientiousness': '4.1',
            'Emotional Resilience': '3.9',
            'Communication Style': '4.3'
        },
        answers: {
            0: { answer: 4 },
            1: { answer: 3 },
            2: { answer: 5 },
            3: { answer: 4 },
            4: { answer: 4 },
            5: { answer: 4 },
            6: { answer: 5 },
            7: { answer: 2 },
            8: { answer: 5 },
            9: { answer: 4 },
            10: { answer: 2 },
            11: { answer: 4 },
            12: { answer: 5 },
            13: { answer: 4 },
            14: { answer: 5 },
            15: { answer: 4 },
            16: { answer: 4 },
            17: { answer: 4 },
            18: { answer: 2 },
            19: { answer: 4 },
            20: { answer: 5 },
            21: { answer: 2 },
            22: { answer: 2 },
            23: { answer: 4 }
        }
    },
    // Arun's Behavioral Skills Assessment (Likert Scale)
    {
        id: 'assessment_002',
        userId: 'user_001',
        category: 'myndkonnekt_behavioral',
        assessmentTitle: 'MyndKonnekt 24-item Behavioral Skills & Issues Measure (BSM24)',
        totalQuestions: 24,
        answeredQuestions: 24,
        correctAnswers: 15,
        score: 78,
        timeSpent: 900,
        completedAt: '2024-06-01T12:30:00.000Z',
        isLikertAssessment: true,
        subscaleScores: {
            'Self-Regulation': '3.7',
            'Collaboration & Conflict Management': '4.0',
            'Initiative & Proactiveness': '3.8',
            'Attention to Detail & Follow-Through': '4.2',
            'Workplace Conduct & Ethics': '4.1',
            'Adaptability and Learning Agility': '3.9'
        },
        answers: {
            0: { answer: 4 }, 1: { answer: 4 }, 2: { answer: 2 }, 3: { answer: 4 },
            4: { answer: 4 }, 5: { answer: 2 }, 6: { answer: 4 }, 7: { answer: 4 },
            8: { answer: 2 }, 9: { answer: 4 }, 10: { answer: 4 }, 11: { answer: 2 },
            12: { answer: 4 }, 13: { answer: 4 }, 14: { answer: 2 }, 15: { answer: 4 },
            16: { answer: 3 }, 17: { answer: 4 }, 18: { answer: 4 }, 19: { answer: 3 },
            20: { answer: 4 }, 21: { answer: 3 }, 22: { answer: 4 }, 23: { answer: 4 }
        }
    },
    // Vinay's Personality Questionnaire (Likert Scale)
    {
        id: 'assessment_003',
        userId: 'user_002',
        category: 'myndkonnekt_personality',
        assessmentTitle: 'MyndKonnekt 24-item Personality Questionnaire (PQ24)',
        totalQuestions: 24,
        answeredQuestions: 24,
        correctAnswers: 24,
        score: 72,
        timeSpent: 1350,
        completedAt: '2024-06-02T13:00:00.000Z',
        isLikertAssessment: true,
        subscaleScores: {
            'Leadership Drive': '3.5',
            'Team Orientation': '4.2',
            'Cognitive Flexibility': '3.8',
            'Conscientiousness': '3.9',
            'Emotional Resilience': '3.2',
            'Communication Style': '3.8'
        },
        answers: {
            0: { answer: 3 },
            1: { answer: 4 },
            2: { answer: 4 },
            3: { answer: 4 },
            4: { answer: 3 },
            5: { answer: 4 },
            6: { answer: 4 },
            7: { answer: 3 },
            8: { answer: 4 },
            9: { answer: 4 },
            10: { answer: 3 },
            11: { answer: 4 },
            12: { answer: 4 },
            13: { answer: 4 },
            14: { answer: 4 },
            15: { answer: 4 },
            16: { answer: 3 },
            17: { answer: 4 },
            18: { answer: 3 },
            19: { answer: 4 },
            20: { answer: 4 },
            21: { answer: 3 },
            22: { answer: 3 },
            23: { answer: 4 }
        }
    },
    // Vinay's Behavioral Skills Assessment (Likert Scale)
    {
        id: 'assessment_004',
        userId: 'user_002',
        category: 'myndkonnekt_behavioral',
        assessmentTitle: 'MyndKonnekt 24-item Behavioral Skills & Issues Measure (BSM24)',
        totalQuestions: 24,
        answeredQuestions: 24,
        correctAnswers: 15,
        score: 82,
        timeSpent: 950,
        completedAt: '2024-06-02T14:30:00.000Z',
        isLikertAssessment: true,
        subscaleScores: {
            'Self-Regulation': '4.0',
            'Collaboration & Conflict Management': '4.3',
            'Initiative & Proactiveness': '3.7',
            'Attention to Detail & Follow-Through': '3.8',
            'Workplace Conduct & Ethics': '4.2',
            'Adaptability and Learning Agility': '4.0'
        },
        answers: {
            0: { answer: 4 }, 1: { answer: 4 }, 2: { answer: 2 }, 3: { answer: 4 },
            4: { answer: 4 }, 5: { answer: 2 }, 6: { answer: 4 }, 7: { answer: 4 },
            8: { answer: 3 }, 9: { answer: 4 }, 10: { answer: 4 }, 11: { answer: 2 },
            12: { answer: 4 }, 13: { answer: 4 }, 14: { answer: 2 }, 15: { answer: 4 },
            16: { answer: 4 }, 17: { answer: 4 }, 18: { answer: 4 }, 19: { answer: 4 },
            20: { answer: 3 }, 21: { answer: 4 }, 22: { answer: 4 }, 23: { answer: 4 }
        }
    }
];

// Helper function to initialize demo data
function initializeDemoData() {
    // Check if data already exists
    const existingUsers = localStorage.getItem('users');
    const existingAssessments = localStorage.getItem('assessmentResults');
    const existingAssignments = localStorage.getItem('assessmentAssignments');
    
    if (!existingUsers) {
        localStorage.setItem('users', JSON.stringify(window.demoUsers));
        console.log('Demo users initialized');
    }
    
    if (!existingAssessments) {
        localStorage.setItem('assessmentResults', JSON.stringify(window.demoAssessmentResults));
        console.log('Demo assessment results initialized');
    }
    
    if (!existingAssignments) {
        localStorage.setItem('assessmentAssignments', JSON.stringify(window.demoAssessmentAssignments));
        console.log('Demo assessment assignments initialized');
    }
}

// Demo Assessment Assignments - Only Arun and Vinay
window.demoAssessmentAssignments = [
    {
        id: 'assignment_001',
        template: 'myndkonnekt_personality',
        assignedTo: [
            { type: 'user', value: 'user_001' },
            { type: 'user', value: 'user_002' }
        ],
        assignedAt: '2024-06-01T08:00:00.000Z',
        dueDate: '2024-12-31T23:59:59.000Z',
        status: 'active'
    },
    {
        id: 'assignment_002',
        template: 'myndkonnekt_behavioral',
        assignedTo: [
            { type: 'user', value: 'user_001' },
            { type: 'user', value: 'user_002' }
        ],
        assignedAt: '2024-06-01T08:00:00.000Z',
        dueDate: '2024-12-31T23:59:59.000Z',
        status: 'active'
    }
];

// Auto-initialize demo data when this script loads
if (typeof window !== 'undefined') {
    // Only initialize in browser environment
    $(document).ready(function() {
        initializeDemoData();
    });
}
