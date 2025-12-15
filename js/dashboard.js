// Dashboard Functionality

let trendChart = null;
let categoryChart = null;
let allIssues = [];

// Initialize Dashboard
async function initDashboard() {
    await loadKPIs();
    await loadCharts();
    await loadActiveIssues();
    setupEventListeners();
    loadLastCheckTime();
}

// Load KPI Data
async function loadKPIs() {
    try {
        const [issuesData, projectsData] = await Promise.all([
            getAllRecords('hygiene_issues'),
            getAllRecords('projects')
        ]);

        const totalIssues = issuesData.length;
        const pendingIssues = issuesData.filter(i => i.status !== 'resolved').length;
        
        // Get issues resolved today
        const today = getTodayDate();
        const resolvedToday = issuesData.filter(i => 
            i.status === 'resolved' && i.resolvedDate === today
        ).length;

        // Calculate compliance rate
        const projectsWithIssues = new Set(issuesData.filter(i => i.status !== 'resolved').map(i => i.projectId)).size;
        const complianceRate = calculateComplianceRate(projectsData.length, projectsWithIssues);

        // Update KPI cards
        document.getElementById('totalIssues').textContent = totalIssues;
        document.getElementById('pendingIssues').textContent = pendingIssues;
        document.getElementById('resolvedToday').textContent = resolvedToday;
        document.getElementById('complianceRate').textContent = `${complianceRate}%`;

        // Update change indicators
        document.getElementById('issuesChange').textContent = `${pendingIssues} pending`;
        document.getElementById('resolvedChange').textContent = `${resolvedToday} today`;

    } catch (error) {
        console.error('Error loading KPIs:', error);
    }
}

