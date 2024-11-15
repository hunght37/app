// Task templates
const taskTemplates = [
    {
        title: "Daily Stand-up Meeting",
        priority: "medium",
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
        title: "Weekly Report",
        priority: "high",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    {
        title: "Read Documentation",
        priority: "low",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
];

// State management
let tasks = [];
let currentTheme = 'light';
let editingTaskId = null;

try {
    // Load tasks from localStorage with error handling
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        // Validate loaded tasks
        tasks = tasks.filter(task => {
            return task && 
                   typeof task.id === 'string' &&
                   typeof task.title === 'string' &&
                   typeof task.priority === 'string' &&
                   typeof task.deadline === 'string' &&
                   typeof task.completed === 'boolean';
        });
    }

    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        currentTheme = savedTheme;
    }
} catch (error) {
    console.error('Error loading saved data:', error);
    // Reset to defaults if there's an error
    tasks = [];
    currentTheme = 'light';
}

// Form validation messages
const errorMessages = {
    title: {
        required: 'Task title is required',
        maxLength: 'Title must be less than 100 characters',
        invalid: 'Title contains invalid characters'
    },
    deadline: {
        required: 'Deadline is required',
        future: 'Deadline must be in the future',
        invalid: 'Invalid date format'
    }
};

// Initialize DOM Elements with error handling
function initializeDOMElements() {
    const elements = {
        taskList: document.getElementById('taskList'),
        taskModal: document.getElementById('taskModal'),
        taskForm: document.getElementById('taskForm'),
        templatesModal: document.getElementById('templatesModal'),
        templateList: document.getElementById('templateList'),
        statusFilter: document.getElementById('statusFilter'),
        themeToggle: document.getElementById('themeToggle'),
        modalTitle: document.getElementById('modalTitle'),
        taskTitle: document.getElementById('taskTitle'),
        taskPriority: document.getElementById('taskPriority'),
        taskDeadline: document.getElementById('taskDeadline'),
        moonIcon: document.getElementById('moonIcon'),
        sunIcon: document.getElementById('sunIcon')
    };

    // Verify all required elements exist
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

    if (missingElements.length > 0) {
        throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
    }

    return elements;
}

// Global DOM elements
let domElements;

try {
    domElements = initializeDOMElements();
} catch (error) {
    console.error('Failed to initialize application:', error);
    // Show user-friendly error message
    document.body.innerHTML = `
        <div class="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h1 class="text-red-600 dark:text-red-400 text-xl font-bold mb-4">Application Error</h1>
                <p class="text-gray-700 dark:text-gray-300">Sorry, there was a problem loading the application. Please refresh the page or contact support if the problem persists.</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Refresh Page
                </button>
            </div>
        </div>
    `;
    // Stop execution
    throw error;
}

// Create error message element
const errorContainer = document.createElement('div');
errorContainer.className = 'text-red-500 text-sm mt-1 hidden';
domElements.taskTitle.parentNode.appendChild(errorContainer.cloneNode(true));
domElements.taskDeadline.parentNode.appendChild(errorContainer.cloneNode(true));

