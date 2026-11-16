/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieService } from 'ngx-cookie-service';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { PrivacyComponent } from './privacy.component';

describe('PrivacyComponent', () => {
    let component: PrivacyComponent;
    let fixture: ComponentFixture<PrivacyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PrivacyComponent],
            providers: [DarkModeService, CookieService]
        }).compileComponents();

        fixture = TestBed.createComponent(PrivacyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
