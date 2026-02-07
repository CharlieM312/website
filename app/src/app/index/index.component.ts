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
    private london_markers: L.Marker[] = [];
    private scottish_markers: L.Marker[] = [];
    private belfast_markers: L.Marker[] = [];
    private other_uk_markers: L.Marker[] = [];
    private lightLayer?: L.TileLayer;
    private darkLayer?: L.TileLayer;
    londonAirportsVisible: boolean = true;
    englishAirportsVisible: boolean = true;
    scottishAirportsVisible: boolean = true;
    belfastAirportsVisible: boolean = true;

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
        const iconDefault = L.icon({
            iconRetinaUrl: 'assets/leaflet-images/marker-icon-2x.png',
            iconUrl: 'assets/leaflet-images/marker-icon.png',
            shadowUrl: 'assets/leaflet-images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        L.Marker.prototype.options.icon = iconDefault;

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

    toggleLondonAirports(){
        // Logic to toggle London airports on the map
        if(!this.londonAirportsVisible){
            this.london_markers.forEach(marker => {
                this.map?.removeLayer(marker);
            });
        } else {
            this.london_markers.forEach(marker => {
                marker.addTo(this.map!);
            });
        }

        this.map?.eachLayer(layer => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((layer as any).redraw) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).redraw();
            }
        });

        setTimeout(() => this.map?.invalidateSize(true), 200);
    }

    toggleScottishAirports(){
        if (!this.scottishAirportsVisible){
            this.scottish_markers.forEach(marker => {
                this.map?.removeLayer(marker);
            });
        } else {
            this.scottish_markers.forEach(marker => {
                marker.addTo(this.map!);
            });
        }

        this.map?.eachLayer(layer => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((layer as any).redraw) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (layer as any).redraw();
            }
        });

        setTimeout(() => this.map?.invalidateSize(true), 200);

    }

    toggleBelfastAirports(){
        if (!this.belfastAirportsVisible){
            this.belfast_markers.forEach(marker => {
                this.map?.removeLayer(marker);
            });
        } else {
            this.belfast_markers.forEach(marker => {
                marker.addTo(this.map!);
            });
        }
    }

    toggleEnglishAirports(){
        if (!this.englishAirportsVisible){
            this.other_uk_markers.forEach(marker => {
                this.map?.removeLayer(marker);
            });
        } else {
            this.other_uk_markers.forEach(marker => {
                marker.addTo(this.map!);
            });
        }
    }

    private addAirports(){
        // London Airports
        this.london_markers.push(L.marker([51.4706, -0.4619]).bindPopup('Heathrow').addTo(this.map!));
        this.london_markers.push(L.marker([51.1481, -0.1903]).bindPopup('Gatwick').addTo(this.map!));
        this.london_markers.push(L.marker([51.5053, 0.0553]).bindPopup('London City').addTo(this.map!));
        // Other airports
        this.other_uk_markers.push(L.marker([52.4539, 1.7486]).bindPopup('Norwich').addTo(this.map!));
        this.other_uk_markers.push(L.marker([53.8656, -1.6606]).bindPopup('Leeds Bradford').addTo(this.map!));
        this.other_uk_markers.push(L.marker([53.3537, -2.2746]).bindPopup('Manchester').addTo(this.map!));
        this.other_uk_markers.push(L.marker([55.0375, -1.6917]).bindPopup('Newcastle').addTo(this.map!));
        this.other_uk_markers.push(L.marker([52.4539, -1.748]).bindPopup('Birmingham').addTo(this.map!));
        this.other_uk_markers.push(L.marker([51.8850, 0.2350]).bindPopup('Stansted').addTo(this.map!));
        this.other_uk_markers.push(L.marker([51.8747, -0.3683]).bindPopup('Luton').addTo(this.map!));
        this.other_uk_markers.push(L.marker([53.3336, -2.8947]).bindPopup('Liverpool').addTo(this.map!));
        // Ireland Airports
        L.marker([53.3537, -6.2489]).bindPopup('Dublin').addTo(this.map!);
        L.marker([53.4213, -8.9248]).bindPopup('Shannon').addTo(this.map!);
        // Belfast Airports
        this.belfast_markers.push(L.marker([54.6186, -5.8724]).bindPopup('Belfast City').addTo(this.map!));
        this.belfast_markers.push(L.marker([54.6575, -6.2158]).bindPopup('Belfast International').addTo(this.map!));
        // Scotland Airports
        this.scottish_markers.push(L.marker([57.1217, -2.2426]).bindPopup('Aberdeen').addTo(this.map!));
        this.scottish_markers.push(L.marker([55.8719, -4.4331]).bindPopup('Glasgow').addTo(this.map!));
        this.scottish_markers.push(L.marker([55.9500, -3.3725]).bindPopup('Edinburgh').addTo(this.map!));
        this.scottish_markers.push(L.marker([57.5425, -4.0475]).bindPopup('Inverness').addTo(this.map!));
        this.scottish_markers.push(L.marker([56.4525, -3.0258]).bindPopup('Dundee').addTo(this.map!));
        this.scottish_markers.push(L.marker([59.881, -1.3000]).bindPopup('Sumburgh').addTo(this.map!));
        this.scottish_markers.push(L.marker([58.958, -2.9450]).bindPopup('Kirkwall').addTo(this.map!));
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