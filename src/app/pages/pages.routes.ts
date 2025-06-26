import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { CompaniesComponent } from './companies/companies.component';
import { ServicesComponent } from './services/services.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { AddEditInvoiceComponent } from './invoices/add-edit-invoice/add-edit-invoice.component';
import { InvoiceDetailsComponent } from './invoices/invoice-details/invoice-details.component';
import { CompanyPaymentsComponent } from './company-payments/company-payments.component';
import { AddPaymentComponent } from './company-payments/add-payment/add-payment.component';
// import { OutstandingInvoicesComponent } from './outstanding-invoices/outstanding-invoices.component';
import { LedgerInvoicesComponent } from './ledger-invoices/ledger-invoices.component';
import { VatReportComponent } from './vat-report/vat-report.component';
import { OutstandingInvoicesComponent } from './outstanding-invoices/outstanding-invoices.component';
import { UsersComponent } from './users/users.component';
import { UserFormComponent } from './users/user.form/user.form.component';
import { RolesComponent } from './roles/roles.component';
import { RoleFormComponent } from './roles/role.form/role.form.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'companies', component: CompaniesComponent },
    { path: 'services', component: ServicesComponent },
    {
        path: 'invoices',
        children: [
            { path: '', component: InvoicesComponent },
            { path: 'create', component: AddEditInvoiceComponent },
            { path: 'edit/:id', component: AddEditInvoiceComponent },
            { path: 'view/:id', component: InvoiceDetailsComponent }
        ]
    },
    {
        path: 'company-payments',
        children: [
            { path: '', component: CompanyPaymentsComponent },
            { path: 'create', component: AddPaymentComponent },
        ]
    },
    {
      path: 'outstanding-invoices',
        children: [
            { path: '', component: OutstandingInvoicesComponent }
        ]
    },
    {
      path: 'ledger-invoices',
        children: [
            { path : '', component: LedgerInvoicesComponent }
        ]
    },
    {
      path: 'vat-report',
        children: [
            { path : '', component: VatReportComponent }
        ]
    },
    {
        path: 'users',
        children: [
            {
                path: '',
                component: UsersComponent
            },
            {
                'path': 'edit/:id',
                component: UserFormComponent
            },
            {
                'path': 'view/:id',
                component: UserFormComponent
            },
            {
                path: 'new',
                component: UserFormComponent
            }
        ]
    },
    {
        path: 'roles',
        children: [
            {
                path: '',
                component: RolesComponent
            },
            {
                'path': 'edit/:id',
                component: RoleFormComponent
            },
            {
                'path': 'view/:id',
                component: RoleFormComponent
            },
            {
                path: 'new',
                component: RoleFormComponent
            }
        ]
    },
    { path: 'empty', component: Empty },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
