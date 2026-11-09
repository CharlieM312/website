import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AirportFilterState {
  london: boolean;
  english: boolean;
  scottish: boolean;
  isleOfMan: boolean;
  northernIrish: boolean;
  irish: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AirportFilterService {
  constructor() { }
  private filters = new BehaviorSubject<AirportFilterState>({
    london: true,
    english: true,
    scottish: true,
    isleOfMan: true,
    northernIrish: true,
    irish: true
  });

  readonly filters$ = this.filters.asObservable();

  setFilter(filter: keyof AirportFilterState, visible: boolean): void {
    this.filters.next({
      ...this.filters.value,
      [filter]: visible
    });
  }
}