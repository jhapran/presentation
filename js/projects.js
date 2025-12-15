// Projects Management Functionality

let allProjects = [];
let editingProjectId = null;

// Initialize Projects Page
async function initProjects() {
    await loadProjectStats();
    await loadProjects();
    setupEventListeners();
}

// Load Project Stats
async function loadProjectStats() {
    try {
        const [projects, issues] = await Promise.all([
            getAllRecords('projects'),
            getAllRecords('hygiene_issues')
        ]);

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.projectStatus === 'active' || p.projectStatus === 'execution').length;
        
        const projectsWithIssues = new Set(
            issues.filter(i => i.status !== 'resolved').map(i => i.projectId)
        ).size;
        
        const healthyProjects = totalProjects - projectsWithIssues;

        document.getElementById('totalProjects').textContent = totalProjects;
        document.getElementById('activeProjects').textContent = activeProjects;
        document.getElementById('projectsWithIssues').textContent = projectsWithIssues;
        document.getElementById('healthyProjects').textContent = healthyProjects;

    } catch (error) {
        console.error('Error loading project stats:', error);
    }
}

// Load Projects
async function loadProjects() {
    try {
        allProjects = await getAllRecords('projects');
        
        // Calculate health status for each project
        const issues = await getAllRecords('hygiene_issues');
        allProjects = allProjects.map(project => {
            const projectIssues = issues.filter(i => 
                i.projectId === project.id && i.status !== 'resolved'
            );
            
            let healthStatus = 'healthy';
            if (projectIssues.length > 0) {
                const hasCritical = projectIssues.some(i => i.severity === 'critical');
                const hasHigh = projectIssues.some(i => i.severity === 'high');
                
                if (hasCritical) {
                    healthStatus = 'critical';
                } else if (hasHigh || projectIssues.length >= 3) {
                    healthStatus = 'warning';
                }
            }
            
            return { ...project, healthStatus };
        });
        
        renderProjectsTable(allProjects);
    } catch (error) {
        console.error('Error loading projects:', error);
        document.getElementById('projectsTableBody').innerHTML = 
            '<tr><td colspan="8" class="text-center">Error loading projects</td></tr>';
    }
}

// Render Projects Table
function renderProjectsTable(projects) {
    const tbody = document.getElementById('projectsTableBody');
    
    if (!projects || projects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No projects found</td></tr>';
        return;
    }
    
    tbody.innerHTML = projects.map(project => `
        <tr>
            <td>${project.projectCode || 'N/A'}</td>
            <td>${project.projectName || 'N/A'}</td>
            <td><span class="badge ${getStatusBadge(project.projectStatus)}">${project.projectStatus || 'N/A'}</span></td>
            <td>${project.projectStage || 'N/A'}</td>
            <td>${project.projectManager || 'N/A'}</td>
            <td>${formatDate(project.startDate)}</td>
            <td><span class="badge ${getStatusBadge(project.healthStatus)}">${project.healthStatus || 'N/A'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editProject('${project.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Show Project Modal
function showProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('projectForm');
    
    form.reset();
    editingProjectId = projectId;
    
    if (projectId) {
        // Edit mode
        modalTitle.textContent = 'Edit Project';
        const project = allProjects.find(p => p.id === projectId);
        
        if (project) {
            document.getElementById('projectId').value = project.id;
            document.getElementById('projectCode').value = project.projectCode || '';
            document.getElementById('projectName').value = project.projectName || '';
            document.getElementById('projectStatus').value = project.projectStatus || '';
            document.getElementById('projectStage').value = project.projectStage || '';
            document.getElementById('projectManager').value = project.projectManager || '';
            document.getElementById('pmEmail').value = project.pmEmail || '';
            document.getElementById('startDate').value = project.startDate || '';
            document.getElementById('endDate').value = project.endDate || '';
            document.getElementById('description').value = project.description || '';
            document.getElementById('nominations').value = project.nominations || '';
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Project';
        document.getElementById('projectId').value = '';
    }
    
    modal.classList.add('active');
}

// Hide Project Modal
function hideProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.classList.remove('active');
    editingProjectId = null;
}

// Save Project
async function saveProject(event) {
    event.preventDefault();
    
    const projectData = {
        projectCode: document.getElementById('projectCode').value.trim(),
        projectName: document.getElementById('projectName').value.trim(),
        projectStatus: document.getElementById('projectStatus').value,
        projectStage: document.getElementById('projectStage').value,
        projectManager: document.getElementById('projectManager').value.trim(),
        pmEmail: document.getElementById('pmEmail').value.trim(),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        description: document.getElementById('description').value.trim(),
        nominations: document.getElementById('nominations').value.trim(),
        healthStatus: 'healthy'
    };
    
    try {
        if (editingProjectId) {
            // Update existing project
            const result = await apiPut('projects', editingProjectId, {
                id: editingProjectId,
                ...projectData
            });
            
            if (result) {
                showToast('Project updated successfully', 'success');
                await logAuditEvent('project_updated', 'project', editingProjectId, 
                    `Project updated: ${projectData.projectName}`);
            }
        } else {
            // Create new project
            const newProject = {
                id: generateUUID(),
                ...projectData
            };
            
            const result = await apiPost('projects', newProject);
            
            if (result) {
                showToast('Project created successfully', 'success');
                await logAuditEvent('project_created', 'project', newProject.id, 
                    `Project created: ${projectData.projectName}`);
            }
        }
        
        hideProjectModal();
        await loadProjectStats();
        await loadProjects();
        
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Error saving project', 'error');
    }
}

// Edit Project
function editProject(projectId) {
    showProjectModal(projectId);
}

// Delete Project
async function deleteProject(projectId) {
    const project = allProjects.find(p => p.id === projectId);
    
    if (!confirmDialog(`Are you sure you want to delete project "${project.projectName}"?`)) {
        return;
    }
    
    const result = await apiDelete('projects', projectId);
    
    if (result) {
        showToast('Project deleted successfully', 'success');
        await logAuditEvent('project_deleted', 'project', projectId, 
            `Project deleted: ${project.projectName}`);
        await loadProjectStats();
        await loadProjects();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Add project button
    document.getElementById('addProjectBtn').addEventListener('click', () => showProjectModal());
    
    // Close modal button
    document.getElementById('closeModalBtn').addEventListener('click', hideProjectModal);
    document.getElementById('cancelBtn').addEventListener('click', hideProjectModal);
    
    // Project form submit
    document.getElementById('projectForm').addEventListener('submit', saveProject);
    
    // Search and filter
    document.getElementById('searchProjects').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // Close modal on outside click
    document.getElementById('projectModal').addEventListener('click', (e) => {
        if (e.target.id === 'projectModal') {
            hideProjectModal();
        }
    });
}

// Apply Filters
function applyFilters() {
    const searchTerm = document.getElementById('searchProjects').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredProjects = filterTableData(allProjects, searchTerm, {
        projectStatus: statusFilter
    });
    
    renderProjectsTable(filteredProjects);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initProjects);
