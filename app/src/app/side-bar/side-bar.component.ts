import {Component} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/internal/operators/filter';

@Component({
    selector: 'side-bar',
    templateUrl: './side-bar.component.html',
    styleUrls: ['./side-bar.component.scss'],
    standalone: false
})

export class SideBarComponent {

    isIndexPage = false;

    constructor(private router: Router) {

    this.isIndexPage = this.router.url === '/';
    this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
        this.isIndexPage =
            this.router.url === '/' || this.router.url === '/index';
        });
    }

}