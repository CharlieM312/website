/// <reference types="jest" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { AppModule } from '../app.module';
import { CookieService } from 'ngx-cookie-service';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';

describe('Settings', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      imports: [AppModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle dark mode', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#darkModeToggle') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.darkModeEnabled).toBe(true);
    checkbox.click();
    fixture.detectChanges();
    expect(component.darkModeEnabled).toBe(false);
  });

  it('should enable dark mode with the cookie service', () => {
    const cookieService = TestBed.inject(CookieService);
    const darkModeService = TestBed.inject(DarkModeService);
    jest.spyOn(cookieService, 'get').mockReturnValue('true');
    const darkModeSpy = jest.spyOn(darkModeService, 'enableDarkMode');
    component.ngOnInit();
    expect(darkModeSpy).toHaveBeenCalled();
  });

  it('should disable dark mode with the cookie service', () => {
    const cookieService = TestBed.inject(CookieService);
    const darkModeService = TestBed.inject(DarkModeService);
    jest.spyOn(cookieService, 'get').mockReturnValue('false');
    const darkModeSpy = jest.spyOn(darkModeService, 'disableDarkMode');

    fixture.detectChanges();
    expect(darkModeSpy).toHaveBeenCalled();
  });
});
