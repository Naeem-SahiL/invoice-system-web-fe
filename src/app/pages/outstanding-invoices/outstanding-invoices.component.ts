import { Component } from '@angular/core';
import { PaymentsService } from '../service/payments.service';
import { GlobalMessageService } from '../service/global-message.service';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePipe, DecimalPipe, formatDate, NgIf } from '@angular/common';
import { PrimeTemplate } from 'primeng/api';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toolbar } from 'primeng/toolbar';
import { CompaniesService, Company } from '../service/companies.service';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';

@Component({
    selector: 'app-outstanding-invoices',
    imports: [Button, Card, DatePipe, DecimalPipe, PrimeTemplate, TableModule, AutoComplete, ReactiveFormsModule, Toolbar, NgIf, IconField, InputIcon, InputText],
    templateUrl: './outstanding-invoices.component.html',
    styleUrl: './outstanding-invoices.component.scss',
    providers: [PaymentsService, CompaniesService]
})
export class OutstandingInvoicesComponent {
    state = {
        first: 0,
        rows: 10,
        totalRecords: 0,
        globalFilter: ''
    };

    formGroup: any;
    outstandingInvoices: any[] = [];
    companyOptions: Company[];
    filteredCompanies: Company[] | undefined;

    loading: boolean = false;
    downloadingOutstanding = false;

    private lastTableEvent: any = this.state;

    constructor(
        private paymentService: PaymentsService,
        private companyService: CompaniesService,
        private globalMsgService: GlobalMessageService,
        private formBuilder: FormBuilder
    ) {
        this.formGroup = this.formBuilder.group({
            selectedCompanyId: [null, Validators.required],
            selectedPaymentMethod: [null],
            fromDate: [null],
            toDate: [null]
        });
    }

    ngOnInit(): void {
        this.loadCompanies();
    }

    loadCompanies() {
        this.companyService.getCompaniesData().subscribe({
            next: (companies) => (this.companyOptions = companies),
            error: () => this.showError('Failed to load companies')
        });
    }

    filterCompany(event: AutoCompleteCompleteEvent) {
        let filtered: Company[] = [];
        let query = event.query;

        for (let i = 0; i < (this.companyOptions as Company[]).length; i++) {
            let company = (this.companyOptions as Company[])[i];
            if (company.name?.toLowerCase().indexOf(query.toLowerCase()) == 0) {
                filtered.push(company);
            }
        }
        this.filteredCompanies = filtered;
    }

    onCompanySelect(event: any) {
        this.formGroup.patchValue({
            selectedCompanyId: event.value.id
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    // onLazyLoad(event: any) {
    //     if (!this.formGroup.valid) {
    //         return;
    //     }
    //     this.lastTableEvent = event;
    //     this.loadOutstandingInvoices(event);
    // }

    loadOutstandingInvoices(event?: any) {
        this.loading = true;

        const tableEvent = event || this.lastTableEvent;
        const page = tableEvent.first / tableEvent.rows + 1;
        const perPage = tableEvent.rows;
        const formValue = this.formGroup.value;

        if (!formValue.selectedCompanyId) {
            this.showError('Please select a company first.');
            return;
        }
        let params = {
            globalFilter: this.lastTableEvent.globalFilter || '',
            paginator: false,
            company_id: formValue.selectedCompanyId.toString()
        };

        this.paymentService.getOutstandingInvoices(params).subscribe({
            next: (res) => {
                this.outstandingInvoices = res;
                this.loading = false;
            },
            error: () => {
                this.showError('Failed to load outstanding invoices');
                this.loading = false;
            }
        });
    }

    getTotalOutstanding(): number {
        return this.outstandingInvoices?.reduce((sum, inv) => sum + (inv.outstanding_balance || 0), 0) || 0;
    }

    private showError(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }

    downloadOutstandingReport() {
        const formValue = this.formGroup.value;
        if (!formValue.selectedCompanyId) {
            this.showError('Please select a company first.');
            return null;
        }

        let params = {
            company_id: formValue.selectedCompanyId.toString()
        };

        this.downloadingOutstanding = true;
        this.paymentService.downloadOutstandingReport(params).subscribe({
            next: (res) => {
                const blob = new Blob([res], { type: 'application/pdf' });
               const fileName =
                   `${this.companyOptions.find(c => c.id === formValue.selectedCompanyId)?.name
                   || 'company'}_OUTSTANDING REPORT_${formatDate(new Date(), 'yyyy-MM-dd_HH:mm', 'en-US')}.pdf`;
               const url = window.URL.createObjectURL(blob);
               const link = document.createElement('a');
               link.href = url;
               link.download = fileName;
               link.click();
               window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.showError('Failed to download report.');
                this.downloadingOutstanding = false;
            },
            complete: () => {this.downloadingOutstanding= false}
        });
    }
}
