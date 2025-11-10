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
    englishAirportsVisible: boolean = true;

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
            iconRetinaUrl: 'assets/leaflet-images/marker-icon-2x.png',
            iconUrl: 'assets/leaflet-images/marker-icon.png',
            shadowUrl: 'assets/leaflet-images/marker-shadow.png'
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

        this.addAirports();
    }

    toggleEnglishAirports(){
        // Logic to toggle English airports on the map
    }

    private addAirports(){
        // London Airports
        L.marker([51.4706, -0.4619]).bindPopup('Heathrow').addTo(this.map!);
        this.map!.setView([51.4706, -0.4619], 7);
        L.marker([51.1481, -0.1903]).bindPopup('Gatwick').addTo(this.map!);
        L.marker([51.5053, 0.0553]).bindPopup('London City').addTo(this.map!);
        // Other airports
        L.marker([52.4539, 1.7486]).bindPopup('Norwich').addTo(this.map!);
        L.marker([53.3807, -1.4701]).bindPopup('Leeds Bradford').addTo(this.map!);
        L.marker([53.3537, -2.2746]).bindPopup('Manchester').addTo(this.map!);
        // Ireland Airports
        L.marker([53.3537, -6.2489]).bindPopup('Dublin').addTo(this.map!);
        L.marker([53.4213, -6.2701]).bindPopup('Shannon').addTo(this.map!);
        L.marker([55.0375, -1.6917]).bindPopup('Newcastle').addTo(this.map!);
        // Scotland Airports
        L.marker([57.1217, -2.2426]).bindPopup('Aberdeen').addTo(this.map!);
        L.marker([55.8719, -4.4331]).bindPopup('Glasgow').addTo(this.map!);
        L.marker([55.9500, -3.3725]).bindPopup('Edinburgh').addTo(this.map!);
        // Welsh Airports
        L.marker([51.3969, -3.3434]).bindPopup('Cardiff').addTo(this.map!);

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