// Load Charts
async function loadCharts() {
    try {
        const issuesData = await getAllRecords('hygiene_issues');
        
        // Load Trend Chart
        loadTrendChart(issuesData);
        
        // Load Category Chart
        loadCategoryChart(issuesData);
        
    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

// Load Trend Chart
function loadTrendChart(issuesData) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Get last 7 days
    const days = 7;
    const labels = [];
    const detectedData = [];
    const resolvedData = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        labels.push(label);
        
        const detected = issuesData.filter(issue => issue.detectedDate === dateStr).length;
        const resolved = issuesData.filter(issue => issue.resolvedDate === dateStr).length;
        
        detectedData.push(detected);
        resolvedData.push(resolved);
    }
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Issues Detected',
                    data: detectedData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Issues Resolved',
                    data: resolvedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load Category Chart
function loadCategoryChart(issuesData) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Count issues by category
    const categoryCounts = {};
    issuesData.forEach(issue => {
        const category = issue.issueType || 'Unknown';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    
    const colors = [
        '#3b82f6',
        '#ef4444',
        '#f59e0b',
        '#10b981',
        '#8b5cf6',
        '#ec4899'
    ];
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// Load Active Issues Table
async function loadActiveIssues() {
    try {
        allIssues = await getAllRecords('hygiene_issues');
        renderIssuesTable(allIssues);
    } catch (error) {
        console.error('Error loading issues:', error);
        document.getElementById('issuesTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Error loading issues</td></tr>';
    }
}

// Render Issues Table
function renderIssuesTable(issues) {
    const tbody = document.getElementById('issuesTableBody');
    
    if (!issues || issues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No issues found</td></tr>';
        return;
    }
    
    // Filter out resolved issues for the active issues table
    const activeIssues = issues.filter(issue => issue.status !== 'resolved');
    
    if (activeIssues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No active issues</td></tr>';
        return;
    }
    
    tbody.innerHTML = activeIssues.map(issue => `
        <tr>
            <td>${issue.projectCode || 'N/A'}</td>
            <td>${issue.projectName || 'N/A'}</td>
            <td>${issue.issueType || 'N/A'}</td>
            <td><span class="badge ${getSeverityBadge(issue.severity)}">${issue.severity || 'N/A'}</span></td>
            <td>${formatDate(issue.detectedDate)}</td>
            <td>${issue.projectManager || 'N/A'}</td>
            <td><span class="badge ${getStatusBadge(issue.status)}">${issue.status || 'N/A'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewIssueDetails('${issue.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${issue.status !== 'resolved' ? `
                    <button class="btn btn-sm btn-success" onclick="resolveIssue('${issue.id}')">
                        <i class="fas fa-check"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// View Issue Details
async function viewIssueDetails(issueId) {
    const issue = allIssues.find(i => i.id === issueId);
    if (!issue) {
        showToast('Issue not found', 'error');
        return;
    }
    
    const message = `
Issue Details:
--------------
Project: ${issue.projectName} (${issue.projectCode})
Type: ${issue.issueType}
Severity: ${issue.severity}
Description: ${issue.description}
Detected: ${formatDate(issue.detectedDate)}
Project Manager: ${issue.projectManager}
Status: ${issue.status}

Corrective Action:
${issue.correctionAction}
    `;
    
    alert(message);
}

// Resolve Issue
async function resolveIssue(issueId) {
    if (!confirmDialog('Are you sure you want to mark this issue as resolved?')) {
        return;
    }
    
    const resolvedDate = getTodayDate();
    const result = await apiPatch('hygiene_issues', issueId, {
        status: 'resolved',
        resolvedDate: resolvedDate
    });
    
    if (result) {
        showToast('Issue marked as resolved', 'success');
        
        // Send resolution confirmation notification
        const issue = allIssues.find(i => i.id === issueId);
        if (issue) {
            await sendResolutionNotification(issue);
        }
        
        // Log audit event
        await logAuditEvent('issue_resolved', 'issue', issueId, `Issue resolved: ${issue.ruleName}`);
        
        // Reload data
        await loadKPIs();
        await loadActiveIssues();
        await loadCharts();
    }
}

// Send Resolution Notification
async function sendResolutionNotification(issue) {
    const notification = {
        id: generateUUID(),
        notificationType: 'issue_resolved',
        projectId: issue.projectId,
        projectCode: issue.projectCode,
        projectName: issue.projectName,
        recipient: issue.projectManager,
        recipientEmail: issue.pmEmail,
        subject: `✅ Hygiene Issue Resolved - ${issue.projectName}`,
        body: generateResolutionEmail(issue),
        sentDate: new Date().toISOString(),
        status: 'sent',
        issueIds: issue.id
    };
    
    await apiPost('notifications', notification);
    await logAuditEvent('notification_sent', 'notification', notification.id, 'Resolution confirmation sent');
}

// Generate Resolution Email
function generateResolutionEmail(issue) {
    return `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>✅ Hygiene Issue Resolved</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${issue.projectManager},</p>
            
            <p>Great news! The hygiene issue for your project has been successfully resolved.</p>
            
            <div style="background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #065f46;">Resolved Issue Details</h3>
                <p><strong>Project:</strong> ${issue.projectName} (${issue.projectCode})</p>
                <p><strong>Issue Type:</strong> ${issue.issueType}</p>
                <p><strong>Severity:</strong> ${issue.severity}</p>
                <p><strong>Detected:</strong> ${formatDate(issue.detectedDate)}</p>
                <p><strong>Resolved:</strong> ${formatDate(issue.resolvedDate)}</p>
            </div>
            
            <p>Thank you for your prompt action in addressing this hygiene issue. Your project is now compliant with FDO governance standards.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>FDO Hygiene Monitoring System</p>
        </div>
    </div>
</body>
</html>
    `;
}

// Run Hygiene Check
async function runHygieneCheck() {
    showToast('Running hygiene check...', 'info');
    
    try {
        const [projects, rules] = await Promise.all([
            getAllRecords('projects'),
            getAllRecords('hygiene_rules')
        ]);
        
        const activeRules = rules.filter(rule => rule.enabled);
        let issuesDetected = 0;
        
        for (const project of projects) {
            for (const rule of activeRules) {
                const issue = await evaluateRule(project, rule);
                if (issue) {
                    await apiPost('hygiene_issues', issue);
                    await sendIssueNotification(issue);
                    issuesDetected++;
                    
                    await logAuditEvent('issue_detected', 'issue', issue.id, 
                        `Issue detected: ${rule.ruleName} for ${project.projectName}`);
                }
            }
        }
        
        // Update last check time
        localStorage.setItem('lastHygieneCheck', new Date().toISOString());
        loadLastCheckTime();
        
        // Log hygiene check event
        await logAuditEvent('hygiene_check', 'system', 'hygiene_check', 
            `Hygiene check completed. ${issuesDetected} issues detected.`);
        
        showToast(`Hygiene check completed. ${issuesDetected} new issues detected.`, 'success');
        
        // Reload data
        await loadKPIs();
        await loadActiveIssues();
        await loadCharts();
        
    } catch (error) {
        console.error('Error running hygiene check:', error);
        showToast('Error running hygiene check', 'error');
    }
}

// Evaluate Rule against Project
async function evaluateRule(project, rule) {
    const fieldValue = project[rule.targetField];
    let isViolation = false;
    
    switch (rule.ruleCondition) {
        case 'field_empty':
            isViolation = isFieldEmpty(fieldValue);
            break;
        case 'field_outdated':
            isViolation = isDateOutdated(fieldValue);
            break;
        case 'field_invalid':
            if (rule.expectedValue) {
                isViolation = fieldValue !== rule.expectedValue;
            }
            break;
        case 'missing_required':
            isViolation = isFieldEmpty(fieldValue);
            break;
    }
    
    if (isViolation) {
        // Check if issue already exists for this project and rule
        const existingIssues = await getAllRecords('hygiene_issues');
        const alreadyExists = existingIssues.some(issue => 
            issue.projectId === project.id && 
            issue.ruleId === rule.id && 
            issue.status !== 'resolved'
        );
        
        if (!alreadyExists) {
            return {
                id: generateUUID(),
                projectId: project.id,
                projectCode: project.projectCode,
                projectName: project.projectName,
                ruleId: rule.id,
                ruleName: rule.ruleName,
                issueType: rule.ruleCategory,
                severity: rule.ruleSeverity,
                description: rule.ruleDescription,
                detectedDate: getTodayDate(),
                projectManager: project.projectManager,
                pmEmail: project.pmEmail,
                status: 'open',
                correctionAction: rule.correctionAction
            };
        }
    }
    
    return null;
}

// Send Issue Notification
async function sendIssueNotification(issue) {
    const notification = {
        id: generateUUID(),
        notificationType: 'issue_detected',
        projectId: issue.projectId,
        projectCode: issue.projectCode,
        projectName: issue.projectName,
        recipient: issue.projectManager,
        recipientEmail: issue.pmEmail,
        subject: `⚠️ Hygiene Issue Detected - ${issue.projectName}`,
        body: generateIssueEmail(issue),
        sentDate: new Date().toISOString(),
        status: 'sent',
        issueIds: issue.id
    };
    
    await apiPost('notifications', notification);
    await logAuditEvent('notification_sent', 'notification', notification.id, 'Issue notification sent');
}

// Generate Issue Email
function generateIssueEmail(issue) {
    return `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2>⚠️ Hygiene Issue Detected</h2>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${issue.projectManager},</p>
            
            <p>A hygiene issue has been detected for your project during the daily FDO health check.</p>
            
            <div style="background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #991b1b;">Issue Details</h3>
                <p><strong>Project:</strong> ${issue.projectName} (${issue.projectCode})</p>
                <p><strong>Issue Type:</strong> ${issue.issueType}</p>
                <p><strong>Severity:</strong> <span style="text-transform: uppercase; color: #ef4444;">${issue.severity}</span></p>
                <p><strong>Description:</strong> ${issue.description}</p>
                <p><strong>Detected:</strong> ${formatDate(issue.detectedDate)}</p>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Required Action</h3>
                <p>${issue.correctionAction}</p>
            </div>
            
            <p><strong>Impact:</strong> This issue affects your project's compliance with FDO governance standards and may impact reporting accuracy.</p>
            
            <p>Please address this issue at your earliest convenience. Once resolved, the system will automatically detect the correction and send you a confirmation.</p>
            
            <p style="margin-top: 30px;">Best regards,<br>FDO Hygiene Monitoring System</p>
        </div>
    </div>
</body>
</html>
    `;
}

// Load Last Check Time
function loadLastCheckTime() {
    const lastCheck = localStorage.getItem('lastHygieneCheck');
    if (lastCheck) {
        document.getElementById('lastCheckTime').textContent = getTimeAgo(lastCheck);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Run hygiene check button
    document.getElementById('runHygieneCheckBtn').addEventListener('click', runHygieneCheck);
    
    // Search and filter
    document.getElementById('searchIssues').addEventListener('input', applyFilters);
    document.getElementById('severityFilter').addEventListener('change', applyFilters);
    
    // Trend period filter
    document.getElementById('trendPeriod').addEventListener('change', async () => {
        const issuesData = await getAllRecords('hygiene_issues');
        loadTrendChart(issuesData);
    });
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchIssues').value;
    const severityFilter = document.getElementById('severityFilter').value;
    
    const filteredIssues = filterTableData(allIssues, searchTerm, {
        severity: severityFilter
    });
    
    renderIssuesTable(filteredIssues);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);
