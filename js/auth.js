// Authentication JavaScript
$(document).ready(function() {
    // Initialize authentication handlers
    initializeAuthHandlers();
    
    // Initialize password toggle
    initializePasswordToggle();
    
    // Auto-fill demo credentials if on login page
    if (window.location.pathname.includes('login.html')) {
        setupDemoCredentials();
    }
});

function initializeAuthHandlers() {
    // Registration form handler
    $('#registerForm').on('submit', handleRegistration);
    
    // Login form handler
    $('#loginForm').on('submit', handleLogin);
    
    // Real-time validation
    setupRealTimeValidation();
}

function handleRegistration(e) {
    e.preventDefault();
    console.log('Registration form submitted');
    
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());
    console.log('Form data:', userData);
    
    // Validate form data
    const validation = validateRegistrationData(userData);
    console.log('Validation result:', validation);
    if (!validation.isValid) {
        displayValidationErrors(validation.errors);
        return;
    }
    
    // Show loading state
    setFormLoadingState('#registerForm', true);
    
    // Simulate API delay
    setTimeout(() => {
        try {
            // Check if user already exists
            const existingUsers = getStorageItem('users') || [];
            const emailExists = existingUsers.some(user => user.email === userData.email);
            
            if (emailExists) {
                setFormLoadingState('#registerForm', false);
                showFieldError('email', 'This email address is already registered');
                return;
            }
            
            // Create new user
            const salt = generateSalt();
            const newUser = {
                id: generateUserId(),
                fullName: userData.fullName,
                email: userData.email,
                department: userData.department,
                experience: userData.experience,
                salt: salt,
                password: hashPassword(userData.password, salt),
                role: 'user',
                registeredAt: new Date().toISOString(),
                lastLogin: null,
                isActive: true
            };
            
            // Save user
            existingUsers.push(newUser);
            setStorageItem('users', existingUsers);
            
            setFormLoadingState('#registerForm', false);
            
            // Show success modal
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();
            
        } catch (error) {
            setFormLoadingState('#registerForm', false);
            showAlert('Registration failed. Please try again.', 'danger');
            console.error('Registration error:', error);
        }
    }, 1500);
}

function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData.entries());
    
    // Validate form data
    const validation = validateLoginData(loginData);
    if (!validation.isValid) {
        displayValidationErrors(validation.errors);
        return;
    }
    
    // Show loading state
    setFormLoadingState('#loginForm', true);
    
    // Simulate API delay
    setTimeout(() => {
        try {
            // Check credentials
            const users = getStorageItem('users') || [];
            const user = users.find(u => 
                u.email === loginData.email && 
                verifyPassword(loginData.password, u.salt, u.password)
            );
            
            if (!user) {
                setFormLoadingState('#loginForm', false);
                showFieldError('password', 'Invalid email or password');
                return;
            }
            
            // Update last login
            user.lastLogin = new Date().toISOString();
            setStorageItem('users', users);
            
            // Set current user
            setStorageItem('currentUser', user);
            
            // Initialize assessment assignments
            initializeAssessmentAssignments(user);
            
            // Remember me functionality
            if (loginData.rememberMe) {
                localStorage.setItem('rememberUser', user.email);
            }
            
            setFormLoadingState('#loginForm', false);
            
            // Redirect based on role
            if (user.role === 'admin') {
                window.location.href = 'admin-panel.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            
        } catch (error) {
            setFormLoadingState('#loginForm', false);
            showAlert('Login failed. Please try again.', 'danger');
            console.error('Login error:', error);
        }
    }, 1000);
}

function validateRegistrationData(data) {
    const errors = {};
    
    // Full name validation
    if (!data.fullName || data.fullName.trim().length < 2) {
        errors.fullName = 'Full name must be at least 2 characters long';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.email = 'Please enter a valid email address';
    }
    
    // Department validation
    if (!data.department) {
        errors.department = 'Please select a department';
    }
    
    // Experience validation
    if (!data.experience) {
        errors.experience = 'Please select your experience level';
    }
    
    // Password validation
    if (!data.password || data.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
    }
    
    // Password confirmation
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement
    if (!data.agreeTerms) {
        errors.agreeTerms = 'You must agree to the terms of service';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

function validateLoginData(data) {
    const errors = {};
    
    // Email validation
    if (!data.email) {
        errors.email = 'Email address is required';
    }
    
    // Password validation
    if (!data.password) {
        errors.password = 'Password is required';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
}

function displayValidationErrors(errors) {
    // Clear previous errors
    $('.form-control, .form-select').removeClass('is-invalid');
    $('.invalid-feedback').text('');
    
    // Display new errors
    Object.keys(errors).forEach(field => {
        showFieldError(field, errors[field]);
    });
    
    // Add shake animation to form
    $('.auth-form').addClass('shake');
    setTimeout(() => {
        $('.auth-form').removeClass('shake');
    }, 500);
}

function showFieldError(fieldName, message) {
    const field = $(`[name="${fieldName}"]`);
    field.addClass('is-invalid field-error');
    field.siblings('.invalid-feedback').text(message);
    
    // Remove error styling after user starts typing
    field.on('input change', function() {
        $(this).removeClass('is-invalid field-error');
        $(this).siblings('.invalid-feedback').text('');
    });
}

function setFormLoadingState(formSelector, loading) {
    const form = $(formSelector);
    const submitBtn = form.find('[type="submit"]');
    
    if (loading) {
        submitBtn.prop('disabled', true);
        submitBtn.find('.btn-text').addClass('d-none');
        submitBtn.find('.btn-loading').removeClass('d-none');
    } else {
        submitBtn.prop('disabled', false);
        submitBtn.find('.btn-text').removeClass('d-none');
        submitBtn.find('.btn-loading').addClass('d-none');
    }
}

function setupRealTimeValidation() {
    // Email validation
    $('input[type="email"]').on('blur', function() {
        const email = $(this).val();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            showFieldError($(this).attr('name'), 'Please enter a valid email address');
        } else if (email && emailRegex.test(email)) {
            $(this).addClass('field-success');
        }
    });
    
    // Password confirmation
    $('#confirmPassword').on('input', function() {
        const password = $('#password').val();
        const confirmPassword = $(this).val();
        
        if (confirmPassword && password !== confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match');
        } else if (confirmPassword && password === confirmPassword) {
            $(this).addClass('field-success');
        }
    });
    
    // Password strength indicator
    $('#password').on('input', function() {
        const password = $(this).val();
        const strength = calculatePasswordStrength(password);
        displayPasswordStrength(strength);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/)) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^a-zA-Z0-9]/)) score++;
    
    return {
        score: score,
        percentage: (score / 5) * 100,
        level: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
}

