import { ChangeDetectorRef, Component } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';

export interface VisitItem {
    id: number;
    username: string;
    iataCode: string;
    originIata: string;
    flightNumber: string;
    distanceKm: number | null;
    airportName: string;
    city: string;
    country: string;
    visitDate: string;
    notes: string;
}

export interface TravelStats {
    totalVisits: number;
    uniqueAirports: number;
    uniqueCountries: number;
    totalDistanceKm: number;
    totalDistanceMiles: number;
}

@Component({
    selector: 'app-tracker',
    templateUrl: './tracker.component.html',
    styleUrl: './tracker.component.scss',
    standalone: false
})
export class TrackerComponent implements OnInit, OnDestroy {
    private readonly apiUrl = '/api/visits';
    private readonly statsUrl = '/api/stats';
    private subscriber = new Subscription();

    apiToken = '';
    username = '';
    filterUsername = '';
    originIata = '';
    iataCode = '';
    flightNumber = '';
    airportName = '';
    visitDate = '';
    notes = '';

    editingVisitId: number | null = null;
    d1Bookmark = '';

    visits: VisitItem[] = [];
    stats: TravelStats | null = null;
    loading = true;
    submitting = false;
    error = '';
    submitError = '';
    submitSuccess = '';

    constructor(
        private darkModeService: DarkModeService,
        private cookieService: CookieService,
        private cdr: ChangeDetectorRef
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

        void this.loadVisits();
        void this.loadStats();
    }

    ngOnDestroy(): void {
        this.subscriber.unsubscribe();
    }

