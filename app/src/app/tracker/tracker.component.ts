import { Component } from '@angular/core';
import type { OnDestroy, OnInit } from '@angular/core';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';

export interface VisitItem {
    username: string;
    iataCode: string;
    airportName: string;
    visitDate: string;
    notes: string;
}

@Component({
    selector: 'app-tracker',
    templateUrl: './tracker.component.html',
    styleUrl: './tracker.component.scss',
    standalone: false
})
export class TrackerComponent implements OnInit, OnDestroy {
    private readonly apiUrl = '/api/visits';
    private subscriber = new Subscription();

    apiToken = '';
    username = '';
    iataCode = '';
    airportName = '';
    visitDate = '';
    notes = '';

    visits: VisitItem[] = [];
    loading = true;
    error = '';

    constructor(
        private darkModeService: DarkModeService,
        private cookieService: CookieService
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
    }

    ngOnDestroy(): void {
        this.subscriber.unsubscribe();
    }

    async loadVisits(): Promise<void> {
        this.loading = true;
        this.error = '';

        try {
            const res = await fetch(this.apiUrl);
            const rawVisits = (await res.json()) as Record<string, string | undefined>[];
            this.visits = rawVisits.map(v => ({
                username: v['username'] || 'Anonymous',
                iataCode: v['iata_code'] || '',
                airportName: v['airport_name'] || 'Unknown Airport',
                visitDate: v['visit_date'] || '',
                notes: v['notes'] || ''
            }));
        } catch {
            this.error = 'Failed to load visits.';
        } finally {
            this.loading = false;
        }
    }

    async onSubmit(): Promise<void> {
        const data: Record<string, string> = {
            username: this.username,
            ['iata_code']: this.iataCode.toUpperCase(),
            ['airport_name']: this.airportName,
            ['visit_date']: this.visitDate,
            notes: this.notes
        };

        const res = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                ['Content-Type']: 'application/json',
                ['Authorization']: `Bearer ${this.apiToken}`
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            this.username = '';
            this.iataCode = '';
            this.airportName = '';
            this.visitDate = '';
            this.notes = '';

            await this.loadVisits();
        } else {
            alert('Unauthorized: Invalid token or failed to log visit.');
        }
    }
}
