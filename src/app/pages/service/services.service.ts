import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StaticAppConfig } from './config.service';
import { Observable } from 'rxjs';

export interface ServiceItem {
    id?: string;
    name?: string;
    description?: string;
    rate?: number;
    vat_percentage?: number;
    service_type_id?: number;
    active?: number;
    service_type: LookupModel;
}
// 'lookup_type', 'hidden_value', 'visible_value', 'active'
export interface LookupModel {
    id?: number;
    lookup_type?: string;
    hidden_value?: string;
    visible_value?: string;
    active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

    private apiUrl = StaticAppConfig.get('apiBaseUrl') + '/services';
    constructor(private http: HttpClient) {}

    // get service_type lookup
    getServiceTypeLookup(): Observable<LookupModel[]> {
        return this.http.get<LookupModel[]>(StaticAppConfig.get('apiBaseUrl') + '/lookups/service_type');
    }

    getServicesData(): Observable<ServiceItem[]> {
        return this.http.get<ServiceItem[]>(this.apiUrl);
    }

    updateService(service: ServiceItem):Observable<ServiceItem> {
        return this.http.put<ServiceItem>(`${this.apiUrl}/${service.id}`, service);
    }

    addService(service:ServiceItem):Observable<ServiceItem> {
        return this.http.post<ServiceItem>(this.apiUrl, service);
    }

    deleteService(service: ServiceItem): Observable<ServiceItem> {
        return this.http.delete<ServiceItem>(`${this.apiUrl}/${service.id}`);
    }

    deleteSelectedServices(payload: {ids: any[]}): Observable<void> {
        return this.http.delete<void>( `${this.apiUrl}/deleteByIds`, { body: payload });
    }
}
