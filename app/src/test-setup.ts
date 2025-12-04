import '@angular/compiler';

import 'zone.js';                 // if not already imported
import 'zone.js/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { getTestBed } from '@angular/core/testing';
import { ResourceLoader } from '@angular/compiler';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
  { teardown: { destroyAfterEach: true } }
);

class FakeResourceLoader {
  get(_url: string): string | Promise<string> { return ''; }
}
getTestBed().configureCompiler({
  providers: [{ provide: ResourceLoader as any, useClass: FakeResourceLoader }]
});

