import { Injectable } from '@angular/core';
import { StaticAppConfig } from './config.service';
import { HttpClient } from '@angular/common/http';
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

    submitMultiplePayments(formData: FormData) {
        return this.http.post(this.baseUrl + '/invoice-payments/multiple', formData);
    }
}