    private getRequestHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
        const headers: Record<string, string> = { ...extraHeaders };
        if (this.d1Bookmark) {
            headers['x-d1-bookmark'] = this.d1Bookmark;
        }
        return headers;
    }

    private captureBookmark(res: Response): void {
        const bookmark = res.headers?.get?.('x-d1-bookmark');
        if (bookmark) {
            this.d1Bookmark = bookmark;
        }
    }

    private mapVisits(rawVisits: Record<string, unknown>[]): VisitItem[] {
        return rawVisits.map(v => {
            const rawDistance = v['distance_km'];
            const parsedDistance =
                typeof rawDistance === 'number'
                    ? rawDistance
                    : typeof rawDistance === 'string' && rawDistance !== ''
                      ? Number(rawDistance)
                      : null;

            return {
                id: typeof v['id'] === 'number' ? v['id'] : Number(v['id'] || 0),
                username: typeof v['username'] === 'string' && v['username'] ? v['username'] : 'Anonymous',
                iataCode: typeof v['iata_code'] === 'string' ? v['iata_code'] : '',
                originIata: typeof v['origin_iata'] === 'string' ? v['origin_iata'] : '',
                flightNumber: typeof v['flight_number'] === 'string' ? v['flight_number'] : '',
                distanceKm: parsedDistance !== null && Number.isFinite(parsedDistance) ? parsedDistance : null,
                airportName:
                    typeof v['airport_name'] === 'string' && v['airport_name']
                        ? v['airport_name']
                        : 'Unknown Airport',
                city: typeof v['city'] === 'string' ? v['city'] : '',
                country: typeof v['country'] === 'string' ? v['country'] : '',
                visitDate: typeof v['visit_date'] === 'string' ? v['visit_date'] : '',
                notes: typeof v['notes'] === 'string' ? v['notes'] : ''
            };
        });
    }

    async loadStats(username?: string): Promise<void> {
        try {
            const query = username ? `?username=${encodeURIComponent(username)}` : '';
            const res = await fetch(
                `${this.statsUrl}${query}`,
                Object.keys(this.getRequestHeaders()).length > 0
                    ? { headers: this.getRequestHeaders() }
                    : undefined
            );
            if (!res.ok) return;
            this.captureBookmark(res);

            const raw = (await res.json()) as Record<string, unknown>;
            this.stats = {
                totalVisits: Number(raw['total_visits'] ?? 0),
                uniqueAirports: Number(raw['unique_airports'] ?? 0),
                uniqueCountries: Number(raw['unique_countries'] ?? 0),
                totalDistanceKm: Number(raw['total_distance_km'] ?? 0),
                totalDistanceMiles: Number(raw['total_distance_miles'] ?? 0)
            };
        } catch {
            // Stats are non-blocking; ignore errors if endpoint is unavailable
        } finally {
            this.cdr.detectChanges();
        }
    }

    async loadVisits(): Promise<void> {
        this.loading = true;
        this.error = '';

        try {
            const headers = this.getRequestHeaders();
            const res = await fetch(
                this.apiUrl,
                Object.keys(headers).length > 0 ? { headers } : undefined
            );
            this.captureBookmark(res);
            const rawVisits = (await res.json()) as Record<string, unknown>[];
            this.visits = this.mapVisits(rawVisits);
        } catch {
            this.error = 'Failed to load visits.';
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async loadUserVisits(): Promise<void> {
        const targetUsername = (this.filterUsername || this.username).trim();
        if (!targetUsername) {
            await this.loadVisits();
            await this.loadStats();
            return;
        }

        this.loading = true;
        this.error = '';

        try {
            const headers = this.getRequestHeaders();
            const res = await fetch(
                `${this.apiUrl}?username=${encodeURIComponent(targetUsername)}`,
                Object.keys(headers).length > 0 ? { headers } : undefined
            );
            this.captureBookmark(res);
            const rawVisits = (await res.json()) as Record<string, unknown>[];
            this.visits = this.mapVisits(rawVisits);
            void this.loadStats(targetUsername);
        } catch {
            this.error = 'Failed to load user visits.';
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async clearUserFilter(): Promise<void> {
        this.filterUsername = '';
        await this.loadVisits();
        await this.loadStats();
    }

    startEdit(visit: VisitItem): void {
        this.editingVisitId = visit.id;
        this.username = visit.username === 'Anonymous' ? '' : visit.username;
        this.originIata = visit.originIata;
        this.iataCode = visit.iataCode;
        this.flightNumber = visit.flightNumber;
        this.airportName = visit.airportName === 'Unknown Airport' ? '' : visit.airportName;
        this.visitDate = visit.visitDate;
        this.notes = visit.notes;
        this.submitError = '';
        this.submitSuccess = '';
    }

    cancelEdit(): void {
        this.editingVisitId = null;
        this.resetFormFields();
        this.submitError = '';
    }

    private resetFormFields(): void {
        this.username = '';
        this.originIata = '';
        this.iataCode = '';
        this.flightNumber = '';
        this.airportName = '';
        this.visitDate = '';
        this.notes = '';
    }

    async onSubmit(): Promise<void> {
        this.submitting = true;
        this.submitError = '';
        this.submitSuccess = '';

        const data: Record<string, string | number> = {
            username: this.username,
            ['iata_code']: this.iataCode.trim().toUpperCase(),
            ['visit_date']: this.visitDate,
            notes: this.notes
        };

        if (this.originIata.trim()) {
            data['origin_iata'] = this.originIata.trim().toUpperCase();
        }
        if (this.flightNumber.trim()) {
            data['flight_number'] = this.flightNumber.trim().toUpperCase();
        }
        if (this.airportName.trim()) {
            data['airport_name'] = this.airportName.trim();
        }

        const isEditing = this.editingVisitId !== null;
        const targetUrl = isEditing ? `${this.apiUrl}/${this.editingVisitId}` : this.apiUrl;
        const method = isEditing ? 'PATCH' : 'POST';

        try {
            const res = await fetch(targetUrl, {
                method,
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${this.apiToken}`
                }),
                body: JSON.stringify(data)
            });

            this.captureBookmark(res);

            if (res.ok) {
                this.editingVisitId = null;
                this.resetFormFields();
                this.submitSuccess = isEditing ? 'Visit updated successfully.' : 'Visit logged successfully.';
                this.cdr.detectChanges();

                const activeFilter = this.filterUsername.trim();
                if (activeFilter) {
                    await this.loadUserVisits();
                } else {
                    await this.loadVisits();
                    await this.loadStats();
                }
            } else {
                let errorMessage = 'Unauthorized: Invalid token or failed to log visit.';
                try {
                    const errBody = (await res.json()) as Record<string, unknown>;
                    if (typeof errBody['error'] === 'string' && errBody['error']) {
                        errorMessage = errBody['error'];
                    }
                } catch {
                    // Keep default message if response body is not JSON
                }
                this.submitError = errorMessage;
            }
        } catch {
            this.submitError = 'Network error: Failed to save visit.';
        } finally {
            this.submitting = false;
            this.cdr.detectChanges();
        }
    }

    async deleteVisit(id: number): Promise<void> {
        if (!this.apiToken) {
            this.submitError = 'Enter your API Secret Token above to delete a visit.';
            this.cdr.detectChanges();
            return;
        }

        this.submitError = '';
        this.submitSuccess = '';

        try {
            const res = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: this.getRequestHeaders({
                    ['Content-Type']: 'application/json',
                    ['Authorization']: `Bearer ${this.apiToken}`
                }),
                body: JSON.stringify({ id })
            });

            this.captureBookmark(res);

            if (res.ok) {
                this.visits = this.visits.filter(v => v.id !== id);
                this.submitSuccess = 'Visit deleted.';
                void this.loadStats(this.filterUsername.trim() || undefined);
            } else {
                this.submitError = 'Failed to delete visit. Check your API Secret Token.';
            }
        } catch {
            this.submitError = 'Network error: Failed to delete visit.';
        } finally {
            this.cdr.detectChanges();
        }
    }
}
