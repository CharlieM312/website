import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routing-module';
import { IndexComponent } from './index/index.component';
import { HeaderComponent } from './header/header.component';

@NgModule({
    declarations: [AppComponent, IndexComponent, HeaderComponent],
    imports: [BrowserModule, AppRoutingModule],
    bootstrap: [AppComponent]
})
export class AppModule { }
