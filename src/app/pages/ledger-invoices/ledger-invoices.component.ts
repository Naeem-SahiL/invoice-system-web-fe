import { Component } from '@angular/core';
import { PaymentsService } from '../service/payments.service';
import { GlobalMessageService } from '../service/global-message.service';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
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
    selector: 'app-outstanding-invoices',
    imports: [Button, Card, DatePipe, DecimalPipe, IconField, InputIcon, InputText, PrimeTemplate, TableModule, AutoComplete, DatePicker, ReactiveFormsModule, Toolbar],
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
        this.loading = true;

        const tableEvent = event || this.lastTableEvent;
        const first = tableEvent.first ;
        const perPage = tableEvent.rows;
        const formValue = this.formGroup.value;

        if (!formValue.selectedCompanyId) {
            this.showError('Please select a company first.');
            return;
        }
        let params = {
            first,
            globalFilter: this.lastTableEvent.globalFilter || '',
            company_id: formValue.selectedCompanyId.toString(),
            per_page: perPage,
            to_date: formValue.toDate ? formatDate(formValue.toDate, 'yyyy-MM-dd', 'en-US') : '',
            from_date: formValue.fromDate ? formatDate(formValue.fromDate, 'yyyy-MM-dd', 'en-US') : '',
        }


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

    private showError(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }
}
