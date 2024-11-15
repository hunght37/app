export class StatsManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.charts = {};
        this.initializeCharts();
    }

    initializeCharts() {
        // Status Distribution Chart
        this.charts.status = new Chart(document.getElementById('statusChart'), {
            type: 'doughnut',
            data: {
                labels: ['Active', 'Completed'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#EAB308', '#22C55E']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    }
                }
            }
        });

        // Priority Distribution Chart
        this.charts.priority = new Chart(document.getElementById('priorityChart'), {
            type: 'pie',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    }
                }
            }
        });

        // Timeline Chart
        this.charts.timeline = new Chart(document.getElementById('timelineChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Tasks Due',
                    data: [],
                    backgroundColor: '#60A5FA'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    }
                }
            }
        });

        // Completion Trend Chart
        this.charts.trend = new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Completed Tasks',
                    data: [],
                    borderColor: '#22C55E',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#E5E7EB' : '#1F2937'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        const tasks = this.taskManager.getTasks();
        
        // Update Status Distribution
        const statusData = {
            active: tasks.filter(t => !t.completed).length,
            completed: tasks.filter(t => t.completed).length
        };
        this.charts.status.data.datasets[0].data = [statusData.active, statusData.completed];
        this.charts.status.update();

        // Update Priority Distribution
        const priorityData = {
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
        };
        this.charts.priority.data.datasets[0].data = [priorityData.high, priorityData.medium, priorityData.low];
        this.charts.priority.update();

        // Update Timeline Chart
        const timelineData = this.getTimelineData(tasks);
        this.charts.timeline.data.labels = timelineData.labels;
        this.charts.timeline.data.datasets[0].data = timelineData.data;
        this.charts.timeline.update();

        // Update Completion Trend
        const trendData = this.getTrendData(tasks);
        this.charts.trend.data.labels = trendData.labels;
        this.charts.trend.data.datasets[0].data = trendData.data;
        this.charts.trend.update();
    }

    getTimelineData(tasks) {
        const today = new Date();
        const dates = {};
        
        // Group tasks by due date
        tasks.forEach(task => {
            if (task.dueDate) {
                const date = new Date(task.dueDate).toLocaleDateString();
                dates[date] = (dates[date] || 0) + 1;
            }
        });

        // Sort dates and prepare chart data
        const sortedDates = Object.entries(dates)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(0, 7); // Show only next 7 days with tasks

        return {
            labels: sortedDates.map(([date]) => date),
            data: sortedDates.map(([, count]) => count)
        };
    }

    getTrendData(tasks) {
        const completedTasks = tasks.filter(t => t.completed);
        const dates = {};

        // Group completed tasks by completion date
        completedTasks.forEach(task => {
            const date = new Date(task.completedAt).toLocaleDateString();
            dates[date] = (dates[date] || 0) + 1;
        });

        // Get last 7 days
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString();
        }).reverse();

        return {
            labels: last7Days,
            data: last7Days.map(date => dates[date] || 0)
        };
    }

    updateTheme(isDark) {
        const textColor = isDark ? '#E5E7EB' : '#1F2937';
        
        // Update text color for all charts
        Object.values(this.charts).forEach(chart => {
            if (chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            if (chart.options.scales) {
                if (chart.options.scales.x) {
                    chart.options.scales.x.ticks.color = textColor;
                }
                if (chart.options.scales.y) {
                    chart.options.scales.y.ticks.color = textColor;
                }
            }
            chart.update();
        });
    }
}
