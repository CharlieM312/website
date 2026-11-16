import { CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AirportFiltersComponent } from './airport-filters/airport-filters.component';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing-module';
import { ContributionsComponent } from './contributions/contributions.component';
import { IndexComponent } from './index/index.component';
import { HeaderComponent } from './header/header.component';
import { AboutComponent } from './about/about.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { LayoutComponent } from './layout/layout.component';
import { SettingsComponent } from './settings/settings.component';
import { TrackerComponent } from './tracker/tracker.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [AppComponent, IndexComponent, HeaderComponent, AboutComponent, SideBarComponent, LayoutComponent, SettingsComponent, ContributionsComponent, AirportFiltersComponent, TrackerComponent, PrivacyComponent],
    imports: [BrowserModule, AppRoutingModule, FormsModule],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
