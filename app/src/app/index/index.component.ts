import {Component, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
import { Subscription } from 'rxjs';
import { DarkModeService } from '../services/dark-mode/dark-mode.service';
import { CookieService } from 'ngx-cookie-service';
import * as L from 'leaflet';

@Component({
    selector: 'app-index',
    templateUrl: './index.component.html',
    styleUrls: ['./index.component.scss'],
    standalone: false
})
export class IndexComponent implements OnInit, AfterViewInit, OnDestroy {

    constructor(private darkModeService: DarkModeService, private cookieService: CookieService) { }

    private subscriber?: Subscription;
    private map?: L.Map;
    private lightLayer?: L.TileLayer;
    private darkLayer?: L.TileLayer;

    ngOnInit() {

        if (this.cookieService.get('darkMode') === 'true') {
            this.darkModeService.enableDarkMode();
        }
        this.subscriber = this.darkModeService.darkMode$.subscribe(enabled => {
            const content = document.querySelector('.website-container');

            if (enabled) {
                document.body.classList.add('dark-mode');
                if (content) content.classList.add('dark-mode');
                this.cookieService.set('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                if (content) content.classList.remove('dark-mode');
                this.cookieService.set('darkMode', 'false');
            }

            setTimeout(() => this.map?.invalidateSize(), 100);

        });
        
    }

    ngAfterViewInit() {
        this.initMap();
    }

    private initMap(): void {
        (L.Icon.Default as any).mergeOptions({
            iconRetinaUrl: '/assets/leaflet-images/marker-icon-2x.png',
            iconUrl: '/assets/leaflet-images/marker-icon.png',
            shadowUrl: '/assets/leaflet-images/marker-shadow.png'
        });

        this.map = L.map('map', { center: [54.0, -2.0], zoom: 5 });

        this.lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        });

        this.darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap & CartoDB'
        });

        this.setTileLayer(this.darkModeService.isDarkModeEnabled());

        this.map.whenReady(() => this.map!.invalidateSize());

        setTimeout(() => this.map?.invalidateSize(), 200);
    }

    private setTileLayer(dark: boolean) {
        if (!this.map) return;
        if (dark) {
            if (this.lightLayer && this.map.hasLayer(this.lightLayer)) this.map.removeLayer(this.lightLayer);
            if (this.darkLayer && !this.map.hasLayer(this.darkLayer)) this.darkLayer.addTo(this.map);
        } else {
            if (this.darkLayer && this.map.hasLayer(this.darkLayer)) this.map.removeLayer(this.darkLayer);
            if (this.lightLayer && !this.map.hasLayer(this.lightLayer)) this.lightLayer.addTo(this.map);
        }
    }
    
    ngOnDestroy() {
        this.subscriber?.unsubscribe();
        if (this.map) {
            this.map.remove();
        }
    }

}