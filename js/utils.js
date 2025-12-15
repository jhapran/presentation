// Utility Functions for FDO Hygiene Monitoring System

// API Base URL (using relative paths for Table API)
const API_BASE = 'tables';

// Format date to readable string
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format datetime to readable string
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get time ago string
function getTimeAgo(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// API Helper Functions
async function apiGet(tableName, recordId = null) {
    try {
        const url = recordId ? `${API_BASE}/${tableName}/${recordId}` : `${API_BASE}/${tableName}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API GET Error:', error);
        showToast(`Error fetching data: ${error.message}`, 'error');
        return null;
    }
}

async function apiPost(tableName, data) {
    try {
        const response = await fetch(`${API_BASE}/${tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API POST Error:', error);
        showToast(`Error creating record: ${error.message}`, 'error');
        return null;
    }
}

async function apiPut(tableName, recordId, data) {
    try {
        const response = await fetch(`${API_BASE}/${tableName}/${recordId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API PUT Error:', error);
        showToast(`Error updating record: ${error.message}`, 'error');
        return null;
    }
}

async function apiPatch(tableName, recordId, data) {
    try {
        const response = await fetch(`${API_BASE}/${tableName}/${recordId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API PATCH Error:', error);
        showToast(`Error updating record: ${error.message}`, 'error');
        return null;
    }
}

async function apiDelete(tableName, recordId) {
    try {
        const response = await fetch(`${API_BASE}/${tableName}/${recordId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return true;
    } catch (error) {
        console.error('API DELETE Error:', error);
        showToast(`Error deleting record: ${error.message}`, 'error');
        return false;
    }
}

// Get severity badge class
function getSeverityBadge(severity) {
    const badges = {
        critical: 'badge-critical',
        high: 'badge-high',
        medium: 'badge-medium',
        low: 'badge-low'
    };
    return badges[severity] || 'badge-info';
}

// Get status badge class
function getStatusBadge(status) {
    const badges = {
        open: 'badge-danger',
        in_progress: 'badge-warning',
        resolved: 'badge-success',
        active: 'badge-active',
        pending: 'badge-pending',
        sent: 'badge-success',
        failed: 'badge-danger',
        healthy: 'badge-success',
        warning: 'badge-warning',
        critical: 'badge-danger'
    };
    return badges[status] || 'badge-info';
}

// Log audit event
async function logAuditEvent(action, entityType, entityId, description, details = {}) {
    const auditEntry = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        action,
        entityType,
        entityId,
        description,
        details: JSON.stringify(details)
    };
    
    await apiPost('audit_log', auditEntry);
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Calculate compliance rate
function calculateComplianceRate(totalProjects, projectsWithIssues) {
    if (totalProjects === 0) return 0;
    const healthyProjects = totalProjects - projectsWithIssues;
    return Math.round((healthyProjects / totalProjects) * 100);
}

// Filter table data
function filterTableData(data, searchTerm, filters = {}) {
    return data.filter(item => {
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const searchMatch = Object.values(item).some(value => 
                String(value).toLowerCase().includes(searchLower)
            );
            if (!searchMatch) return false;
        }
        
        // Additional filters
        for (const [key, value] of Object.entries(filters)) {
            if (value && item[key] !== value) {
                return false;
            }
        }
        
        return true;
    });
}

// Export data to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${getTodayDate()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Data exported successfully', 'success');
}

// Confirm dialog
function confirmDialog(message) {
    return confirm(message);
}

// Get all records from a table
async function getAllRecords(tableName) {
    const response = await apiGet(tableName);
    return response ? response.data || [] : [];
}

// Check if a field is empty
function isFieldEmpty(value) {
    return !value || value.trim() === '';
}

// Check if a date is outdated (older than 30 days)
function isDateOutdated(dateString, daysThreshold = 30) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    return diffDays > daysThreshold;
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('FDO Hygiene Monitoring System loaded');
});
