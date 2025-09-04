// Utility Functions for HR Assessment System
// Local Storage Management and Common Utilities

/**
 * Storage utility functions
 */
function getStorageItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
    }
}

function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error writing to localStorage:', error);
        return false;
    }
}

function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

function clearStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

/**
 * Date and time utilities
 */
function formatDate(dateString, options = {}) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    try {
        return date.toLocaleDateString('en-US', formatOptions);
    } catch (error) {
        return date.toLocaleDateString();
    }
}

function formatRelativeTime(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
    
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
}

function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0 min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && hours === 0) parts.push(`${secs}s`);
    
    return parts.length > 0 ? parts.join(' ') : '0 min';
}

/**
 * Data validation utilities
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
        isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
        checks: {
            minLength: password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        }
    };
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Array and object utilities
 */
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
}

function sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = typeof a[key] === 'string' ? a[key].toLowerCase() : a[key];
        const bVal = typeof b[key] === 'string' ? b[key].toLowerCase() : b[key];
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });
}

function filterBy(array, filters) {
    return array.filter(item => {
        return Object.keys(filters).every(key => {
            const filterValue = filters[key];
            const itemValue = item[key];
            
            if (filterValue === '' || filterValue === null || filterValue === undefined) {
                return true;
            }
            
            if (typeof filterValue === 'string') {
                return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
            }
            
            return itemValue === filterValue;
        });
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Number and calculation utilities
 */
function calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
}

function calculateAverage(numbers) {
    if (!Array.isArray(numbers) || numbers.length === 0) return 0;
    const sum = numbers.reduce((acc, num) => acc + (parseFloat(num) || 0), 0);
    return sum / numbers.length;
}

function formatNumber(number, decimals = 0) {
    if (isNaN(number)) return '0';
    return number.toLocaleString('en-US', { 
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals 
    });
}

function generateRandomId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Chart utilities
 */
function generateChartColors(count) {
    const baseColors = [
        '#667eea', '#764ba2', '#4facfe', '#00f2fe',
        '#43e97b', '#38f9d7', '#fa709a', '#fee140',
        '#a8edea', '#fed6e3', '#ffecd2', '#fcb69f'
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}

function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

/**
 * Export utilities
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showAlert('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',')
        )
    ].join('\n');
    
    downloadFile(csvContent, filename, 'text/csv');
}

function exportToJSON(data, filename) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, filename, 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
}

/**
 * DOM utilities
 */
function createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

function addEventListenerSafe(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
        element.addEventListener(event, handler);
        return true;
    }
    return false;
}

function removeEventListenerSafe(element, event, handler) {
    if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler);
        return true;
    }
    return false;
}

/**
 * Authentication utilities
 */
function isLoggedIn() {
    return getCurrentUser() !== null;
}

function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// User ID generation
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Error handling utilities
 */
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    let message = 'An unexpected error occurred.';
    if (error.message) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }
    
    showAlert(message, 'danger');
}

function showAlert(message, type = 'info', duration = 5000) {
    const alertId = 'alert-' + Date.now();
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${sanitizeInput(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto dismiss after duration
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.remove();
        }
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

/**
 * Performance utilities
 */
function measureExecutionTime(name, func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    console.log(`${name} executed in ${end - start} milliseconds`);
    return result;
}

function createCachedFunction(func, cacheSize = 100) {
    const cache = new Map();
    
    return function(...args) {
        const key = JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = func.apply(this, args);
        
        if (cache.size >= cacheSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
        
        cache.set(key, result);
        return result;
    };
}

// Export all utilities for global access
window.utils = {
    // Storage
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    clearStorage,
    
    // Date and time
    formatDate,
    formatRelativeTime,
    formatDuration,
    
    // Validation
    validateEmail,
    validatePassword,
    sanitizeInput,
    
    // Authentication
    isLoggedIn,
    requireAuth,
    generateUserId,
    
    // Arrays and objects
    groupBy,
    sortBy,
    filterBy,
    debounce,
    throttle,
    
    // Numbers
    calculatePercentage,
    calculateAverage,
    formatNumber,
    generateRandomId,
    
    // Charts
    generateChartColors,
    createGradient,
    
    // Export
    exportToCSV,
    exportToJSON,
    downloadFile,
    
    // DOM
    createElement,
    addEventListenerSafe,
    removeEventListenerSafe,
    
    // Error handling
    handleError,
    showAlert,
    getAlertIcon,
    
    // Performance
    measureExecutionTime,
    createCachedFunction
};

// Also make utilities available globally for backward compatibility
Object.keys(window.utils).forEach(key => {
    if (!window[key]) {
        window[key] = window.utils[key];
    }
});

// ----------------------
// Dynamic data utilities
// ----------------------

// Departments CRUD stored in localStorage under 'departments'
function getDepartments() {
    const stored = getStorageItem('departments');
    if (Array.isArray(stored) && stored.length > 0) return stored;
    // Default seed departments
    const defaults = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales'];
    setStorageItem('departments', defaults);
    return defaults;
}

function setDepartments(departments) {
    if (!Array.isArray(departments)) return false;
    return setStorageItem('departments', departments);
}

function addDepartment(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return false;
    const departments = getDepartments();
    if (!departments.includes(trimmed)) {
        departments.push(trimmed);
        setStorageItem('departments', departments);
        return true;
    }
    return false;
}

function removeDepartment(name) {
    const departments = getDepartments().filter(d => d !== name);
    return setStorageItem('departments', departments);
}

// Custom assessment templates (MCQ only for now) under 'customAssessmentTemplates'
function getCustomAssessmentTemplates() {
    const templates = getStorageItem('customAssessmentTemplates');
    return templates && typeof templates === 'object' ? templates : {};
}

function saveCustomAssessmentTemplate(categoryKey, templateObject) {
    const key = (categoryKey || '').trim();
    if (!key) throw new Error('Category key is required');
    const templates = getCustomAssessmentTemplates();
    templates[key] = templateObject;
    setStorageItem('customAssessmentTemplates', templates);
    return templates[key];
}

function getMergedAssessmentTemplates() {
    const base = (typeof window !== 'undefined' && window.assessmentTemplates) ? window.assessmentTemplates : {};
    const custom = getCustomAssessmentTemplates();
    return { ...base, ...custom };
}

// Export new utilities
window.utils.getDepartments = getDepartments;
window.utils.setDepartments = setDepartments;
window.utils.addDepartment = addDepartment;
window.utils.removeDepartment = removeDepartment;
window.utils.getCustomAssessmentTemplates = getCustomAssessmentTemplates;
window.utils.saveCustomAssessmentTemplate = saveCustomAssessmentTemplate;
window.utils.getMergedAssessmentTemplates = getMergedAssessmentTemplates;

// Backward-compat: attach to window if missing
['getDepartments','setDepartments','addDepartment','removeDepartment','getCustomAssessmentTemplates','saveCustomAssessmentTemplate','getMergedAssessmentTemplates']
    .forEach(fn => { if (!window[fn]) window[fn] = window.utils[fn]; });
