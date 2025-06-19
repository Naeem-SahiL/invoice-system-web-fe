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
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toolbar } from 'primeng/toolbar';
import { CompaniesService, Company } from '../service/companies.service';
import { RadioButton } from 'primeng/radiobutton';
import { Checkbox } from 'primeng/checkbox';

@Component({
    selector: 'app-vat-report',
    imports: [
        Button, Card, DatePipe, DecimalPipe, IconField, InputIcon, InputText,
        PrimeTemplate, TableModule, AutoComplete, DatePicker,
        ReactiveFormsModule, Toolbar, FormsModule, Checkbox, NgIf],
    templateUrl: './vat-report.component.html',
    providers: [PaymentsService, CompaniesService]
})
export class VatReportComponent {
    state = {
        first: 0,
        rows: 10,
        totalRecords: 0,
        globalFilter: ''
    };

    formGroup: any;
    vatInvoices: any[] = [];
    companyOptions: Company[];
    filteredCompanies: Company[] | undefined;

    loading: boolean = false;
    private lastTableEvent: any = this.state;
    enablePaginator: boolean = true;

    constructor(
        private paymentService: PaymentsService,
        private companyService: CompaniesService,
        private globalMsgService: GlobalMessageService,
        private formBuilder: FormBuilder
    ) {
        this.formGroup = this.formBuilder.group({
            fromDate: [null, Validators.required],
            toDate: [null]
        });
    }

    ngOnInit(): void {
    }

    onGlobalFilter(table: Table, event: Event) {
        if(!this.formGroup.valid){
            this.showError('Please select a from and to date.');
            return;
        }
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    onLazyLoad(event: any) {
        if (!this.formGroup.valid) {
            return;
        }
        this.lastTableEvent = event;
        this.loadVatReport(event);
    }

    loadVatReport(event?: any) {

        const tableEvent = event || this.lastTableEvent;
        const first = tableEvent.first ;
        const perPage = tableEvent.rows;
        const formValue = this.formGroup.value;

        if (!formValue.fromDate) {
            this.showError('Please select a from and to date.');
            return;
        }
        let params = {
            first,
            globalFilter: this.lastTableEvent.globalFilter || '',
            per_page: perPage,
            paginator: this.enablePaginator,
            to_date: formValue.toDate ? formatDate(formValue.toDate, 'yyyy-MM-dd', 'en-US') : '',
            from_date: formValue.fromDate ? formatDate(formValue.fromDate, 'yyyy-MM-dd', 'en-US') : '',
        }


        this.loading = true;
        this.paymentService.getVat(params).subscribe({
            next: (res) => {
                if(this.enablePaginator){
                    this.vatInvoices = res.data;
                    this.state.totalRecords = res.total;
                }else{
                    this.vatInvoices = res;
                }

                this.loading = false;
            },
            error: () => {
                this.showError('Failed to load outstanding invoices');
                this.loading = false;
            }
        });
    }
    downloadVatReport(event?: any) {

        const tableEvent = event || this.lastTableEvent;
        const first = tableEvent.first ;
        const perPage = tableEvent.rows;
        const formValue = this.formGroup.value;

        if (!formValue.fromDate) {
            this.showError('Please select a from and to date.');
            return;
        }
        let params = {
            first,
            globalFilter: this.lastTableEvent.globalFilter || '',
            per_page: perPage,
            paginator: this.enablePaginator,
            to_date: formValue.toDate ? formatDate(formValue.toDate, 'yyyy-MM-dd', 'en-US') : '',
            from_date: formValue.fromDate ? formatDate(formValue.fromDate, 'yyyy-MM-dd', 'en-US') : '',
        }


        // this.loading = true;
        this.paymentService.downloadVatReport(params).subscribe({
            next: (res) => {
                const blob = new Blob([res], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            },
            error: () => {
                this.showError('Failed to download vat report.');
                this.loading = false;
            }
        });
    }

    get totalVatAmount(): number {
        return this.vatInvoices?.reduce((sum, inv) => sum + parseFloat(inv.vat_amount || '0'), 0) ?? 0;
    }


    private showError(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }
}
