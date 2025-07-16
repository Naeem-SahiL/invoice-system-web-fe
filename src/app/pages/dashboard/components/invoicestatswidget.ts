import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SkeletonModule } from 'primeng/skeleton';
import { StaticAppConfig } from '../../service/config.service';
import { DashboardService, DashboardStats, QuickStats } from '../../service/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-invoice-stats-widget',
    imports: [CommonModule, SkeletonModule],
    template: `
        <!-- Total Invoices -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Invoices</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                            <p-skeleton *ngIf="loading" width="4rem" height="1.5rem"></p-skeleton>
                            <span *ngIf="!loading">{{ stats?.summary?.total_invoices || 0 }}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-file-o text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ stats?.summary?.current_period_invoices || 0 }} </span>
                <span class="text-muted-color">this month</span>
            </div>
        </div>

        <!-- Total Revenue -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Revenue</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                            <p-skeleton *ngIf="loading" width="5rem" height="1.5rem"></p-skeleton>
                            <span *ngIf="!loading">{{ getTotalRevenue() | number:'1.2-2' }} OMR</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ (stats?.summary?.current_period_revenue || 0) | number:'1.2-2' }} OMR </span>
                <span class="text-muted-color">this month</span>
            </div>
        </div>

        <!-- Active Companies -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Active Companies</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                            <p-skeleton *ngIf="loading" width="3rem" height="1.5rem"></p-skeleton>
                            <span *ngIf="!loading">{{ stats?.summary?.total_companies || 0 }}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-building text-cyan-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ (stats?.summary?.total_paid_amount || 0) | number:'1.2-2' }} OMR </span>
                <span class="text-muted-color">total paid</span>
            </div>
        </div>

        <!-- Outstanding Balance -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Outstanding</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
                            <p-skeleton *ngIf="loading" width="5rem" height="1.5rem"></p-skeleton>
                            <span *ngIf="!loading">{{ (stats?.summary?.total_outstanding || 0) | number:'1.2-2' }} OMR</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-exclamation-triangle text-red-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ getOutstandingPercentage() }}% </span>
                <span class="text-muted-color">of total revenue</span>
            </div>
        </div>
    `
})
export class InvoiceStatsWidget implements OnInit {
    stats: DashboardStats | null = null;
    quickStats: QuickStats | null = null;
    loading = true;

    constructor(private dashboardService: DashboardService) {}

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.loading = true;

        // Use current month as default
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        this.dashboardService.getDashboardStats(startDateStr, endDateStr).subscribe({
            next: (data) => {
                this.stats = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading dashboard stats:', error);
                this.loading = false;
            }
        });

        this.dashboardService.getQuickStats().subscribe({
            next: (data) => {
                this.quickStats = data;
            },
            error: (error) => {
                console.error('Error loading quick stats:', error);
            }
        });
    }

    getTotalRevenue(): number {
        if (!this.stats?.summary) return 0;
        return this.stats.summary.current_period_revenue || 0;
    }

    getOutstandingPercentage(): number {
        if (!this.stats?.summary) return 0;
        const totalRevenue = this.getTotalRevenue();
        if (totalRevenue === 0) return 0;
        return Math.round((this.stats.summary.total_outstanding / totalRevenue) * 100);
    }
}
