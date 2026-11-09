/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AirportFiltersComponent } from './airport-filters.component';
import { AirportFilterService } from '../services/filter/airport-filter.service';

describe('AirportFiltersComponent', () => {
  let fixture: ComponentFixture<AirportFiltersComponent>;
  let service: AirportFilterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AirportFiltersComponent],
      providers: [AirportFilterService]
    }).compileComponents();

    fixture = TestBed.createComponent(AirportFiltersComponent);
    service = TestBed.inject(AirportFilterService);
    fixture.detectChanges();
  });

  it.each([
  ['londonAirports', 'london'],
  ['englishAirports', 'english'],
  ['scottishAirports', 'scottish'],
  ['isleOfManAirports', 'isleOfMan'],
  ['northernIrishAirports', 'northernIrish'],
  ['irishAirports', 'irish']
] as const)('should update the %s filter', (id, filter) => {
  const checkbox = fixture.nativeElement.querySelector(
    `#${id}`
  ) as HTMLInputElement;

  expect(checkbox).not.toBeNull();

  checkbox!.checked = false;
  checkbox!.dispatchEvent(new Event('change'));

  let filters;
  service.filters$.subscribe(value => filters = value).unsubscribe();

  expect(filters![filter]).toBe(false);
});

it('should uncheck the London airports checkbox', () => {
  const checkbox = fixture.nativeElement.querySelector(
    '#londonAirports'
  ) as HTMLInputElement;

  checkbox.checked = false;
  checkbox.dispatchEvent(new Event('change'));
  fixture.detectChanges();

  expect(checkbox.checked).toBe(false);
});

});