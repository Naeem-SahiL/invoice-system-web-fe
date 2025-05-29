import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';
import { StaticAppConfig } from './app/pages/service/config.service';
import { provideHttpClient } from '@angular/common/http';


fetch('/assets/config.json')
  .then((res) => res.json())
  .then((config) => {
    StaticAppConfig.load(config);
    return bootstrapApplication(AppComponent, appConfig);
  })
  .catch((err) => console.error('Error loading runtime config:', err));

// bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
