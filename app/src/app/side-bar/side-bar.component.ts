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

    this.isIndexPage = this.isHomeRoute(this.router.url);
    this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
        this.isIndexPage = this.isHomeRoute(this.router.url);
        });
    }

    private isHomeRoute(url: string): boolean {
        const tree = this.router.parseUrl(url);
        const segments = tree.root.children['primary']?.segments ?? [];
        const path = `/${segments.map(segment => segment.path).join('/')}`;
        return path === '/' || path === '/index';
    }

}