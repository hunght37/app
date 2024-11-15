// Theme Management Module
export class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.loadTheme();
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
        if (this.currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        this.updateThemeIcons();
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

    // Listen for system theme changes
    setupSystemThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }
}
