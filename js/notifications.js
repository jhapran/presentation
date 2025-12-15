// Notifications Management Functionality

let allNotifications = [];

// Initialize Notifications Page
async function initNotifications() {
    await loadNotificationStats();
    await loadNotifications();
    setupEventListeners();
}

// Load Notification Stats
async function loadNotificationStats() {
    try {
        const notifications = await getAllRecords('notifications');

        const totalNotifications = notifications.length;
        const issueNotifications = notifications.filter(n => n.notificationType === 'issue_detected').length;
        const resolutionNotifications = notifications.filter(n => n.notificationType === 'issue_resolved').length;
        
        const today = getTodayDate();
        const todayNotifications = notifications.filter(n => {
            const notifDate = n.sentDate ? n.sentDate.split('T')[0] : '';
            return notifDate === today;
        }).length;

        document.getElementById('totalNotifications').textContent = totalNotifications;
        document.getElementById('issueNotifications').textContent = issueNotifications;
        document.getElementById('resolutionNotifications').textContent = resolutionNotifications;
        document.getElementById('todayNotifications').textContent = todayNotifications;

    } catch (error) {
        console.error('Error loading notification stats:', error);
    }
}

// Load Notifications
async function loadNotifications() {
    try {
        allNotifications = await getAllRecords('notifications');
        
        // Sort by sent date (newest first)
        allNotifications.sort((a, b) => {
            const dateA = new Date(a.sentDate || 0);
            const dateB = new Date(b.sentDate || 0);
            return dateB - dateA;
        });
        
        renderNotificationsTable(allNotifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
        document.getElementById('notificationsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading notifications</td></tr>';
    }
}

// Render Notifications Table
function renderNotificationsTable(notifications) {
    const tbody = document.getElementById('notificationsTableBody');
    
    if (!notifications || notifications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No notifications found</td></tr>';
        return;
    }
    
    tbody.innerHTML = notifications.map(notification => `
        <tr>
            <td>${notification.id ? notification.id.substring(0, 8) : 'N/A'}...</td>
            <td>${formatNotificationType(notification.notificationType)}</td>
            <td>${notification.projectName || 'N/A'}</td>
            <td>${notification.recipient || 'N/A'}<br><small style="color: #64748b;">${notification.recipientEmail || ''}</small></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${notification.subject || 'N/A'}</td>
            <td>${formatDateTime(notification.sentDate)}</td>
            <td><span class="badge ${getStatusBadge(notification.status)}">${notification.status || 'N/A'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewEmail('${notification.id}')" title="View Email">
                        <i class="fas fa-envelope-open"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format Notification Type
function formatNotificationType(type) {
    const types = {
        'issue_detected': '⚠️ Issue Alert',
        'issue_resolved': '✅ Resolution',
        'reminder': '🔔 Reminder'
    };
    return types[type] || type;
}

// View Email
function viewEmail(notificationId) {
    const notification = allNotifications.find(n => n.id === notificationId);
    
    if (!notification) {
        showToast('Notification not found', 'error');
        return;
    }
    
    document.getElementById('emailTo').textContent = `${notification.recipient} <${notification.recipientEmail}>`;
    document.getElementById('emailSubject').textContent = notification.subject;
    document.getElementById('emailSent').textContent = formatDateTime(notification.sentDate);
    document.getElementById('emailBody').innerHTML = notification.body || '<p>No content available</p>';
    
    document.getElementById('emailModal').classList.add('active');
}

// Close Email Modal
function closeEmailModal() {
    document.getElementById('emailModal').classList.remove('active');
}

// Send Test Notification
async function sendTestNotification() {
    try {
        // Get first project to use for test
        const projects = await getAllRecords('projects');
        
        if (projects.length === 0) {
            showToast('No projects available. Please create a project first.', 'warning');
            return;
        }
        
        const testProject = projects[0];
        
        const testNotification = {
            id: generateUUID(),
            notificationType: 'reminder',
            projectId: testProject.id,
            projectCode: testProject.projectCode,
            projectName: testProject.projectName,
            recipient: testProject.projectManager || 'Test User',
            recipientEmail: testProject.pmEmail || 'test@example.com',
            subject: '🔔 Test Notification - FDO Hygiene Monitoring',
            body: generateTestEmailBody(testProject),
            sentDate: new Date().toISOString(),
            status: 'sent',
            issueIds: ''
        };
        
        const result = await apiPost('notifications', testNotification);
        
        if (result) {
            showToast('Test notification sent successfully!', 'success');
            await logAuditEvent('notification_sent', 'notification', testNotification.id, 'Test notification sent');
            await loadNotificationStats();
            await loadNotifications();
        }
        
    } catch (error) {
        console.error('Error sending test notification:', error);
        showToast('Error sending test notification', 'error');
    }
}

// Generate Test Email Body
function generateTestEmailBody(project) {
    return `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>🔔 Test Notification</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${project.projectManager || 'Project Manager'},</p>
            
            <p>This is a test notification from the FDO Hygiene Monitoring System.</p>
            
            <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Test Details</h3>
                <p><strong>Project:</strong> ${project.projectName} (${project.projectCode})</p>
                <p><strong>Sent:</strong> ${formatDateTime(new Date().toISOString())}</p>
                <p><strong>Status:</strong> System is operational ✅</p>
            </div>
            
            <p>The notification system is working correctly. You will receive automated alerts when hygiene issues are detected or resolved.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>FDO Hygiene Monitoring System</p>
        </div>
    </div>
</body>
</html>
    `;
}

// Setup Event Listeners
function setupEventListeners() {
    // Send test notification button
    document.getElementById('sendTestNotificationBtn').addEventListener('click', sendTestNotification);
    
    // Close email modal
    document.getElementById('closeEmailModalBtn').addEventListener('click', closeEmailModal);
    
    // Search and filter
    document.getElementById('searchNotifications').addEventListener('input', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
    
    // Close modal on outside click
    document.getElementById('emailModal').addEventListener('click', (e) => {
        if (e.target.id === 'emailModal') {
            closeEmailModal();
        }
    });
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchNotifications').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    const filteredNotifications = filterTableData(allNotifications, searchTerm, {
        notificationType: typeFilter
    });
    
    renderNotificationsTable(filteredNotifications);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initNotifications);
