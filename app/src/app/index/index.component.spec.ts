/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndexComponent } from './index.component';
import { AppModule } from '../app.module';
import { AirportFilterService } from '../services/filter/airport-filter.service';

describe('IndexComponent', () => {
  let component: IndexComponent;
  let fixture: ComponentFixture<IndexComponent>;
  let mockCookieService: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndexComponent],
      imports: [AppModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();

    mockCookieService = {
      get: jest.fn(),
      set: jest.fn()
    };
    mockCookieService.get.mockReturnValue('true');
  });

  it('should display header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should display map container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#map')).toBeTruthy();
  });

  it('should update when the London filter changes', () => {
    const filterService = TestBed.inject(AirportFilterService);

    filterService.setFilter('london', false);
    fixture.detectChanges();

    expect(component.londonAirportsVisible).toBe(false);
  });

  it('should update when the Scottish filter changes', () => {
    const filterService = TestBed.inject(AirportFilterService);

    filterService.setFilter('scottish', false);
    fixture.detectChanges();

    expect(component.scottishAirportsVisible).toBe(false);
  });

  it('should update when the English filter changes', () => {
    const filterService = TestBed.inject(AirportFilterService);

    filterService.setFilter('english', false);
    fixture.detectChanges();

    expect(component.englishAirportsVisible).toBe(false);
  });

  it('should update when the Isle of Man filter changes', () => {
    const filterService = TestBed.inject(AirportFilterService);

    filterService.setFilter('isleOfMan', false);
    fixture.detectChanges();

    expect(component.isleOfManAirportsVisible).toBe(false);
  });

  it('should update when the Northern Irish filter changes', () => {
    const filterService = TestBed.inject(AirportFilterService);

    filterService.setFilter('northernIrish', false);
    fixture.detectChanges();

    expect(component.northernIrishAirportsVisible).toBe(false);
  });

  it('should update when the Irish filter changes', () => {
    const filterService = TestBed.inject(AirportFilterService);

    filterService.setFilter('irish', false);
    fixture.detectChanges();

    expect(component.irishAirportsVisible).toBe(false);
  });

});
