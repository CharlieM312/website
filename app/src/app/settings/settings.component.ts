import { Component } from '@angular/core';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    standalone: false
})
export class SettingsComponent {

    darkModeEnabled = false;

    toggleDarkMode() {
        const content = document.querySelector('.content');
        if (this.darkModeEnabled) {
            document.body.classList.add('dark-mode');
            if (content) content.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            if (content) content.classList.remove('dark-mode');
        }
    }
}