// Validation functions
function validateTaskForm(formData) {
    const errors = [];
    
    // Validate title
    if (!formData.title) {
        errors.push({ field: 'title', message: errorMessages.title.required });
    } else {
        const title = formData.title.trim();
        if (title.length === 0) {
            errors.push({ field: 'title', message: errorMessages.title.required });
        } else if (title.length > 100) {
            errors.push({ field: 'title', message: errorMessages.title.maxLength });
        } else if (!/^[\w\s\-,.!?'"()]+$/.test(title)) {
            errors.push({ field: 'title', message: errorMessages.title.invalid });
        }
    }
    
    // Validate deadline
    if (!formData.deadline) {
        errors.push({ field: 'deadline', message: errorMessages.deadline.required });
    } else {
        try {
            const deadlineDate = new Date(formData.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (isNaN(deadlineDate.getTime())) {
                errors.push({ field: 'deadline', message: errorMessages.deadline.invalid });
            } else if (deadlineDate < today) {
                errors.push({ field: 'deadline', message: errorMessages.deadline.future });
            }
        } catch (error) {
            errors.push({ field: 'deadline', message: errorMessages.deadline.invalid });
        }
    }
    
    // Validate priority
    if (!['high', 'medium', 'low'].includes(formData.priority)) {
        errors.push({ field: 'priority', message: 'Invalid priority level' });
    }
    
    return errors;
}

function showFieldError(fieldName, message) {
    const container = domElements[`task${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`]
        .parentNode.querySelector('.text-red-500');
    container.textContent = message;
    container.classList.remove('hidden');
}

function clearFieldErrors() {
    document.querySelectorAll('.text-red-500').forEach(el => {
        el.textContent = '';
        el.classList.add('hidden');
    });
}

// Enhanced task creation/editing
function createOrUpdateTask(formData) {
    const errors = validateTaskForm(formData);
    
    if (errors.length > 0) {
        errors.forEach(error => showFieldError(error.field, error.message));
        return false;
    }
    
    clearFieldErrors();
    
    const taskData = {
        id: formData.id || Date.now().toString(),
        title: formData.title.trim(),
        priority: formData.priority,
        deadline: formData.deadline,
        completed: formData.completed || false,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (formData.id) {
        const index = tasks.findIndex(t => t.id === formData.id);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...taskData };
            showToast('Task updated successfully');
        }
    } else {
        tasks.push(taskData);
        showToast('Task created successfully');
    }

    saveTasks();
    renderTasks();
    hideTaskModal();
    return true;
}

// Create confirmation modal HTML
const confirmationModal = document.createElement('div');
confirmationModal.innerHTML = `
    <div id="confirmationModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Confirm Deletion</h2>
            <p class="text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div class="flex justify-end space-x-4">
                <button id="cancelDelete" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
                <button id="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
        </div>
    </div>
`;
document.body.appendChild(confirmationModal);

// Additional DOM Elements for confirmation modal
const confirmationModalEl = document.getElementById('confirmationModal');
const cancelDeleteBtn = document.getElementById('cancelDelete');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Theme management
function initializeTheme() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcons(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcons(false);
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    if (isDark) {
        domElements.moonIcon.classList.add('hidden');
        domElements.sunIcon.classList.remove('hidden');
    } else {
        domElements.moonIcon.classList.remove('hidden');
        domElements.sunIcon.classList.add('hidden');
    }
}

// Task management
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card priority-${task.priority} ${task.completed ? 'task-completed' : ''}`;
    
    const daysUntilDeadline = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const deadlineClass = daysUntilDeadline <= 1 ? 'text-red-500' : daysUntilDeadline <= 3 ? 'text-yellow-500' : 'text-green-500';
    const deadlineText = daysUntilDeadline < 0 ? 'Overdue' : 
                        daysUntilDeadline === 0 ? 'Due today' :
                        daysUntilDeadline === 1 ? 'Due tomorrow' :
                        `Due in ${daysUntilDeadline} days`;

    const priorityColors = {
        high: 'text-red-500',
        medium: 'text-yellow-500',
        low: 'text-green-500'
    };

    taskElement.innerHTML = `
        <div class="flex items-center justify-between p-4">
            <div class="flex items-start space-x-4 flex-1">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    class="w-5 h-5 mt-1 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    onchange="toggleTaskStatus('${task.id}')">
                <div class="flex-1">
                    <div class="flex items-center justify-between">
                        <h3 class="task-title text-lg font-semibold text-gray-900 dark:text-white">${task.title}</h3>
                        <span class="text-sm ${priorityColors[task.priority]} font-medium">
                            ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </span>
                    </div>
                    <div class="mt-2 flex items-center space-x-4">
                        <p class="text-sm ${deadlineClass} font-medium">
                            <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            ${deadlineText}
                        </p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Created: ${new Date(task.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
            <div class="flex space-x-2 ml-4">
                <button onclick="editTask('${task.id}')" 
                    class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    title="Edit task">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="deleteTask('${task.id}')"
                    class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="Delete task">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    return taskElement;
}

function renderTasks() {
    const filteredTasks = filterTasks();
    domElements.taskList.innerHTML = '';
    filteredTasks.forEach(task => {
        domElements.taskList.appendChild(createTaskElement(task));
    });
    updateStatistics();
}

function filterTasks() {
    const filter = domElements.statusFilter.value;
    return tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });
}

function updateStatistics() {
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('activeTasks').textContent = tasks.filter(task => !task.completed).length;
    document.getElementById('completedTasks').textContent = tasks.filter(task => task.completed).length;
}

function toggleTaskStatus(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        
        if (saveTasks()) {
            renderTasks();
            showToast(`Task marked as ${task.completed ? 'completed' : 'active'}`);
        }
    } catch (error) {
        console.error('Error toggling task status:', error);
        showToast('Failed to update task status', 'error');
    }
}

function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error('Error saving tasks:', error);
        showToast('Failed to save tasks. Please try again.', 'error');
        return false;
    }
}

function showTaskModal(template = null) {
    domElements.modalTitle.textContent = editingTaskId ? 'Edit Task' : 'New Task';
    if (template) {
        domElements.taskTitle.value = template.title;
        domElements.taskPriority.value = template.priority;
        domElements.taskDeadline.value = template.deadline;
    } else if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        domElements.taskTitle.value = task.title;
        domElements.taskPriority.value = task.priority;
        domElements.taskDeadline.value = task.deadline;
    } else {
        domElements.taskForm.reset();
    }
    domElements.taskModal.classList.add('modal-open');
}

function hideTaskModal() {
    domElements.taskModal.classList.remove('modal-open');
    editingTaskId = null;
    domElements.taskForm.reset();
}

function showTemplatesModal() {
    domElements.templateList.innerHTML = '';
    taskTemplates.forEach(template => {
        const templateElement = document.createElement('div');
        templateElement.className = 'task-card priority-' + template.priority;
        templateElement.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${template.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Priority: ${template.priority}</p>
                </div>
                <button onclick='useTemplate(${JSON.stringify(template)})' 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Use Template
                </button>
            </div>
        `;
        domElements.templateList.appendChild(templateElement);
    });
    domElements.templatesModal.classList.add('modal-open');
}

function hideTemplatesModal() {
    domElements.templatesModal.classList.remove('modal-open');
}

function useTemplate(template) {
    hideTemplatesModal();
    showTaskModal(template);
}

function editTask(taskId) {
    editingTaskId = taskId;
    showTaskModal();
}

function deleteTask(taskId) {
    try {
        const task = tasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        // Show confirmation modal
        confirmationModalEl.classList.add('modal-open');
        
        // Setup event listeners for confirmation
        const handleConfirm = () => {
            try {
                tasks = tasks.filter(t => t.id !== taskId);
                if (saveTasks()) {
                    renderTasks();
                    hideConfirmationModal();
                    showToast(`Task "${task.title}" has been deleted`);
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                showToast('Failed to delete task', 'error');
            }
        };
        
        const handleCancel = () => {
            hideConfirmationModal();
        };
        
        // Add one-time event listeners
        confirmDeleteBtn.addEventListener('click', handleConfirm, { once: true });
        cancelDeleteBtn.addEventListener('click', handleCancel, { once: true });
    } catch (error) {
        console.error('Error in delete task operation:', error);
        showToast('Failed to process delete operation', 'error');
    }
}

function hideConfirmationModal() {
    confirmationModalEl.classList.remove('modal-open');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-600' : 'bg-gray-800';
    toast.className = `fixed bottom-4 right-4 ${bgColor} dark:bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-0 opacity-100 transition-all duration-300 z-50`;
    
    // Add icon based on type
    const icon = type === 'error' ? 
        '<svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' :
        '<svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    
    toast.innerHTML = `
        <div class="flex items-center">
            ${icon}
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Fade out and remove
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Event Listeners
function setupEventListeners() {
    try {
        // Task management buttons
        document.getElementById('newTaskBtn').addEventListener('click', () => showTaskModal());
        document.getElementById('templateBtn').addEventListener('click', showTemplatesModal);
        document.getElementById('closeTemplates').addEventListener('click', hideTemplatesModal);
        document.getElementById('cancelTask').addEventListener('click', hideTaskModal);

        // Theme toggle
        domElements.themeToggle.addEventListener('click', toggleTheme);
        domElements.statusFilter.addEventListener('change', renderTasks);

        // Form submission
        domElements.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = {
                id: editingTaskId,
                title: domElements.taskTitle.value,
                priority: domElements.taskPriority.value,
                deadline: domElements.taskDeadline.value,
                completed: editingTaskId ? tasks.find(t => t.id === editingTaskId)?.completed || false : false
            };

            createOrUpdateTask(formData);
        });

        // Real-time validation
        domElements.taskTitle.addEventListener('input', (e) => {
            const title = e.target.value.trim();
            if (title && title.length <= 100) {
                clearFieldErrors();
            }
        });

        domElements.taskDeadline.addEventListener('change', (e) => {
            const deadline = e.target.value;
            if (deadline) {
                const deadlineDate = new Date(deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (deadlineDate >= today) {
                    clearFieldErrors();
                }
            }
        });

        // System theme change detection
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                updateTheme(e.matches ? 'dark' : 'light');
            }
        });

    } catch (error) {
        console.error('Error setting up event listeners:', error);
        showToast('Failed to initialize some features. Please refresh the page.', 'error');
    }
}

// Initialize the application
function initializeApp() {
    try {
        // Initialize theme
        initializeTheme();
        
        // Setup event listeners
        setupEventListeners();
        
        // Initial render
        renderTasks();
        
        // Show welcome message
        showToast('Welcome to Todo App! 🚀');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        showToast('Failed to initialize application. Please refresh the page.', 'error');
    }
}

// Start the application
initializeApp();
