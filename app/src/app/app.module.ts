import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing-module';
import { IndexComponent } from './index/index.component';
import { HeaderComponent } from './header/header.component';
import { AboutComponent } from './about/about.component';

@NgModule({
    declarations: [AppComponent, IndexComponent, HeaderComponent, AboutComponent],
    imports: [BrowserModule, AppRoutingModule],
    bootstrap: [AppComponent]
})
export class AppModule { }
