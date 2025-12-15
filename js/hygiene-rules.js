// Hygiene Rules Management Functionality

let allRules = [];
let editingRuleId = null;

// Initialize Hygiene Rules Page
async function initHygieneRules() {
    await loadRuleStats();
    await loadRules();
    setupEventListeners();
}

// Load Rule Stats
async function loadRuleStats() {
    try {
        const [rules, issues] = await Promise.all([
            getAllRecords('hygiene_rules'),
            getAllRecords('hygiene_issues')
        ]);

        const totalRules = rules.length;
        const activeRules = rules.filter(r => r.enabled).length;
        const criticalRules = rules.filter(r => r.ruleSeverity === 'critical').length;
        
        // Get rules triggered today
        const today = getTodayDate();
        const todayIssues = issues.filter(i => i.detectedDate === today);
        const triggeredRules = new Set(todayIssues.map(i => i.ruleId)).size;

        document.getElementById('totalRules').textContent = totalRules;
        document.getElementById('activeRules').textContent = activeRules;
        document.getElementById('criticalRules').textContent = criticalRules;
        document.getElementById('triggeredRules').textContent = triggeredRules;

    } catch (error) {
        console.error('Error loading rule stats:', error);
    }
}

// Load Rules
async function loadRules() {
    try {
        allRules = await getAllRecords('hygiene_rules');
        renderRulesTable(allRules);
    } catch (error) {
        console.error('Error loading rules:', error);
        document.getElementById('rulesTableBody').innerHTML = 
            '<tr><td colspan="7" class="text-center">Error loading rules</td></tr>';
    }
}

// Render Rules Table
function renderRulesTable(rules) {
    const tbody = document.getElementById('rulesTableBody');
    
    if (!rules || rules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No rules found</td></tr>';
        return;
    }
    
    tbody.innerHTML = rules.map(rule => `
        <tr>
            <td>${rule.id ? rule.id.substring(0, 8) : 'N/A'}...</td>
            <td>${rule.ruleName || 'N/A'}</td>
            <td>${formatCategory(rule.ruleCategory)}</td>
            <td><span class="badge ${getSeverityBadge(rule.ruleSeverity)}">${rule.ruleSeverity || 'N/A'}</span></td>
            <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${rule.ruleDescription || 'N/A'}</td>
            <td><span class="badge ${rule.enabled ? 'badge-success' : 'badge-danger'}">${rule.enabled ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editRule('${rule.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm ${rule.enabled ? 'btn-warning' : 'btn-success'}" 
                            onclick="toggleRuleStatus('${rule.id}')" 
                            title="${rule.enabled ? 'Disable' : 'Enable'}">
                        <i class="fas fa-${rule.enabled ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRule('${rule.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Format Category
function formatCategory(category) {
    if (!category) return 'N/A';
    return category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Show Rule Modal
function showRuleModal(ruleId = null) {
    const modal = document.getElementById('ruleModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('ruleForm');
    
    form.reset();
    editingRuleId = ruleId;
    
    if (ruleId) {
        // Edit mode
        modalTitle.textContent = 'Edit Hygiene Rule';
        const rule = allRules.find(r => r.id === ruleId);
        
        if (rule) {
            document.getElementById('ruleId').value = rule.id;
            document.getElementById('ruleName').value = rule.ruleName || '';
            document.getElementById('ruleCategory').value = rule.ruleCategory || '';
            document.getElementById('ruleSeverity').value = rule.ruleSeverity || '';
            document.getElementById('ruleDescription').value = rule.ruleDescription || '';
            document.getElementById('ruleCondition').value = rule.ruleCondition || '';
            document.getElementById('targetField').value = rule.targetField || '';
            document.getElementById('expectedValue').value = rule.expectedValue || '';
            document.getElementById('correctionAction').value = rule.correctionAction || '';
            document.getElementById('ruleEnabled').checked = rule.enabled !== false;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Hygiene Rule';
        document.getElementById('ruleId').value = '';
        document.getElementById('ruleEnabled').checked = true;
    }
    
    modal.classList.add('active');
}

// Hide Rule Modal
function hideRuleModal() {
    const modal = document.getElementById('ruleModal');
    modal.classList.remove('active');
    editingRuleId = null;
}

// Save Rule
async function saveRule(event) {
    event.preventDefault();
    
    const ruleData = {
        ruleName: document.getElementById('ruleName').value.trim(),
        ruleCategory: document.getElementById('ruleCategory').value,
        ruleSeverity: document.getElementById('ruleSeverity').value,
        ruleDescription: document.getElementById('ruleDescription').value.trim(),
        ruleCondition: document.getElementById('ruleCondition').value,
        targetField: document.getElementById('targetField').value.trim(),
        expectedValue: document.getElementById('expectedValue').value.trim(),
        correctionAction: document.getElementById('correctionAction').value.trim(),
        enabled: document.getElementById('ruleEnabled').checked
    };
    
    try {
        if (editingRuleId) {
            // Update existing rule
            const result = await apiPut('hygiene_rules', editingRuleId, {
                id: editingRuleId,
                ...ruleData
            });
            
            if (result) {
                showToast('Rule updated successfully', 'success');
                await logAuditEvent('rule_updated', 'rule', editingRuleId, 
                    `Rule updated: ${ruleData.ruleName}`);
            }
        } else {
            // Create new rule
            const newRule = {
                id: generateUUID(),
                ...ruleData
            };
            
            const result = await apiPost('hygiene_rules', newRule);
            
            if (result) {
                showToast('Rule created successfully', 'success');
                await logAuditEvent('rule_created', 'rule', newRule.id, 
                    `Rule created: ${ruleData.ruleName}`);
            }
        }
        
        hideRuleModal();
        await loadRuleStats();
        await loadRules();
        
    } catch (error) {
        console.error('Error saving rule:', error);
        showToast('Error saving rule', 'error');
    }
}

// Edit Rule
function editRule(ruleId) {
    showRuleModal(ruleId);
}

// Toggle Rule Status
async function toggleRuleStatus(ruleId) {
    const rule = allRules.find(r => r.id === ruleId);
    
    if (!rule) return;
    
    const newStatus = !rule.enabled;
    const result = await apiPatch('hygiene_rules', ruleId, {
        enabled: newStatus
    });
    
    if (result) {
        showToast(`Rule ${newStatus ? 'enabled' : 'disabled'} successfully`, 'success');
        await logAuditEvent('rule_updated', 'rule', ruleId, 
            `Rule ${newStatus ? 'enabled' : 'disabled'}: ${rule.ruleName}`);
        await loadRuleStats();
        await loadRules();
    }
}

// Delete Rule
async function deleteRule(ruleId) {
    const rule = allRules.find(r => r.id === ruleId);
    
    if (!confirmDialog(`Are you sure you want to delete rule "${rule.ruleName}"?`)) {
        return;
    }
    
    const result = await apiDelete('hygiene_rules', ruleId);
    
    if (result) {
        showToast('Rule deleted successfully', 'success');
        await logAuditEvent('rule_deleted', 'rule', ruleId, 
            `Rule deleted: ${rule.ruleName}`);
        await loadRuleStats();
        await loadRules();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Add rule button
    document.getElementById('addRuleBtn').addEventListener('click', () => showRuleModal());
    
    // Close modal button
    document.getElementById('closeModalBtn').addEventListener('click', hideRuleModal);
    document.getElementById('cancelBtn').addEventListener('click', hideRuleModal);
    
    // Rule form submit
    document.getElementById('ruleForm').addEventListener('submit', saveRule);
    
    // Search and filter
    document.getElementById('searchRules').addEventListener('input', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    
    // Close modal on outside click
    document.getElementById('ruleModal').addEventListener('click', (e) => {
        if (e.target.id === 'ruleModal') {
            hideRuleModal();
        }
    });
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchRules').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    const filteredRules = filterTableData(allRules, searchTerm, {
        ruleCategory: categoryFilter
    });
    
    renderRulesTable(filteredRules);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initHygieneRules);
