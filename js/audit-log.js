// Audit Log Functionality

let allAuditLogs = [];

// Initialize Audit Log Page
async function initAuditLog() {
    await loadAuditStats();
    await loadAuditLog();
    setupEventListeners();
}

// Load Audit Stats
async function loadAuditStats() {
    try {
        const logs = await getAllRecords('audit_log');

        const totalEvents = logs.length;
        
        const today = getTodayDate();
        const todayEvents = logs.filter(log => {
            const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
            return logDate === today;
        }).length;
        
        const hygieneChecks = logs.filter(log => log.action === 'hygiene_check').length;
        const resolutionEvents = logs.filter(log => log.action === 'issue_resolved').length;

        document.getElementById('totalEvents').textContent = totalEvents;
        document.getElementById('todayEvents').textContent = todayEvents;
        document.getElementById('hygieneChecks').textContent = hygieneChecks;
        document.getElementById('resolutionEvents').textContent = resolutionEvents;

    } catch (error) {
        console.error('Error loading audit stats:', error);
    }
}

// Load Audit Log
async function loadAuditLog() {
    try {
        allAuditLogs = await getAllRecords('audit_log');
        
        // Sort by timestamp (newest first)
        allAuditLogs.sort((a, b) => {
            const dateA = new Date(a.timestamp || 0);
            const dateB = new Date(b.timestamp || 0);
            return dateB - dateA;
        });
        
        renderAuditLogTable(allAuditLogs);
    } catch (error) {
        console.error('Error loading audit log:', error);
        document.getElementById('auditLogTableBody').innerHTML = 
            '<tr><td colspan="6" class="text-center">Error loading audit log</td></tr>';
    }
}

// Render Audit Log Table
function renderAuditLogTable(logs) {
    const tbody = document.getElementById('auditLogTableBody');
    
    if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No audit log entries found</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td><span class="badge ${getActionBadge(log.action)}">${formatAction(log.action)}</span></td>
            <td>${formatEntityType(log.entityType)}</td>
            <td style="font-family: monospace; font-size: 0.8em;">${log.entityId ? log.entityId.substring(0, 12) : 'N/A'}...</td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${log.description || 'N/A'}</td>
            <td>
                ${log.details ? `
                <button class="btn btn-sm btn-primary" onclick="viewDetails('${log.id}')" title="View Details">
                    <i class="fas fa-info-circle"></i>
                </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

// Get Action Badge
function getActionBadge(action) {
    const badges = {
        'hygiene_check': 'badge-info',
        'issue_detected': 'badge-danger',
        'issue_resolved': 'badge-success',
        'notification_sent': 'badge-info',
        'project_created': 'badge-success',
        'project_updated': 'badge-warning',
        'rule_created': 'badge-success',
        'rule_updated': 'badge-warning'
    };
    return badges[action] || 'badge-info';
}

// Format Action
function formatAction(action) {
    if (!action) return 'N/A';
    return action.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Format Entity Type
function formatEntityType(entityType) {
    if (!entityType) return 'N/A';
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

// View Details
function viewDetails(logId) {
    const log = allAuditLogs.find(l => l.id === logId);
    
    if (!log) {
        showToast('Log entry not found', 'error');
        return;
    }
    
    let detailsHTML = `
        <div style="margin-bottom: 1rem;">
            <strong>Timestamp:</strong> ${formatDateTime(log.timestamp)}<br>
            <strong>Action:</strong> ${formatAction(log.action)}<br>
            <strong>Entity Type:</strong> ${formatEntityType(log.entityType)}<br>
            <strong>Entity ID:</strong> ${log.entityId}<br>
            <strong>Description:</strong> ${log.description}
        </div>
    `;
    
    if (log.details) {
        try {
            const details = JSON.parse(log.details);
            detailsHTML += `
                <div style="margin-top: 1.5rem;">
                    <strong>Additional Details:</strong>
                    <pre style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-top: 0.5rem;">${JSON.stringify(details, null, 2)}</pre>
                </div>
            `;
        } catch (e) {
            detailsHTML += `
                <div style="margin-top: 1.5rem;">
                    <strong>Additional Details:</strong>
                    <pre style="background: #f1f5f9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-top: 0.5rem;">${log.details}</pre>
                </div>
            `;
        }
    }
    
    document.getElementById('detailsContent').innerHTML = detailsHTML;
    document.getElementById('detailsModal').classList.add('active');
}

// Close Details Modal
function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
}

// Export Log
function exportLog() {
    const filterLogs = applyCurrentFilters();
    
    if (filterLogs.length === 0) {
        showToast('No logs to export', 'warning');
        return;
    }
    
    const exportData = filterLogs.map(log => ({
        Timestamp: formatDateTime(log.timestamp),
        Action: formatAction(log.action),
        'Entity Type': formatEntityType(log.entityType),
        'Entity ID': log.entityId,
        Description: log.description
    }));
    
    exportToCSV(exportData, 'audit_log');
}

// Apply Current Filters
function applyCurrentFilters() {
    const searchTerm = document.getElementById('searchLogs').value;
    const actionFilter = document.getElementById('actionFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredLogs = allAuditLogs;
    
    // Search filter
    if (searchTerm) {
        filteredLogs = filterTableData(filteredLogs, searchTerm, {});
    }
    
    // Action filter
    if (actionFilter) {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
    }
    
    // Date filter
    if (dateFilter) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
            return logDate === dateFilter;
        });
    }
    
    return filteredLogs;
}

// Setup Event Listeners
function setupEventListeners() {
    // Export log button
    document.getElementById('exportLogBtn').addEventListener('click', exportLog);
    
    // Close details modal
    document.getElementById('closeDetailsModalBtn').addEventListener('click', closeDetailsModal);
    
    // Search and filter
    document.getElementById('searchLogs').addEventListener('input', applyFilters);
    document.getElementById('actionFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFilter').addEventListener('change', applyFilters);
    
    // Close modal on outside click
    document.getElementById('detailsModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailsModal') {
            closeDetailsModal();
        }
    });
}

// Apply Filters
function applyFilters() {
    const filteredLogs = applyCurrentFilters();
    renderAuditLogTable(filteredLogs);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuditLog);
