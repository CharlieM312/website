import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IndexComponent } from './index.component';

describe('IndexComponent', () => {
  let component: IndexComponent;
  let fixture: ComponentFixture<IndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndexComponent]
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
    component.englishAirportsVisible = false;
    component.toggleLondonAirports();
    expect(component.englishAirportsVisible).toBe(false);
  });

  it('should hide and show Scottish airports', () => {
    component.scottishAirportsVisible = false;
    component.toggleScottishAirports();
    expect(component.scottishAirportsVisible).toBe(false);
  });
});
