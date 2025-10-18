import { Component, OnInit } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  standalone: false
})
export class AboutComponent implements OnInit {

  darkModeEnabled = false;
  private subscriber?: Subscription;

  constructor(private darkModeService: DarkModeService, private cookieService: CookieService) { }

  ngOnInit() {

        if (this.cookieService.get('darkMode') === 'true') {
            this.darkModeService.enableDarkMode();
        }
        this.subscriber = this.darkModeService.darkMode$.subscribe(enabled => {
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

}
