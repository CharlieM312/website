import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing-module';
import { IndexComponent } from './index/index.component';
import { HeaderComponent } from './header/header.component';
import { AboutComponent } from './about/about.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { LayoutComponent } from './layout/layout.component';
import { SettingsComponent } from './settings/settings.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    declarations: [AppComponent, IndexComponent, HeaderComponent, AboutComponent, SideBarComponent, LayoutComponent, SettingsComponent],
    imports: [BrowserModule, AppRoutingModule, FormsModule],
    bootstrap: [AppComponent]
})
export class AppModule { }
