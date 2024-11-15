// UI Manager Module
export class UIManager {
    constructor() {
        this.editingTaskId = null;
        this.setupDomElements();
    }

    // Setup DOM element references
    setupDomElements() {
        this.domElements = {
            taskForm: document.getElementById('taskForm'),
            taskList: document.getElementById('taskList'),
            taskTitle: document.getElementById('taskTitle'),
            taskPriority: document.getElementById('taskPriority'),
            taskDeadline: document.getElementById('taskDeadline'),
            statusFilter: document.getElementById('statusFilter'),
            taskModal: document.getElementById('taskModal'),
            templatesModal: document.getElementById('templatesModal'),
            templateList: document.getElementById('templateList'),
            themeToggle: document.getElementById('themeToggle'),
            statsTotal: document.getElementById('statsTotal'),
            statsActive: document.getElementById('statsActive'),
            statsCompleted: document.getElementById('statsCompleted'),
            statsHighPriority: document.getElementById('statsHighPriority'),
            statsDueSoon: document.getElementById('statsDueSoon'),
            statsCompletionRate: document.getElementById('statsCompletionRate')
        };
    }

    // Show task modal
    showTaskModal(template = null) {
        this.clearFieldErrors();
        if (template) {
            this.domElements.taskTitle.value = template.title;
            this.domElements.taskPriority.value = template.priority;
            this.domElements.taskDeadline.value = template.deadline;
        } else if (this.editingTaskId) {
            const task = document.querySelector(`[data-task-id="${this.editingTaskId}"]`);
            if (task) {
                this.domElements.taskTitle.value = task.querySelector('.task-title').textContent;
                this.domElements.taskPriority.value = task.dataset.priority;
                this.domElements.taskDeadline.value = task.dataset.deadline;
            }
        } else {
            this.domElements.taskForm.reset();
            this.domElements.taskDeadline.value = new Date().toISOString().split('T')[0];
        }
        this.domElements.taskModal.classList.add('modal-open');
    }

    // Hide task modal
    hideTaskModal() {
        this.editingTaskId = null;
        this.domElements.taskModal.classList.remove('modal-open');
        this.clearFieldErrors();
    }

    // Show field error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
        field.classList.add('border-red-500');
    }

    // Clear field errors
    clearFieldErrors() {
        const errorMessages = document.querySelectorAll('.text-red-500');
        errorMessages.forEach(error => error.remove());
        const errorFields = document.querySelectorAll('.border-red-500');
        errorFields.forEach(field => field.classList.remove('border-red-500'));
    }

    // Validate task form
    validateTaskForm(formData) {
        const errors = [];
        if (!formData.title.trim()) {
            errors.push({ field: 'taskTitle', message: 'Title is required' });
        }
        if (!formData.priority) {
            errors.push({ field: 'taskPriority', message: 'Priority is required' });
        }
        if (!formData.deadline) {
            errors.push({ field: 'taskDeadline', message: 'Deadline is required' });
        } else {
            const deadline = new Date(formData.deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (deadline < today) {
                errors.push({ field: 'taskDeadline', message: 'Deadline cannot be in the past' });
            }
        }
        return errors;
    }

    // Update task list
    updateTaskList(tasks) {
        this.domElements.taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            this.domElements.taskList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <p class="text-lg font-medium">No tasks found</p>
                    <p class="mt-1">Create a new task to get started!</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-card priority-${task.priority} ${task.completed ? 'completed' : ''} 
                                   bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 p-4 transition-all`;
            taskElement.dataset.taskId = task.id;
            taskElement.dataset.priority = task.priority;
            taskElement.dataset.deadline = task.deadline;

            const deadline = new Date(task.deadline);
            const today = new Date();
            const diffTime = deadline.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isOverdue = diffDays < 0;
            const isDueSoon = diffDays >= 0 && diffDays <= 3;

            taskElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <input type="checkbox" class="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out" 
                               ${task.completed ? 'checked' : ''}>
                        <div>
                            <h3 class="task-title text-lg font-medium text-gray-900 dark:text-white ${task.completed ? 'line-through' : ''}">${task.title}</h3>
                            <div class="flex items-center space-x-4 mt-1">
                                <span class="text-sm text-gray-600 dark:text-gray-400">Priority: ${task.priority}</span>
                                <span class="text-sm ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'}">
                                    ${isOverdue ? 'Overdue' : isDueSoon ? 'Due soon' : `Due: ${deadline.toLocaleDateString()}`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="edit-btn p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="delete-btn p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            this.domElements.taskList.appendChild(taskElement);
        });
    }

    // Update statistics
    updateStatistics(stats) {
        this.domElements.statsTotal.textContent = stats.total;
        this.domElements.statsActive.textContent = stats.active;
        this.domElements.statsCompleted.textContent = stats.completed;
        this.domElements.statsHighPriority.textContent = stats.highPriority;
        this.domElements.statsDueSoon.textContent = stats.dueSoon;
        this.domElements.statsCompletionRate.textContent = `${stats.completionRate}%`;
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 
                          ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        });

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}
