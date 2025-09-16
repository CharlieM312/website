import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { AboutComponent } from './about/about.component';
import { LayoutComponent } from './layout/layout.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
    { path: '', component: LayoutComponent,
        children: [
            { path: 'about', component: AboutComponent},
            { path: 'settings', component: SettingsComponent},
            { path: '', component: IndexComponent}
        ] 
     },
    { path: 'index', component: IndexComponent },
    { path: '**', component: IndexComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }