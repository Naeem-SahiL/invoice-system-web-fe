import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import {
    Companies,
    CompanyPayments,
    Invoices, LedgerInvoices,
    OutstandingInvoices, Roles,
    Services, Users,
    VatReport
} from '../../shared/Permissions';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {

        this.model = [
            {
                label: 'Home',
                permission: Companies.VIEW,
                items: [
                    {
                        label: 'Dashboard',
                        permission: Companies.VIEW,
                        icon: 'pi pi-fw pi-home',
                        routerLink: ['/']
                    }
                ]
            },
            {
                label: 'Master',
                permission: [Companies.VIEW, Services.VIEW],
                items: [
                    { label: 'Companies', icon: 'pi pi-fw pi-home', routerLink: ['/pages/companies'], permission: Companies.VIEW },
                    { label: 'Services', icon: 'pi pi-fw pi-cog', routerLink: ['/pages/services'], permission: Services.VIEW }
                ]
            },
            {
                label: 'Invoices',
                permission: Invoices.VIEW,
                items: [
                    { label: 'Invoices List', icon: 'pi pi-fw pi-file', routerLink: ['/pages/invoices'], permission: Invoices.VIEW }
                ]
            },
            {
                label: 'Payments',
                permission: CompanyPayments.VIEW,
                items: [
                    { label: 'Company Payments', icon: 'pi pi-credit-card', routerLink: ['/pages/company-payments'], permission: CompanyPayments.VIEW }
                ]
            },
            {
                label: 'Reports',
                permission: [VatReport.VIEW, OutstandingInvoices.VIEW],
                items: [
                    { label: 'Outstanding Invoices', icon: 'pi pi-fw pi-file', routerLink: ['/pages/outstanding-invoices'], permission: OutstandingInvoices.VIEW },
                    { label: 'VAT Report', icon: 'pi pi-fw pi-file-excel', routerLink: ['/pages/vat-report'], permission: VatReport.VIEW }
                ]
            },
            {
                label: 'Ledger',
                permission: LedgerInvoices.VIEW,
                items: [
                    { label: 'Ledger Invoices', icon: 'pi pi-fw pi-file', routerLink: ['/pages/ledger-invoices'], permission: LedgerInvoices.VIEW }
                ]
            },
            {
                label: 'Users',
                permission: Users.VIEW,
                items: [
                    { label: 'Users List', icon: 'pi pi-fw pi-users', routerLink: ['/pages/users'], permission: Users.VIEW }
                ]
            },
            {
                label: 'Security',
                permission: Roles.VIEW,
                items: [
                    { label: 'Roles List', icon: 'pi pi-fw pi-shield', routerLink: ['/pages/roles'], permission: Roles.VIEW }
                ]
            }
        ];
    }
}
