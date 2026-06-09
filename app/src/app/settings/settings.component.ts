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

        const cookie = this.cookieService.get('darkMode');
        if (cookie === 'true') {
            this.darkModeService.enableDarkMode();
        } else if (cookie === 'false') {
            this.darkModeService.disableDarkMode();
        }

        this.subscriber = this.darkModeService.darkMode$.subscribe(enabled => {
            this.darkModeEnabled = enabled;
            const content = typeof document !== 'undefined' ? document.querySelector('.content') : null;

            if (enabled) {
                document.body.classList.add('dark-mode');
                if (content) content.classList.add('dark-mode');
                if (this.cookieService.get('darkMode') !== 'true') this.cookieService.set('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                if (content) content.classList.remove('dark-mode');
                if (this.cookieService.get('darkMode') !== 'false') this.cookieService.set('darkMode', 'false');
            }

        });

    }

    toggleDarkMode() {
        this.darkModeService.toggleDarkMode();
    }
}