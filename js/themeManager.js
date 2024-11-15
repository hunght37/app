// Theme Management Module
export class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.onThemeChange = null;
    }

    // Initialize theme
    initialize() {
        this.loadTheme();
        this.applyTheme();
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    // Load saved theme
    loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                this.currentTheme = savedTheme;
            } else {
                // Check system preference
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.currentTheme = systemPrefersDark ? 'dark' : 'light';
            }
        } catch (error) {
            console.error('Error loading theme:', error);
            this.currentTheme = 'light';
        }
    }

    // Save theme preference
    saveTheme() {
        try {
            localStorage.setItem('theme', this.currentTheme);
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    }

    // Toggle theme
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        this.saveTheme();
    }

    // Apply current theme
    applyTheme() {
        const isDark = this.currentTheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        this.updateThemeIcons();

        // Call theme change callback if exists
        if (typeof this.onThemeChange === 'function') {
            this.onThemeChange(isDark);
        }
    }

    // Update theme icons
    updateThemeIcons() {
        const moonIcon = document.getElementById('moonIcon');
        const sunIcon = document.getElementById('sunIcon');
        if (this.currentTheme === 'dark') {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.remove('hidden');
            sunIcon.classList.add('hidden');
        }
    }
}
