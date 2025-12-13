import { defineConfig } from 'vitest/config';
import '@angular/compiler';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    setupFiles: 'src/test-setup.ts',
    threads: false,
    deps: {
      inline: [
        '@angular/core',
        '@angular/common',
        '@angular/common/http',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        '@angular/platform-browser/testing',
        '@angular/forms',
        '@angular/router',
        '@angular/animations',
        '@angular/compiler',
        'rxjs',
        'ngx-cookie-service'
      ]
    }
  },
  optimizeDeps: {
    include: [
      '@angular/core',
      '@angular/common',
      '@angular/platform-browser'
    ]
  }
});