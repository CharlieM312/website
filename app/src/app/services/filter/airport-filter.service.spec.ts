/// <reference types="jest" />

import { TestBed } from '@angular/core/testing';
import {
  AirportFilterService,
  AirportFilterState
} from './airport-filter.service';

describe('AirportFilterService', () => {
  let service: AirportFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AirportFilterService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should provide all filters enabled initially', () => {
    let filters: AirportFilterState | undefined;

    service.filters$.subscribe(value => {
      filters = value;
    }).unsubscribe();

    expect(filters).toEqual({
      london: true,
      english: true,
      scottish: true,
      isleOfMan: true,
      northernIrish: true,
      irish: true
    });
  });

  it.each([
    'london',
    'english',
    'scottish',
    'isleOfMan',
    'northernIrish',
    'irish'
  ] as const)('should disable the %s filter', filter => {
    service.setFilter(filter, false);

    let filters: AirportFilterState | undefined;

    service.filters$.subscribe(value => {
      filters = value;
    }).unsubscribe();

    expect(filters?.[filter]).toBe(false);
  });

  it('should preserve the other filter values', () => {
    service.setFilter('london', false);

    let filters: AirportFilterState | undefined;

    service.filters$.subscribe(value => {
      filters = value;
    }).unsubscribe();

    expect(filters?.london).toBe(false);
    expect(filters?.english).toBe(true);
    expect(filters?.scottish).toBe(true);
  });
});