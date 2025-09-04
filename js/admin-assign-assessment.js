$(document).ready(function() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    loadAssessmentTemplates();
    loadUsersAndDepartments();

    $('input[name="assignmentType"]').on('change', function() {
        if (this.value === 'department') {
            $('#departmentSelection').removeClass('d-none');
            $('#userSelection').addClass('d-none');
        } else {
            $('#departmentSelection').addClass('d-none');
            $('#userSelection').removeClass('d-none');
        }
    });

    $('#assignAssessmentForm').on('submit', function(e) {
        e.preventDefault();
        assignAssessment();
    });

    $('#logoutBtn').on('click', function() {
        logout();
    });

    $('#menu-toggle').on('click', function() {
        $('#wrapper').toggleClass('toggled');
    });
});

function loadAssessmentTemplates() {
    console.log('Loading assessment templates...');
    const select = $('#assessmentTemplate');
    select.empty().append('<option value="">Select an assessment template</option>');
    
    // Check if assessmentTemplates is available
    if (!window.assessmentTemplates) {
        console.error('Assessment templates not found in window.assessmentTemplates');
        console.log('Available window properties:', Object.keys(window).filter(k => k.includes('assess') || k.includes('template')));
        
        // Try to load default templates if not found
        if (typeof loadDefaultTemplates === 'function') {
            console.log('Attempting to load default templates...');
            loadDefaultTemplates();
        }
        
        if (!window.assessmentTemplates) {
            console.error('Failed to load assessment templates');
            select.append('<option value="" disabled>Error loading assessment templates</option>');
            return;
        }
    }
    
    console.log('Found assessment templates:', window.assessmentTemplates);
    
    // Add each template to the dropdown
    let count = 0;
    try {
        // Add "All Templates" option first
        select.append('<option value="all">--- All Assessment Templates ---</option>');
        
        // Add individual templates
        Object.entries(window.assessmentTemplates).forEach(([category, template]) => {
            if (category && template && template.title) {
                console.log(`Adding template: ${category} - ${template.title}`);
                select.append(`<option value="${category}">${template.title}</option>`);
                count++;
            }
        });
    } catch (error) {
        console.error('Error processing assessment templates:', error);
    }
    
    console.log(`Loaded ${count} assessment templates`);
    
    // If no templates were added, show an error
    if (count === 0) {
        console.error('No valid assessment templates found');
        select.append('<option value="" disabled>No assessment templates available</option>');
    }
}

function loadUsersAndDepartments() {
    const users = getStorageItem('users') || [];
    const userSelect = $('#users');
    const departmentSelect = $('#department');
    const departments = new Set(getDepartments());

    users.forEach(user => {
        const roleLabel = user.role === 'admin' ? ' [Admin]' : '';
        userSelect.append(`<option value="${user.id}">${user.fullName} (${user.email})${roleLabel}</option>`);
    });

    departments.forEach(department => {
        departmentSelect.append(`<option value="${department}">${department}</option>`);
    });
}

function assignAssessment() {
    const template = $('#assessmentTemplate').val();
    const assignmentType = $('input[name="assignmentType"]:checked').val();
    let assignedTo = [];

    if (assignmentType === 'department') {
        const department = $('#department').val();
        assignedTo.push({ type: 'department', value: department });
    } else {
        const selectedUsers = $('#users').val();
        if (selectedUsers && selectedUsers.length > 0) {
            assignedTo = selectedUsers.map(userId => ({ type: 'user', value: userId }));
        }
    }

    if (!template || assignedTo.length === 0) {
        showAlert('Please select an assessment and at least one user or department.', 'danger');
        return;
    }

    const assignments = getStorageItem('assessmentAssignments') || [];
    const newAssignment = {
        id: `asg_${new Date().getTime()}`,
        template: template,
        assignedTo: assignedTo,
        assignedAt: new Date().toISOString()
    };

    assignments.push(newAssignment);
    setStorageItem('assessmentAssignments', assignments);

    showAlert('Assessment assigned successfully!', 'success');
    $('#assignAssessmentForm')[0].reset();
} 