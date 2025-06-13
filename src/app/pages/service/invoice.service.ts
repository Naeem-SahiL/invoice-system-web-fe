import { Injectable } from '@angular/core';
import { StaticAppConfig } from './config.service';
import { Company } from './companies.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ServiceItem } from './services.service';

export interface Invoice {
    id?: number;
    invoice_number?: string;
    company_id?: number;
    remarks?: string | null;
    invoice_date?: string;
    gross_amount?: string;
    vat_amount?: string;
    total_amount?: string;
    amount_in_words?: string | null;
    created_at?: string;
    updated_at?: string;
    groups?: InvoiceGroup[];
    company?: Company
}

export interface InvoiceGroup {
    id: number;
    title: string;
    customerInvoiceNo: string;
    blNo: string;
    declarationNo: string;
    items: InvoiceItem[];
    srNo: string;
}



export interface InvoiceItem {
    id?: number;
    temp_id?: string;
    invoice_id?: number;
    service_id?: number;
    sr_no_group?: number | null;
    service: ServiceItem | null;
    description?: string;
    quantity?: number;
    rate?: number;
    amount?: number;
    vat_amount?: number;
    total_amount?: number;
    bayan_dec_no?: string | null;
    invoice_ref_no?: string | null;
    service_group?: string | null;
    created_at?: string;
    updated_at?: string;

}
@Injectable({
    providedIn: 'root'
})
export class InvoiceService {

    private apiUrl = StaticAppConfig.get('apiBaseUrl') + '/invoices';
    constructor(private http: HttpClient) {}

    getInvoiceData(params): Observable<any> {
        return this.http.get<Invoice[]>(this.apiUrl, { params });
    }

    getInvoiceById(id: string):Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    updateInvoice(invoice: Invoice): Observable<Invoice> {
        return this.http.put<Invoice>(`${this.apiUrl}/${invoice.id}`, invoice);
    }

    createInvoice(invoice: Invoice): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, invoice);
    }

    deleteInvoice(invoice: Invoice): Observable<Invoice> {
        return this.http.delete<Invoice>(`${this.apiUrl}/${invoice.id}`);
    }

    deleteSelectedInvoices(payload: {ids: any[]}): Observable<void> {
        return this.http.delete<void>( `${this.apiUrl}/deleteByIds`, { body: payload });
    }
}
