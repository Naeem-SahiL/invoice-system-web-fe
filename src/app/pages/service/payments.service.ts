import { Injectable } from '@angular/core';
import { StaticAppConfig } from './config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
    baseUrl = StaticAppConfig.get('apiBaseUrl');

  constructor(private  http: HttpClient) { }

    public getPayments(params): Observable<any> {
       return this.http.get(this.baseUrl + '/invoice-payments', {
           params: params
       });
    }

    updatePayment(payment: any) {
        return this.http.put(this.baseUrl + '/invoice-payments/' + payment.id, payment);
    }

    deletePayment(payment) {
        return this.http.delete(this.baseUrl + '/invoice-payments/' + payment.id, payment);
    }

    getOutstandingInvoices(params:any): Observable<any> {
        return this.http.get(this.baseUrl + '/invoices/outstanding', {
            params
        });
    }
    getLegderInvoices(params:any): Observable<any> {
        return this.http.get(this.baseUrl + '/invoices/ledger', {
            params
        });
    }
    getVat(params:any): Observable<any> {
        return this.http.get(this.baseUrl + '/invoices/vat', {
            params
        });
    }
    downloadVatReport(params:any): Observable<any> {
        return this.http.get(this.baseUrl + '/vat-report', {
            params,
            responseType: 'blob' as 'json',
             headers: new HttpHeaders({
                'Accept': 'application/json+pdf'
            })
        });
    }
    downloadOutstandingReport(params:any): Observable<any> {
        return this.http.get(this.baseUrl + '/outstanding-report', {
            params,
            responseType: 'blob' as 'json',
             headers: new HttpHeaders({
                'Accept': 'application/json+pdf'
            })
        });
    }
    downloadLedgerReport(params:any): Observable<any> {
        return this.http.get(this.baseUrl + '/ledger-report', {
            params,
            responseType: 'blob' as 'json',
             headers: new HttpHeaders({
                'Accept': 'application/json+pdf'
            })
        });
    }

    submitMultiplePayments(formData: FormData) {
        return this.http.post(this.baseUrl + '/invoice-payments/multiple', formData);
    }

    updateChequePayment(id: number, formData: FormData) {
        console.log('=== PAYMENT SERVICE UPDATE ===', {
            id,
            url: this.baseUrl + '/invoice-payments/multiple/' + id,
            formData: formData
        });
        return this.http.post(this.baseUrl + '/invoice-payments/multiple/' + id, formData);
    }

    getPayment(id) {
        return this.http.get(this.baseUrl + '/invoice-payments/' + id);
    }
}
