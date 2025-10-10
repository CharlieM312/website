import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {

  private darkModeSubject = new BehaviorSubject<boolean>(false);
  darkMode$ = this.darkModeSubject.asObservable();

  constructor() { }

  enableDarkMode() {
    this.darkModeSubject.next(true);
  }

  disableDarkMode() {
    this.darkModeSubject.next(false);
  }

  toggleDarkMode() {
    this.darkModeSubject.next(!this.darkModeSubject.value);
  }

  isDarkModeEnabled(): boolean {
    return this.darkModeSubject.value;
  }
}