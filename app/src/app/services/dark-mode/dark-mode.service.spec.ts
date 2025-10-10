import { TestBed } from "@angular/core/testing";
import { DarkModeService } from "./dark-mode.service";


describe('DarkModeService', () => {
    let service: DarkModeService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DarkModeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should enable dark mode', () => {
        service.enableDarkMode();
        expect(service.isDarkModeEnabled()).toBe(true);
    });

    it('should disable dark mode', () => {
        service.disableDarkMode();
        expect(service.isDarkModeEnabled()).toBe(false);
    });

    it('should toggle dark mode', () => {
        service.toggleDarkMode();
        expect(service.isDarkModeEnabled()).toBe(true);
        service.toggleDarkMode();
        expect(service.isDarkModeEnabled()).toBe(false);
    });
});