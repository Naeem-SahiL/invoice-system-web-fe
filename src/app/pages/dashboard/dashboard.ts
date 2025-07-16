import { Component } from '@angular/core';
import { InvoiceStatsWidget } from './components/invoicestatswidget';
import { TagModule } from 'primeng/tag';
import { PermissionService } from '../service/permission.service';

@Component({
    selector: 'app-dashboard',
    imports: [TagModule, InvoiceStatsWidget],
    template: `
        <div class="grid grid-cols-12 gap-6">
            <div class="col-span-12 mb-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-semibold text-surface-900 dark:text-surface-0 m-0">Invoice Management Dashboard</h2>
                    <p-tag value="Live Data" severity="success" rounded></p-tag>
                </div>
            </div>

            <app-invoice-stats-widget class="contents" />
        </div>
    `
})
export class Dashboard {
    constructor(public permissionService: PermissionService) {}
}
