// Task Manager Module
export class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.statsManager = null; // Will be set by app.js
    }

    // Load tasks from localStorage
    loadTasks() {
        try {
            const storedTasks = localStorage.getItem('tasks');
            return storedTasks ? JSON.parse(storedTasks) : [];
        } catch (error) {
            console.error('Error loading tasks:', error);
            return [];
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        try {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
            if (this.statsManager) {
                this.statsManager.updateCharts();
            }
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            return false;
        }
    }

    // Create or update a task
    createOrUpdateTask(taskData) {
        try {
            if (taskData.id) {
                // Update existing task
                const index = this.tasks.findIndex(t => t.id === taskData.id);
                if (index !== -1) {
                    const updatedTask = { ...this.tasks[index], ...taskData };
                    // Add completedAt date when task is completed
                    if (taskData.completed && !this.tasks[index].completed) {
                        updatedTask.completedAt = new Date().toISOString();
                    } else if (!taskData.completed) {
                        delete updatedTask.completedAt;
                    }
                    this.tasks[index] = updatedTask;
                }
            } else {
                // Create new task
                const newTask = {
                    ...taskData,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.tasks.unshift(newTask);
            }
            return this.saveTasks();
        } catch (error) {
            console.error('Error creating/updating task:', error);
            return false;
        }
    }

    // Delete a task
    deleteTask(taskId) {
        try {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            return this.saveTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            return false;
        }
    }

    // Get all tasks
    getTasks() {
        return this.tasks;
    }

    // Toggle task completion
    toggleTaskCompletion(taskId) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                if (task.completed) {
                    task.completedAt = new Date().toISOString();
                } else {
                    delete task.completedAt;
                }
                return this.saveTasks();
            }
            return false;
        } catch (error) {
            console.error('Error toggling task completion:', error);
            return false;
        }
    }

    // Get task statistics
    getStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const highPriority = this.tasks.filter(t => t.priority === 'high').length;
        const dueSoon = this.tasks.filter(t => {
            if (!t.dueDate || t.completed) return false;
            const dueDate = new Date(t.dueDate);
            const today = new Date();
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            return diffDays <= 3 && diffDays >= 0;
        }).length;

        return {
            total,
            active,
            completed,
            highPriority,
            dueSoon,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }
}
