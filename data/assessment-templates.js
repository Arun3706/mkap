// Assessment Templates for HR Assessment System
// This file contains question templates for different assessment categories

window.assessmentTemplates = {
    // MyndKonnekt Personality Questionnaire (PQ24)
    myndkonnekt_personality: {
        title: "Personality Questionnaire (PQ24)",
        description: "Measures personality traits across 6 subscales using a Likert 1-5 scale.",
        timeLimit: 25,
        difficulty: "Medium",
        icon: "fa-user-circle",
        questions: [
            { type: "likert", text: "I enjoy taking charge when a group needs direction.", subscale: "Leadership Drive", reverse: false },
            { type: "likert", text: "I prefer to work together with others to reach a decision rather than decide alone.", subscale: "Team Orientation", reverse: false },
            { type: "likert", text: "I quickly adapt my approach when plans change.", subscale: "Cognitive Flexibility", reverse: false },
            { type: "likert", text: "I keep my work area and schedule well organized.", subscale: "Conscientiousness", reverse: false },
            { type: "likert", text: "I stay calm and focused when unexpected problems arise.", subscale: "Emotional Resilience", reverse: false },
            { type: "likert", text: "I explain my ideas clearly so others can follow them.", subscale: "Communication Style", reverse: false },
            { type: "likert", text: "I look for opportunities to lead even if it means extra responsibility.", subscale: "Leadership Drive", reverse: false },
            { type: "likert", text: "I sometimes put my own priorities ahead of the team’s needs.", subscale: "Team Orientation", reverse: true },
            { type: "likert", text: "I enjoy trying new methods or tools to solve a problem.", subscale: "Cognitive Flexibility", reverse: false },
            { type: "likert", text: "I complete tasks on or before the agreed deadline.", subscale: "Conscientiousness", reverse: false },
            { type: "likert", text: "I feel overwhelmed by stress and lose effectiveness.", subscale: "Emotional Resilience", reverse: true },
            { type: "likert", text: "I tailor how I communicate depending on who I’m speaking with.", subscale: "Communication Style", reverse: false },
            { type: "likert", text: "I prefer being the person who defines goals and delegates tasks.", subscale: "Leadership Drive", reverse: false },
            { type: "likert", text: "I actively help colleagues who are behind, even if it delays me.", subscale: "Team Orientation", reverse: false },
            { type: "likert", text: "I can hold multiple hypotheses in mind and change tack if evidence suggests.", subscale: "Cognitive Flexibility", reverse: false },
            { type: "likert", text: "I double-check my work and follow established procedures.", subscale: "Conscientiousness", reverse: false },
            { type: "likert", text: "I recover quickly after setbacks and stay optimistic.", subscale: "Emotional Resilience", reverse: false },
            { type: "likert", text: "I make my thoughts known even when the group is divided.", subscale: "Communication Style", reverse: false },
            { type: "likert", text: "I find it hard to let go of control and usually insist on my plan.", subscale: "Leadership Drive", reverse: true },
            { type: "likert", text: "I prefer to resolve conflicts privately rather than ignore them.", subscale: "Team Orientation", reverse: false },
            { type: "likert", text: "I enjoy complex, ambiguous problems where rules aren’t clear.", subscale: "Cognitive Flexibility", reverse: false },
            { type: "likert", text: "I sometimes delay or procrastinate on important tasks.", subscale: "Conscientiousness", reverse: true },
            { type: "likert", text: "I allow negative emotions to affect my decisions under pressure.", subscale: "Emotional Resilience", reverse: true },
            { type: "likert", text: "I adapt my tone and level of detail to the listener.", subscale: "Communication Style", reverse: false }
        ]
    },

    // MyndKonnekt Behavioral Skills & Issues Measure (BSM24)
    myndkonnekt_behavioral: {
        title: "Behavioral Skills & Issues Measure (BSM24)",
        description: "Measures workplace behavioral skills across 6 subscales using a Likert 1-5 scale.",
        timeLimit: 25,
        difficulty: "Medium",
        icon: "fa-users-cog",
        questions: [
            // Self-Regulation (SR) - Items 1-4
            { type: "likert", text: "I stay calm and steady when deadlines get tight.", subscale: "Self-Regulation", reverse: false },
            { type: "likert", text: "When frustrated, I pause before responding and choose a measured reply.", subscale: "Self-Regulation", reverse: false },
            { type: "likert", text: "I keep working effectively when unexpected problems arise.", subscale: "Self-Regulation", reverse: false },
            { type: "likert", text: "I manage my workload so stress does not affect my performance.", subscale: "Self-Regulation", reverse: false },
            
            // Collaboration & Conflict Management (CC) - Items 5-8
            { type: "likert", text: "I bring others into problem-solving when teamwork is needed.", subscale: "Collaboration & Conflict Management", reverse: false },
            { type: "likert", text: "I discuss disagreements openly, aiming for practical solutions.", subscale: "Collaboration & Conflict Management", reverse: false },
            { type: "likert", text: "I adapt my approach to make team decisions easier to implement.", subscale: "Collaboration & Conflict Management", reverse: false },
            { type: "likert", text: "I share credit and recognise teammates' contributions.", subscale: "Collaboration & Conflict Management", reverse: false },
            
            // Initiative & Proactiveness (IP) - Items 9-12
            { type: "likert", text: "I volunteer to take on work that will help the team succeed.", subscale: "Initiative & Proactiveness", reverse: false },
            { type: "likert", text: "I propose practical improvements to processes I use.", subscale: "Initiative & Proactiveness", reverse: false },
            { type: "likert", text: "I follow through on new ideas until they're tested.", subscale: "Initiative & Proactiveness", reverse: false },
            { type: "likert", text: "I take responsibility for fixing problems I observe.", subscale: "Initiative & Proactiveness", reverse: false },
            
            // Attention to Detail & Follow-Through (AD) - Items 13-16
            { type: "likert", text: "I double-check my work to catch avoidable errors.", subscale: "Attention to Detail & Follow-Through", reverse: false },
            { type: "likert", text: "I finish small tasks reliably without reminders.", subscale: "Attention to Detail & Follow-Through", reverse: false },
            { type: "likert", text: "I deliver work that is both complete and well-documented.", subscale: "Attention to Detail & Follow-Through", reverse: false },
            { type: "likert", text: "I track progress and update stakeholders until tasks are closed.", subscale: "Attention to Detail & Follow-Through", reverse: false },
            
            // Workplace Conduct & Ethics (WE) - Items 17-20
            { type: "likert", text: "I accept feedback constructively and act on it.", subscale: "Workplace Conduct & Ethics", reverse: false },
            { type: "likert", text: "I behave respectfully even in tense situations.", subscale: "Workplace Conduct & Ethics", reverse: false },
            { type: "likert", text: "I follow workplace rules even when they are inconvenient.", subscale: "Workplace Conduct & Ethics", reverse: false },
            { type: "likert", text: "I own up to mistakes and correct them promptly.", subscale: "Workplace Conduct & Ethics", reverse: false },
            
            // Adaptability and Learning Agility (AL) - Items 21-24
            { type: "likert", text: "I adjust how I work when project goals change.", subscale: "Adaptability and Learning Agility", reverse: false },
            { type: "likert", text: "I pick up new tools or methods when they improve outcomes.", subscale: "Adaptability and Learning Agility", reverse: false },
            { type: "likert", text: "I learn from setbacks and change my approach next time.", subscale: "Adaptability and Learning Agility", reverse: false },
            { type: "likert", text: "I willingly take on unfamiliar tasks to build new skills.", subscale: "Adaptability and Learning Agility", reverse: false }
        ]
    }
};

