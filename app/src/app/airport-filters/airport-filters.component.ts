import { Component } from '@angular/core';
import {
  AirportFilterService,
  AirportFilterState
} from '../services/filter/airport-filter.service';

@Component({
  selector: 'app-airport-filters',
  templateUrl: './airport-filters.component.html',
  styleUrls: ['./airport-filters.component.scss'],
  standalone: false
})
export class AirportFiltersComponent {
  filters: AirportFilterState = {
    london: true,
    english: true,
    scottish: true,
    isleOfMan: true,
    northernIrish: true,
    irish: true
  };

  constructor(private airportFilterService: AirportFilterService) {}

  updateFilter(
    filter: keyof AirportFilterState,
    event: Event
  ): void {
    const visible = (event.target as HTMLInputElement).checked;
    this.airportFilterService.setFilter(filter, visible);
  }
}