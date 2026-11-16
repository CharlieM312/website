import { Component } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-privacy',
    templateUrl: './privacy.component.html',
    styleUrl: './privacy.component.scss',
    standalone: false
})
export class PrivacyComponent implements OnInit, OnDestroy {
    private subscriber = new Subscription();

    constructor(
        private darkModeService: DarkModeService,
        private cookieService: CookieService
    ) {}

    ngOnInit(): void {
        if (this.cookieService.get('darkMode') === 'true') {
            this.darkModeService.enableDarkMode();
        }

        this.subscriber.add(
            this.darkModeService.darkMode$.subscribe(enabled => {
                const content = typeof document !== 'undefined' ? document.querySelector('.content') : null;

                if (enabled) {
                    document.body.classList.add('dark-mode');
                    if (content) content.classList.add('dark-mode');
                    this.cookieService.set('darkMode', 'true');
                } else {
                    document.body.classList.remove('dark-mode');
                    if (content) content.classList.remove('dark-mode');
                    this.cookieService.set('darkMode', 'false');
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriber.unsubscribe();
    }
}
