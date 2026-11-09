import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
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
export class AirportFiltersComponent implements OnInit, OnDestroy {
  filters: AirportFilterState = {
    london: true,
    english: true,
    scottish: true,
    isleOfMan: true,
    northernIrish: true,
    irish: true
  };

  private subscription = new Subscription();

  constructor(private airportFilterService: AirportFilterService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.airportFilterService.filters$.subscribe(filters => {
        this.filters = { ...filters };
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  updateFilter(
    filter: keyof AirportFilterState,
    event: Event
  ): void {
    const visible = (event.target as HTMLInputElement).checked;
    this.airportFilterService.setFilter(filter, visible);
  }
}