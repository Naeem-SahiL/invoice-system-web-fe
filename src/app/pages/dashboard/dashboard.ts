import { Component } from '@angular/core';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { TagModule } from 'primeng/tag';

@Component({
    selector: 'app-dashboard',
    imports: [TagModule],
    template: `
        <!-- <div class="grid grid-cols-12 gap-8"> -->
        <!-- <app-stats-widget class="contents" />
            <div class="col-span-12 xl:col-span-6">
                <app-recent-sales-widget />
                <app-best-selling-widget />
            </div>
            <div class="col-span-12 xl:col-span-6">
                <app-revenue-stream-widget />
                <app-notifications-widget />
            </div> -->
        <div class="flex flex-col items-center justify-center h-[70vh] text-center p-6 gap-4 border border-dashed border-surface-300 rounded-lg shadow-sm">
            <i class="pi pi-cog pi-spin text-4xl text-primary-500"></i>
            <h2 class="text-2xl font-semibold text-surface-700">Site Under Development</h2>
            <p class="text-surface-500 max-w-xl">We’re working hard to bring you an awesome experience. This section is currently under construction. Check back soon!</p>
            <p-tag value="In Progress" severity="warning" rounded></p-tag>
        </div>

        <!-- </div> -->
    `
})
export class Dashboard {}