function displayPasswordStrength(strength) {
    let strengthIndicator = $('#passwordStrength');
    
    // Create indicator if it doesn't exist
    if (strengthIndicator.length === 0) {
        $('#password').parent().after(`
            <div id="passwordStrength" class="mt-2">
                <div class="progress" style="height: 4px;">
                    <div class="progress-bar" role="progressbar"></div>
                </div>
                <small class="text-muted strength-text"></small>
            </div>
        `);
        strengthIndicator = $('#passwordStrength');
    }
    
    const progressBar = strengthIndicator.find('.progress-bar');
    const strengthText = strengthIndicator.find('.strength-text');
    
    // Update progress bar
    progressBar.css('width', strength.percentage + '%');
    
    // Update colors and text
    progressBar.removeClass('bg-danger bg-warning bg-success');
    switch (strength.level) {
        case 'weak':
            progressBar.addClass('bg-danger');
            strengthText.text('Weak password').removeClass('text-warning text-success').addClass('text-danger');
            break;
        case 'medium':
            progressBar.addClass('bg-warning');
            strengthText.text('Medium strength').removeClass('text-danger text-success').addClass('text-warning');
            break;
        case 'strong':
            progressBar.addClass('bg-success');
            strengthText.text('Strong password').removeClass('text-danger text-warning').addClass('text-success');
            break;
    }
}

function initializePasswordToggle() {
    $(document).on('click', '#togglePassword', function() {
        const passwordField = $(this).siblings('input');
        const icon = $(this).find('i');
        
        if (passwordField.attr('type') === 'password') {
            passwordField.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            passwordField.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
}

function setupDemoCredentials() {
    // Demo autofill disabled per requirements
    return;
}

// Utility functions
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateSalt(length = 16) {
    let salt = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        salt += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return salt;
}

function hashPassword(password, salt) {
    // In a real application, use a strong hashing algorithm like Argon2 or bcrypt
    return btoa(password + salt);
}

function verifyPassword(password, salt, hashedPassword) {
    return hashPassword(password, salt) === hashedPassword;
}

function getCurrentUser() {
    return getStorageItem('currentUser');
}

function logout() {
    // Clear user session
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    
    // Clear remember me if not checked
    if (!localStorage.getItem('rememberUser')) {
        localStorage.removeItem('rememberUser');
    }
    
    // Redirect to login
    window.location.href = 'login.html';
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getCurrentUser();
}

// Initialize sample assessment assignments for a user
function initializeAssessmentAssignments(user) {
    // Initialize assessment templates if they don't exist
    if (!window.assessmentTemplates) {
        // Load assessment templates
        $.getScript('data/assessment-templates.js')
            .done(function() {
                console.log('Assessment templates loaded successfully');
                // Continue with assignments initialization
                createSampleAssignments(user);
            })
            .fail(function(jqxhr, settings, exception) {
                console.error('Failed to load assessment templates:', exception);
            });
    } else {
        // Templates already loaded, just create assignments
        createSampleAssignments(user);
    }
}

function createSampleAssignments(user) {
    // Only initialize if no assignments exist yet
    if (!getStorageItem('assessmentAssignments') || getStorageItem('assessmentAssignments').length === 0) {
        const assignments = [{
            id: 'assgn-' + Date.now(),
            template: 'technical',
            assignedTo: [
                { type: 'user', value: user.id },
                { type: 'department', value: user.department || 'all' }
            ],
            assignedBy: 'system',
            assignedAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'assigned'
        }];
        
        setStorageItem('assessmentAssignments', assignments);
        console.log('Initialized sample assessment assignments:', assignments);
    } else {
        console.log('Assessment assignments already exist:', getStorageItem('assessmentAssignments'));
    }
}

// Export authentication functions
window.auth = {
    getCurrentUser,
    logout,
    isAdmin,
    isAuthenticated,
    generateUserId,
    hashPassword,
    verifyPassword
};
