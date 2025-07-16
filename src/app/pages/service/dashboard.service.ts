import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StaticAppConfig } from './config.service';

export interface DashboardSummary {
    total_invoices: number;
    total_companies: number;
    total_paid_amount: number;
    total_outstanding: number;
    current_period_invoices: number;
    current_period_revenue: number;
    current_period_payments: number;
}

export interface RecentInvoice {
    id: number;
    invoice_number: string;
    company_name: string;
    total_amount: number;
    invoice_date: string;
    outstanding_balance: number;
}

export interface RecentPayment {
    id: number;
    company_name: string;
    total_amount: number;
    payment_date: string;
    cheque_number: string;
    invoice_count: number;
}

export interface MonthlyRevenue {
    month: string;
    revenue: number;
}

export interface TopCompany {
    id: number;
    name: string;
    total_revenue: number;
    invoice_count: number;
}

export interface PaymentMethod {
    method: string;
    count: number;
    total_amount: number;
}

export interface OutstandingByAge {
    age_group: string;
    count: number;
    outstanding_amount: number;
}

export interface DashboardStats {
    summary: DashboardSummary;
    recent_activities: {
        invoices: RecentInvoice[];
        payments: RecentPayment[];
    };
    charts: {
        monthly_revenue: MonthlyRevenue[];
        top_companies: TopCompany[];
        payment_methods: PaymentMethod[];
        outstanding_by_age: OutstandingByAge[];
    };
}

export interface QuickStats {
    today: {
        invoices: number;
        revenue: number;
        payments: number;
    };
    growth: {
        invoice_growth: number;
        revenue_growth: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = StaticAppConfig.get('apiBaseUrl');

    constructor(private http: HttpClient) {}

    getDashboardStats(startDate?: string, endDate?: string): Observable<DashboardStats> {
        let params = '';
        if (startDate && endDate) {
            params = `?start_date=${startDate}&end_date=${endDate}`;
        }
        return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats${params}`);
    }

    getQuickStats(): Observable<QuickStats> {
        return this.http.get<QuickStats>(`${this.apiUrl}/dashboard/quick-stats`);
    }
}
