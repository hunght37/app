// Main Application Module
import { TaskManager } from './taskManager.js';
import { UIManager } from './uiManager.js';
import { ThemeManager } from './themeManager.js';
import { StatsManager } from './statsManager.js';

class TodoApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.themeManager = new ThemeManager();
        this.statsManager = new StatsManager(this.taskManager);
        this.taskManager.statsManager = this.statsManager;
        this.uiManager = new UIManager(this.taskManager, this.themeManager);

        // Initialize theme
        this.themeManager.initialize();

        // Update stats when theme changes
        this.themeManager.onThemeChange = (isDark) => {
            this.statsManager.updateTheme(isDark);
        };

        this.setupEventListeners();
    }

    // Setup all event listeners
    setupEventListeners() {
        try {
            // Task management buttons
            document.getElementById('newTaskBtn').addEventListener('click', () => this.uiManager.showTaskModal());
            document.getElementById('templateBtn').addEventListener('click', this.showTemplatesModal.bind(this));
            document.getElementById('closeTemplates').addEventListener('click', this.hideTemplatesModal.bind(this));
            document.getElementById('cancelTask').addEventListener('click', () => this.uiManager.hideTaskModal());

            // Theme toggle
            this.uiManager.domElements.themeToggle.addEventListener('click', () => {
                this.themeManager.toggleTheme();
                this.uiManager.showToast(`Switched to ${this.themeManager.currentTheme} mode`);
            });

            // Filter change
            this.uiManager.domElements.statusFilter.addEventListener('change', () => {
                const filter = this.uiManager.domElements.statusFilter.value;
                const filteredTasks = this.taskManager.getFilteredTasks(filter);
                this.uiManager.updateTaskList(filteredTasks);
            });

            // Form submission
            this.uiManager.domElements.taskForm.addEventListener('submit', this.handleFormSubmit.bind(this));

            // Task list event delegation
            this.uiManager.domElements.taskList.addEventListener('click', this.handleTaskListClick.bind(this));

            // System theme changes
            this.themeManager.setupSystemThemeListener();

        } catch (error) {
            console.error('Error setting up event listeners:', error);
            this.uiManager.showToast('Failed to initialize some features. Please refresh the page.', 'error');
        }
    }

    // Show templates modal
    showTemplatesModal() {
        const templatesModal = document.getElementById('templatesModal');
        const templateList = document.getElementById('templateList');
        
        // Clear existing templates
        templateList.innerHTML = '';

        // Add template options
        const templates = [
            { title: 'Important Meeting', priority: 'high', deadline: new Date().toISOString().split('T')[0] },
            { title: 'Weekly Review', priority: 'medium', deadline: new Date().toISOString().split('T')[0] },
            { title: 'Quick Task', priority: 'low', deadline: new Date().toISOString().split('T')[0] }
        ];

        templates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.className = 'template-item p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors';
            templateItem.innerHTML = `
                <h3 class="font-medium text-gray-900 dark:text-white">${template.title}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300">Priority: ${template.priority}</p>
            `;
            templateItem.addEventListener('click', () => {
                this.uiManager.showTaskModal(template);
                this.hideTemplatesModal();
            });
            templateList.appendChild(templateItem);
        });

        templatesModal.classList.add('modal-open');
    }

    // Hide templates modal
    hideTemplatesModal() {
        const templatesModal = document.getElementById('templatesModal');
        templatesModal.classList.remove('modal-open');
    }

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: this.uiManager.editingTaskId,
            title: this.uiManager.domElements.taskTitle.value,
            priority: this.uiManager.domElements.taskPriority.value,
            deadline: this.uiManager.domElements.taskDeadline.value,
            completed: this.uiManager.editingTaskId ? 
                this.taskManager.tasks.find(t => t.id === this.uiManager.editingTaskId)?.completed || false : 
                false
        };

        const errors = this.uiManager.validateTaskForm(formData);
        
        if (errors.length > 0) {
            errors.forEach(error => this.uiManager.showFieldError(error.field, error.message));
            return;
        }

        try {
            if (this.taskManager.createOrUpdateTask(formData)) {
                const filteredTasks = this.taskManager.getFilteredTasks(this.uiManager.domElements.statusFilter.value);
                this.uiManager.updateTaskList(filteredTasks);
                this.uiManager.updateStatistics(this.taskManager.getStatistics());
                this.uiManager.hideTaskModal();
                this.uiManager.showToast(`Task ${this.uiManager.editingTaskId ? 'updated' : 'created'} successfully`);
            }
        } catch (error) {
            console.error('Error saving task:', error);
            this.uiManager.showToast('Failed to save task. Please try again.', 'error');
        }
    }

    // Handle task list clicks
    handleTaskListClick(e) {
        const taskCard = e.target.closest('.task-card');
        if (!taskCard) return;

        try {
            if (e.target.matches('input[type="checkbox"]')) {
                const taskId = taskCard.dataset.taskId;
                if (this.taskManager.toggleTaskStatus(taskId)) {
                    const filteredTasks = this.taskManager.getFilteredTasks(this.uiManager.domElements.statusFilter.value);
                    this.uiManager.updateTaskList(filteredTasks);
                    this.uiManager.updateStatistics(this.taskManager.getStatistics());
                    this.uiManager.showToast('Task status updated');
                }
            } else if (e.target.closest('.edit-btn')) {
                this.uiManager.editingTaskId = taskCard.dataset.taskId;
                this.uiManager.showTaskModal();
            } else if (e.target.closest('.delete-btn')) {
                this.showDeleteConfirmation(taskCard.dataset.taskId);
            }
        } catch (error) {
            console.error('Error handling task action:', error);
            this.uiManager.showToast('Failed to perform action. Please try again.', 'error');
        }
    }

    // Delete confirmation
    showDeleteConfirmation(taskId) {
        const task = this.taskManager.tasks.find(t => t.id === taskId);
        if (!task) return;

        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        confirmationModal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delete Task</h3>
                <p class="text-gray-700 dark:text-gray-300 mb-6">Are you sure you want to delete "${task.title}"?</p>
                <div class="flex justify-end space-x-4">
                    <button class="cancel-delete px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        Cancel
                    </button>
                    <button class="confirm-delete px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmationModal);

        const handleConfirm = () => {
            try {
                if (this.taskManager.deleteTask(taskId)) {
                    const filteredTasks = this.taskManager.getFilteredTasks(this.uiManager.domElements.statusFilter.value);
                    this.uiManager.updateTaskList(filteredTasks);
                    this.uiManager.updateStatistics(this.taskManager.getStatistics());
                    this.uiManager.showToast('Task deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                this.uiManager.showToast('Failed to delete task. Please try again.', 'error');
            } finally {
                document.body.removeChild(confirmationModal);
            }
        };

        const handleCancel = () => {
            document.body.removeChild(confirmationModal);
        };

        confirmationModal.querySelector('.confirm-delete').addEventListener('click', handleConfirm);
        confirmationModal.querySelector('.cancel-delete').addEventListener('click', handleCancel);
    }
}

// Initialize the application
try {
    const app = new TodoApp();
    app.uiManager.showToast('Welcome to Todo App! 🚀');
} catch (error) {
    console.error('Failed to initialize application:', error);
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
}
