import {Component, OnInit} from '@angular/core';
import { Subscription } from 'rxjs';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.scss'],
    standalone: false
})
export class IndexComponent implements OnInit {

    constructor(private darkModeService: DarkModeService, private cookieService: CookieService) { }

    private subscriber?: Subscription;

    ngOnInit() {

        if (this.cookieService.get('darkMode') === 'true') {
            this.darkModeService.enableDarkMode();
        }
        this.subscriber = this.darkModeService.darkMode$.subscribe(enabled => {
            const content = document.querySelector('.website-container');

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

}