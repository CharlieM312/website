import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { AboutComponent } from './about/about.component';
import { LayoutComponent } from './layout/layout.component';
import { SettingsComponent } from './settings/settings.component';
import { ContributionsComponent } from './contributions/contributions.component';
import { TrackerComponent } from './tracker/tracker.component';
import { PrivacyComponent } from './privacy/privacy.component';

const routes: Routes = [
    { path: '', component: LayoutComponent,
        children: [
            { path: 'about', component: AboutComponent},
            { path: 'contributions', component: ContributionsComponent },
            { path: 'tracker', component: TrackerComponent },
            { path: 'privacy', component: PrivacyComponent },
            { path: 'settings', component: SettingsComponent},
            { path: '', component: IndexComponent}
        ] 
     },
    { path: 'index', redirectTo: '', pathMatch: 'full' },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }