import { Component } from '@angular/core';
import { PaymentsService } from '../service/payments.service';
import { GlobalMessageService } from '../service/global-message.service';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePipe, DecimalPipe, formatDate, NgIf } from '@angular/common';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { PrimeTemplate } from 'primeng/api';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DatePicker } from 'primeng/datepicker';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toolbar } from 'primeng/toolbar';
import { CompaniesService, Company } from '../service/companies.service';

@Component({
    selector: 'app-ledger-invoices',
    imports: [Button, Card, DatePipe, DecimalPipe, IconField, InputIcon, InputText, PrimeTemplate, TableModule, AutoComplete, DatePicker, ReactiveFormsModule, Toolbar, NgIf],
    templateUrl: './ledger-invoices.component.html',
    providers: [PaymentsService, CompaniesService]
})
export class LedgerInvoicesComponent {
    state = {
        first: 0,
        rows: 10,
        totalRecords: 0,
        globalFilter: ''
    };

    formGroup: any;
    ledgerInvoices: any[] = [];
    companyOptions: Company[];
    filteredCompanies: Company[] | undefined;

    loading: boolean = false;
    downloadingLdger: boolean = false;
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

    onLazyLoad(event: any) {
        if (!this.formGroup.valid) {
            return;
        }
        this.lastTableEvent = event;
        this.loadLedgerInvoices(event);
    }

    loadLedgerInvoices(event?: any) {
        const formValue = this.formGroup.value;
        if (!formValue.selectedCompanyId) {
            this.showError('Please select a company first.');
            return;
        }
        let params = this.getParams( formValue,event);

        this.loading = true;
        this.paymentService.getLegderInvoices(params).subscribe({
            next: (res) => {
                this.ledgerInvoices = res.data;
                this.state.totalRecords = res.total;
                this.loading = false;
            },
            error: () => {
                this.showError('Failed to load outstanding invoices');
                this.loading = false;
            }
        });
    }

    private getParams( formValue,event?: any) {
        const tableEvent = event || this.lastTableEvent;
        const first = tableEvent.first;
        const perPage = tableEvent.rows;

        let params = {
            first,
            globalFilter: this.lastTableEvent.globalFilter || '',
            company_id: formValue.selectedCompanyId.toString(),
            per_page: perPage,
            to_date: formValue.toDate ? formatDate(formValue.toDate, 'yyyy-MM-dd', 'en-US') : '',
            from_date: formValue.fromDate ? formatDate(formValue.fromDate, 'yyyy-MM-dd', 'en-US') : ''
        };
        return params;
    }

    private showError(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }

    downloadLdgerReport() {
        const formValue = this.formGroup.value;
        if (!formValue.selectedCompanyId) {
            this.showError('Please select a company first.');
            return;
        }

        let params = this.getParams(formValue);

        this.downloadingLdger = true;
        this.paymentService.downloadLedgerReport(params).subscribe({
            next: (res) => {
                const blob = new Blob([res], { type: 'application/pdf' });
                const fileName = `LEDGER_REPORT_${this.companyOptions.find(c => c.id === formValue.selectedCompanyId)?.name
                || 'company'}_${params.from_date}_to_${params.to_date || formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.pdf`;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.showError('Failed to download report.');
                this.downloadingLdger = false;
            },
            complete: () => {
                this.downloadingLdger = false;
            }
        });
    }
}
