import { Component } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  standalone: false
})
export class AboutComponent {

  darkModeEnabled = false;

  constructor(private darkModeService: DarkModeService) { }

  ngOnInit() {
    this.darkModeService.darkMode$.subscribe(enabled => {
      this.darkModeEnabled = enabled;
      const content = document.querySelector('.content');
      if (this.darkModeService.isDarkModeEnabled()) {
        document.body.classList.add('dark-mode');
        if (content) content.classList.add('dark-mode');
      } else {
          document.body.classList.remove('dark-mode');
          if (content) content.classList.remove('dark-mode');
      }
    });
  }

}
