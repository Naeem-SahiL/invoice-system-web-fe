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
import { DatePicker } from 'primeng/datepicker';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Toolbar } from 'primeng/toolbar';
import { CompaniesService } from '../service/companies.service';
import { Checkbox } from 'primeng/checkbox';

@Component({
    selector: 'app-vat-report',
    imports: [Button, Card, DatePipe, DecimalPipe, IconField, InputIcon, InputText, PrimeTemplate, TableModule, DatePicker, ReactiveFormsModule, Toolbar, FormsModule, Checkbox, NgIf],
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
    loading: boolean = false;
    downloadingVat = false;
    private lastTableEvent: any = this.state;
    enablePaginator: boolean = true;

    constructor(
        private paymentService: PaymentsService,
        private globalMsgService: GlobalMessageService,
        private formBuilder: FormBuilder
    ) {
        this.formGroup = this.formBuilder.group({
            fromDate: [null, Validators.required],
            toDate: [null]
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        if (!this.formGroup.valid) {
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
        const formValue = this.formGroup.value;
        if (!formValue.fromDate) {
            this.showError('Please select a from and to date.');
            return null;
        }

        let params = this.getParams(event, formValue);

        this.loading = true;
        this.paymentService.getVat(params).subscribe({
            next: (res) => {
                if (this.enablePaginator) {
                    this.vatInvoices = res.data;
                    this.state.totalRecords = res.total;
                } else {
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
        const formValue = this.formGroup.value;
        if (!formValue.fromDate) {
            this.showError('Please select a from and to date.');
            return null;
        }

        let params = this.getParams(event, formValue);

        this.downloadingVat = true;
        this.paymentService.downloadVatReport(params).subscribe({
            next: (res) => {
                const blob = new Blob([res], { type: 'application/pdf' });
                const fileName = `VAT_REPORT_${params.from_date}_to_${params.to_date || formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.pdf`;
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.showError('Failed to download report.');
                this.loading = false;
            },
            complete: () => {this.downloadingVat= false}
        });
    }

    private getParams(event: any, formValue?: any) {
        const tableEvent = event || this.lastTableEvent;
        const first = tableEvent.first;
        const perPage = tableEvent.rows;

        return {
            first,
            globalFilter: this.lastTableEvent.globalFilter || '',
            per_page: perPage,
            paginator: this.enablePaginator,
            to_date: formValue.toDate ? formatDate(formValue.toDate, 'yyyy-MM-dd', 'en-US') : '',
            from_date: formValue.fromDate ? formatDate(formValue.fromDate, 'yyyy-MM-dd', 'en-US') : ''
        };
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

    protected readonly console = console;
}
