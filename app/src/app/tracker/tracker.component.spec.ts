/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { TrackerComponent } from './tracker.component';

describe('TrackerComponent', () => {
    let component: TrackerComponent;
    let fixture: ComponentFixture<TrackerComponent>;
    let fetchMock: jest.Mock;

    beforeEach(async () => {
        fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue([])
        });
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        await TestBed.configureTestingModule({
            declarations: [TrackerComponent],
            imports: [FormsModule],
            providers: [DarkModeService, CookieService]
        }).compileComponents();

        fixture = TestBed.createComponent(TrackerComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should enable dark mode on init when cookie is true', () => {
        const cookieService = TestBed.inject(CookieService);
        const darkModeService = TestBed.inject(DarkModeService);
        jest.spyOn(cookieService, 'get').mockReturnValue('true');
        const enableSpy = jest.spyOn(darkModeService, 'enableDarkMode');

        component.ngOnInit();

        expect(enableSpy).toHaveBeenCalled();
    });

    it('should load and map visits with flight details and capture x-d1-bookmark', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue('bookmark-123')
            },
            json: jest.fn().mockResolvedValue([
                {
                    id: 1,
                    username: 'CharlieM312',
                    ['iata_code']: 'HAM',
                    ['origin_iata']: 'LHR',
                    ['flight_number']: 'BA968',
                    ['distance_km']: 745,
                    ['airport_name']: 'Hamburg Airport',
                    city: 'Hamburg',
                    country: 'Germany',
                    ['visit_date']: '2026-09-15',
                    notes: 'Morning flight'
                },
                {
                    ['iata_code']: 'LGW',
                    ['visit_date']: '2026-11-16'
                }
            ])
        });

        await component.loadVisits();

        expect(fetchMock).toHaveBeenCalledWith('/api/visits', undefined);
        expect(component.d1Bookmark).toBe('bookmark-123');
        expect(component.loading).toBe(false);
        expect(component.error).toBe('');
        expect(component.visits).toEqual([
            {
                id: 1,
                username: 'CharlieM312',
                iataCode: 'HAM',
                originIata: 'LHR',
                flightNumber: 'BA968',
                distanceKm: 745,
                airportName: 'Hamburg Airport',
                city: 'Hamburg',
                country: 'Germany',
                visitDate: '2026-09-15',
                notes: 'Morning flight'
            },
            {
                id: 0,
                username: 'Anonymous',
                iataCode: 'LGW',
                originIata: '',
                flightNumber: '',
                distanceKm: null,
                airportName: 'Unknown Airport',
                city: '',
                country: '',
                visitDate: '2026-11-16',
                notes: ''
            }
        ]);
    });

    it('should load travel stats from /api/stats', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue({
                ['total_visits']: 5,
                ['unique_airports']: 4,
                ['unique_countries']: 2,
                ['total_distance_km']: 1490,
                ['total_distance_miles']: 925.8
            })
        });

        await component.loadStats('CharlieM312');

        expect(fetchMock).toHaveBeenCalledWith('/api/stats?username=CharlieM312', undefined);
        expect(component.stats).toEqual({
            totalVisits: 5,
            uniqueAirports: 4,
            uniqueCountries: 2,
            totalDistanceKm: 1490,
            totalDistanceMiles: 925.8
        });
    });

    it('should set error message when loadVisits fails', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        await component.loadVisits();

        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to load visits.');
    });

    it('should load visits for a specific username using filterUsername', async () => {
        component.filterUsername = 'CharlieM312';
        fetchMock.mockResolvedValueOnce({
            ok: true,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue([
                {
                    id: 2,
                    username: 'CharlieM312',
                    ['iata_code']: 'EDI',
                    ['airport_name']: 'Edinburgh',
                    ['visit_date']: '2026-10-01',
                    notes: ''
                }
            ])
        });

        await component.loadUserVisits();

        expect(fetchMock).toHaveBeenCalledWith('/api/visits?username=CharlieM312', undefined);
        expect(component.loading).toBe(false);
        expect(component.visits).toHaveLength(1);
        expect(component.visits[0].iataCode).toBe('EDI');
    });

    it('should fall back to loadVisits when filterUsername and username are empty', async () => {
        component.filterUsername = '   ';
        component.username = '';

        await component.loadUserVisits();

        expect(fetchMock).toHaveBeenCalledWith('/api/visits', undefined);
    });

    it('should set error message when loadUserVisits fails', async () => {
        component.filterUsername = 'CharlieM312';
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        await component.loadUserVisits();

        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to load user visits.');
    });

    it('should clear filterUsername and reload all visits on clearUserFilter', async () => {
        component.filterUsername = 'CharlieM312';

        await component.clearUserFilter();

        expect(component.filterUsername).toBe('');
        expect(fetchMock).toHaveBeenCalledWith('/api/visits', undefined);
    });

    it('should submit a new visit with originIata and flightNumber, clear form fields except token, and reload visits', async () => {
        component.apiToken = 'secret-token';
        component.username = 'CharlieM312';
        component.originIata = 'lhr';
        component.iataCode = 'ham';
        component.flightNumber = 'ba968';
        component.airportName = 'Hamburg Airport';
        component.visitDate = '2026-09-15';
        component.notes = 'Test note';

        await component.onSubmit();

        expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/visits', {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer secret-token'
            },
            body: JSON.stringify({
                username: 'CharlieM312',
                ['iata_code']: 'HAM',
                ['visit_date']: '2026-09-15',
                notes: 'Test note',
                ['origin_iata']: 'LHR',
                ['flight_number']: 'BA968',
                ['airport_name']: 'Hamburg Airport'
            })
        });
        expect(component.apiToken).toBe('secret-token');
        expect(component.username).toBe('');
        expect(component.originIata).toBe('');
        expect(component.iataCode).toBe('');
        expect(component.flightNumber).toBe('');
        expect(component.airportName).toBe('');
        expect(component.visitDate).toBe('');
        expect(component.notes).toBe('');
        expect(component.submitSuccess).toBe('Visit logged successfully.');
    });

    it('should send PATCH request when editing an existing visit', async () => {
        component.apiToken = 'secret-token';
        component.startEdit({
            id: 1,
            username: 'CharlieM312',
            iataCode: 'HAM',
            originIata: 'LHR',
            flightNumber: 'BA968',
            distanceKm: 745,
            airportName: 'Hamburg Airport',
            city: 'Hamburg',
            country: 'Germany',
            visitDate: '2026-09-15',
            notes: 'Updated note'
        });

        await component.onSubmit();

        expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/visits/1', {
            method: 'PATCH',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer secret-token'
            },
            body: JSON.stringify({
                username: 'CharlieM312',
                ['iata_code']: 'HAM',
                ['visit_date']: '2026-09-15',
                notes: 'Updated note',
                ['origin_iata']: 'LHR',
                ['flight_number']: 'BA968',
                ['airport_name']: 'Hamburg Airport'
            })
        });
        expect(component.editingVisitId).toBeNull();
        expect(component.submitSuccess).toBe('Visit updated successfully.');
    });

    it('should display API error message when onSubmit fails', async () => {
        component.apiToken = 'bad-token';
        component.username = 'CharlieM312';
        component.iataCode = 'XYZ';
        component.visitDate = '2026-11-15';

        fetchMock.mockResolvedValueOnce({
            ok: false,
            headers: {
                get: jest.fn().mockReturnValue(null)
            },
            json: jest.fn().mockResolvedValue({
                error: 'Invalid or unknown iata_code \'XYZ\'. It must match an airport in /api/airports.'
            })
        });

        await component.onSubmit();

        expect(component.submitError).toBe(
            'Invalid or unknown iata_code \'XYZ\'. It must match an airport in /api/airports.'
        );
        expect(component.username).toBe('CharlieM312');
    });

    it('should delete a visit by id when apiToken is provided', async () => {
        component.apiToken = 'secret-token';
        component.visits = [
            {
                id: 1,
                username: 'CharlieM312',
                iataCode: 'HAM',
                originIata: 'LHR',
                flightNumber: 'BA968',
                distanceKm: 745,
                airportName: 'Hamburg Airport',
                city: 'Hamburg',
                country: 'Germany',
                visitDate: '2026-09-15',
                notes: ''
            }
        ];

        await component.deleteVisit(1);

        expect(fetchMock).toHaveBeenCalledWith('/api/visits/1', {
            method: 'DELETE',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: 'Bearer secret-token'
            },
            body: JSON.stringify({ id: 1 })
        });
        expect(component.visits).toHaveLength(0);
        expect(component.submitSuccess).toBe('Visit deleted.');
    });
});
