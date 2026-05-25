/// <reference types="jest" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndexComponent } from './index.component';
import { AppModule } from '../app.module';

describe('IndexComponent', () => {
  let component: IndexComponent;
  let fixture: ComponentFixture<IndexComponent>;

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
  });

  it('should display header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should display map container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#map')).toBeTruthy();
  });

  it('should hide and show London airports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#londonAirports') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.londonAirportsVisible).toBe(false);
    checkbox.click();
    fixture.detectChanges();
    expect(component.londonAirportsVisible).toBe(true);
  });

  it('should hide and show English airports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#englishAirports') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.englishAirportsVisible).toBe(false);
    checkbox.click();
    fixture.detectChanges();
    expect(component.englishAirportsVisible).toBe(true);
  });

  it('should hide and show Scottish airports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#scottishAirports') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.scottishAirportsVisible).toBe(false);
    checkbox.click();
    fixture.detectChanges();
    expect(component.scottishAirportsVisible).toBe(true);
  });

  it('should hide and show Northern Irish airports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#northernIrishAirports') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.northernIrishAirportsVisible).toBe(false);
    checkbox.click();
    fixture.detectChanges();
    expect(component.northernIrishAirportsVisible).toBe(true);
  });

  it('should hide and show Irish airports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#irishAirports') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.irishAirportsVisible).toBe(false);
    checkbox.click();
    fixture.detectChanges();
    expect(component.irishAirportsVisible).toBe(true);
  });

  it('should hide and show Isle of Man airports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const checkbox = element.querySelector('#isleOfManAirports') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(component.isleOfManAirportsVisible).toBe(false);
    checkbox.click();
    fixture.detectChanges();
    expect(component.isleOfManAirportsVisible).toBe(true);
  });
});
