import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StaticAppConfig } from './config.service';
import { Observable } from 'rxjs';

interface InventoryStatus {
    label: string;
    value: string;
}

export interface Product {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    price?: number;
    quantity?: number;
    inventoryStatus?: string;
    category?: string;
    image?: string;
    rating?: number;
}

export interface Company {
    id?: string;
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    vat_no?: string;
}

@Injectable()
export class CompaniesService {
    private apiBaseUrl = StaticAppConfig.get('apiBaseUrl');
    private apiUrl = `${this.apiBaseUrl}/companies`;

    constructor(private http: HttpClient) {}

    getCompaniesData(): Observable<Company[]> {
        return this.http.get<Company[]>(this.apiUrl);
    }

    addCompany(company: Company): Observable<Company> {
        return this.http.post<Company>(this.apiUrl, company);
    }

    updateCompany(company: Company): Observable<Company> {
        return this.http.put<Company>(`${this.apiUrl}/${company.id}`, company);
    }

    deleteCompany(companyId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${companyId}`);
    }

    deleteSelectedCompanies(payload: {ids: any[]}): Observable<void> {
        return this.http.delete<void>( `${this.apiUrl}/deleteByIds`, { body: payload });
    }

}
