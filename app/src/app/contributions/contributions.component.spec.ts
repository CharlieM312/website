/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppModule } from '../app.module';
import { CookieService } from 'ngx-cookie-service';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { ContributionsComponent } from './contributions.component';

describe('ContributionsComponent', () => {
  let component: ContributionsComponent;
  let fixture: ComponentFixture<ContributionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContributionsComponent],
      imports: [AppModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContributionsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
    const cookieSpy = jest.spyOn(cookieService, 'set');
    jest.spyOn(cookieService, 'get').mockReturnValue('false');
    component.ngOnInit();
    expect(cookieSpy).toHaveBeenCalledWith('darkMode', 'false');
  });
});