// Assessment configuration
window.assessmentConfig = {
    categories: ['technical', 'behavioral', 'personality', 'myndkonnekt_personality', 'myndkonnekt_behavioral'],
    defaultTimeLimit: 45,
    passingScore: 60,
    maxRetries: 3,
    saveInterval: 30000,
    warningTime: 300,
    criticalTime: 60
};

// Helper functions for assessment templates
window.assessmentHelpers = {
    getTemplate: function(category) {
        return window.assessmentTemplates[category] || null;
    },
    
    getAllCategories: function() {
        return Object.keys(window.assessmentTemplates);
    },
    
    getQuestionCount: function(category) {
        const template = this.getTemplate(category);
        return template ? template.questions.length : 0;
    },
    
    getTimeLimit: function(category) {
        const template = this.getTemplate(category);
        return template ? template.timeLimit : window.assessmentConfig.defaultTimeLimit;
    },

    validateAnswer: function(question, userAnswer) {
        if (question.type === "likert") {
            return userAnswer >= 1 && userAnswer <= 5;
        }
        if (question.correctAnswer === null || question.correctAnswer === undefined) {
            return true;
        }
        if (Array.isArray(question.correctAnswer)) {
            return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
        } else {
            return userAnswer === question.correctAnswer;
        }
    },

    calculateScore: function(template, userAnswers) {
        if (!template) return null;
        
        if (template.questions.length && template.questions[0].type === "likert") {
            let subscaleScores = {};
            template.questions.forEach((question, index) => {
                let response = userAnswers[index]?.answer;
                if (response !== undefined) {
                    let score = question.reverse ? (6 - response) : response;
                    if (!subscaleScores[question.subscale]) {
                        subscaleScores[question.subscale] = { total: 0, count: 0 };
                    }
                    subscaleScores[question.subscale].total += score;
                    subscaleScores[question.subscale].count++;
                }
            });
            let results = {};
            for (let sub in subscaleScores) {
                results[sub] = (subscaleScores[sub].total / subscaleScores[sub].count).toFixed(2);
            }
            return results;
        } else {
            let totalQuestions = template.questions.length;
            let correctAnswers = 0;
            template.questions.forEach((question, index) => {
                const userAnswer = userAnswers[index];
                if (userAnswer && this.validateAnswer(question, userAnswer.answer)) {
                    correctAnswers++;
                }
            });
            return {
                totalQuestions,
                correctAnswers,
                percentage: Math.round((correctAnswers / totalQuestions) * 100)
            };
        }
    },

    getQuestionTypes: function(category) {
        const template = this.getTemplate(category);
        if (!template) return [];
        return [...new Set(template.questions.map(q => q.type))];
    },

    getDifficultyLevel: function(category) {
    }
};

if (typeof window !== 'undefined') {
    window.assessmentHelpers = assessmentHelpers;
    window.getAssessmentTemplate = assessmentHelpers.getTemplate.bind(assessmentHelpers);
    window.getAllAssessmentCategories = assessmentHelpers.getAllCategories;
    window.getAssessmentQuestionCount = assessmentHelpers.getQuestionCount;
    window.getAssessmentTimeLimit = assessmentHelpers.getTimeLimit;
}
