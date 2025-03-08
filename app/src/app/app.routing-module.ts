import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent } from './index/index.component';
import { AppComponent } from './app.component';

const routes: Routes = [
    { path: '', component: IndexComponent },
    { path: 'index', component: IndexComponent },
    { path: 'app' , component: AppComponent },
    { path: '**', component: IndexComponent }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }