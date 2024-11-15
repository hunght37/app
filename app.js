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
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';
let editingTaskId = null;

// DOM Elements
const taskList = document.getElementById('taskList');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const templatesModal = document.getElementById('templatesModal');
const templateList = document.getElementById('templateList');
const statusFilter = document.getElementById('statusFilter');
const themeToggle = document.getElementById('themeToggle');
const modalTitle = document.getElementById('modalTitle');

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
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');

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
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
}

// Task management
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card priority-${task.priority} ${task.completed ? 'task-completed' : ''}`;
    
    const daysUntilDeadline = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const deadlineClass = daysUntilDeadline <= 1 ? 'text-red-500' : daysUntilDeadline <= 3 ? 'text-yellow-500' : 'text-green-500';

    taskElement.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <input type="checkbox" ${task.completed ? 'checked' : ''} 
                    class="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                    onchange="toggleTaskStatus('${task.id}')">
                <div>
                    <h3 class="task-title text-lg font-semibold text-gray-900 dark:text-white">${task.title}</h3>
                    <p class="text-sm ${deadlineClass}">Deadline: ${task.deadline}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button onclick="editTask('${task.id}')" 
                    class="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                </button>
                <button onclick="deleteTask('${task.id}')"
                    class="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
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
    taskList.innerHTML = '';
    filteredTasks.forEach(task => {
        taskList.appendChild(createTaskElement(task));
    });
    updateStatistics();
}

function filterTasks() {
    const filter = statusFilter.value;
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
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function showTaskModal(template = null) {
    modalTitle.textContent = editingTaskId ? 'Edit Task' : 'New Task';
    if (template) {
        document.getElementById('taskTitle').value = template.title;
        document.getElementById('taskPriority').value = template.priority;
        document.getElementById('taskDeadline').value = template.deadline;
    } else if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskDeadline').value = task.deadline;
    } else {
        taskForm.reset();
    }
    taskModal.classList.add('modal-open');
}

function hideTaskModal() {
    taskModal.classList.remove('modal-open');
    editingTaskId = null;
    taskForm.reset();
}

function showTemplatesModal() {
    templateList.innerHTML = '';
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
        templateList.appendChild(templateElement);
    });
    templatesModal.classList.add('modal-open');
}

function hideTemplatesModal() {
    templatesModal.classList.remove('modal-open');
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
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }

    // Show confirmation modal
    confirmationModalEl.classList.add('modal-open');
    
    // Setup event listeners for confirmation
    const handleConfirm = () => {
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        hideConfirmationModal();
        
        // Show feedback toast
        showToast(`Task "${task.title}" has been deleted`);
    };
    
    const handleCancel = () => {
        hideConfirmationModal();
    };
    
    // Add one-time event listeners
    confirmDeleteBtn.addEventListener('click', handleConfirm, { once: true });
    cancelDeleteBtn.addEventListener('click', handleCancel, { once: true });
}

function hideConfirmationModal() {
    confirmationModalEl.classList.remove('modal-open');
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-0 opacity-100 transition-all duration-300';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Fade out and remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('translate-y-2', 'opacity-0');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Event Listeners
document.getElementById('newTaskBtn').addEventListener('click', () => showTaskModal());
document.getElementById('templateBtn').addEventListener('click', showTemplatesModal);
document.getElementById('closeTemplates').addEventListener('click', hideTemplatesModal);
document.getElementById('cancelTask').addEventListener('click', hideTaskModal);
themeToggle.addEventListener('click', toggleTheme);
statusFilter.addEventListener('change', renderTasks);

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskData = {
        id: editingTaskId || Date.now().toString(),
        title: document.getElementById('taskTitle').value,
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value,
        completed: false
    };

    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            taskData.completed = tasks[index].completed;
            tasks[index] = taskData;
        }
    } else {
        tasks.push(taskData);
    }

    saveTasks();
    renderTasks();
    hideTaskModal();
});

// Initialize the app
initializeTheme();
renderTasks();
