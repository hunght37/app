// Task Manager Module
export class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
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
                    this.tasks[index] = { ...this.tasks[index], ...taskData };
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

    // Toggle task completion status
    toggleTaskStatus(taskId) {
        try {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.completed = !task.completed;
                task.updatedAt = new Date().toISOString();
                return this.saveTasks();
            }
            return false;
        } catch (error) {
            console.error('Error toggling task status:', error);
            return false;
        }
    }

    // Get filtered tasks based on status
    getFilteredTasks(filter = 'all') {
        try {
            let filteredTasks = [...this.tasks];
            
            switch (filter) {
                case 'active':
                    filteredTasks = filteredTasks.filter(task => !task.completed);
                    break;
                case 'completed':
                    filteredTasks = filteredTasks.filter(task => task.completed);
                    break;
                case 'high':
                    filteredTasks = filteredTasks.filter(task => task.priority === 'high');
                    break;
                case 'medium':
                    filteredTasks = filteredTasks.filter(task => task.priority === 'medium');
                    break;
                case 'low':
                    filteredTasks = filteredTasks.filter(task => task.priority === 'low');
                    break;
                case 'deadline':
                    filteredTasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
                    break;
            }

            return filteredTasks;
        } catch (error) {
            console.error('Error filtering tasks:', error);
            return this.tasks;
        }
    }

    // Get task statistics
    getStatistics() {
        try {
            const total = this.tasks.length;
            const completed = this.tasks.filter(task => task.completed).length;
            const active = total - completed;
            const highPriority = this.tasks.filter(task => task.priority === 'high').length;
            const dueSoon = this.tasks.filter(task => {
                const deadline = new Date(task.deadline);
                const today = new Date();
                const diffTime = deadline.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 3 && diffDays >= 0;
            }).length;

            return {
                total,
                completed,
                active,
                highPriority,
                dueSoon,
                completionRate: total ? Math.round((completed / total) * 100) : 0
            };
        } catch (error) {
            console.error('Error calculating statistics:', error);
            return {
                total: 0,
                completed: 0,
                active: 0,
                highPriority: 0,
                dueSoon: 0,
                completionRate: 0
            };
        }
    }
}
