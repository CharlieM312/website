import { Component, OnInit } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
    standalone: false
})
export class SettingsComponent implements OnInit {

    constructor(private darkModeService: DarkModeService, private cookieService: CookieService) { }

    darkModeEnabled = false;
    private subscriber?: Subscription;

    ngOnInit() {
        this.darkModeEnabled = this.darkModeService.isDarkModeEnabled();
        
        if (this.cookieService.get('darkMode') === 'true') {
            this.darkModeService.enableDarkMode();
            const content = document.querySelector('.content');
            document.body.classList.add('dark-mode');
            if (content) content.classList.add('dark-mode');
        } else if (this.cookieService.get('darkMode') === 'false') {
            this.darkModeService.disableDarkMode();
            const content = document.querySelector('.content');
            document.body.classList.remove('dark-mode');
            if (content) content.classList.remove('dark-mode');
        }

        this.subscriber = this.darkModeService.darkMode$.subscribe(enabled => {
            this.darkModeEnabled = enabled;
            const content = document.querySelector('.content');

            if (enabled) {
                document.body.classList.add('dark-mode');
                if (content) content.classList.add('dark-mode');
                this.cookieService.set('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                if (content) content.classList.remove('dark-mode');
                this.cookieService.set('darkMode', 'false');
            }

        });

    }

    toggleDarkMode() {
        this.darkModeService.toggleDarkMode();
    }
}