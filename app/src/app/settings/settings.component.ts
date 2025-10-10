import { Component } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    standalone: false
})
export class SettingsComponent {

    constructor(private darkModeService: DarkModeService) { }

    darkModeEnabled = false;

    toggleDarkMode() {
        this.darkModeService.toggleDarkMode();
        const content = document.querySelector('.content');
        if (this.darkModeService.isDarkModeEnabled()) {
            document.body.classList.add('dark-mode');
            if (content) content.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            if (content) content.classList.remove('dark-mode');
        }
    }
}