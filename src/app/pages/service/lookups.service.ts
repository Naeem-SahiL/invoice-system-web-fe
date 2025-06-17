import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StaticAppConfig } from './config.service';
import { LookupModel } from './services.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LookupsService {

  constructor(
      private http: HttpClient
  ) { }

    getLookupBytype(type: string): Observable<LookupModel[]> {
        return this.http.get<LookupModel[]>(StaticAppConfig.get('apiBaseUrl') + '/lookups/' + type);
    }
}
