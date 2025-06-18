import {Component, OnInit, ViewChild} from '@angular/core';
import { CompaniesService, Company } from '../service/companies.service';
import { GlobalMessageService } from '../service/global-message.service';
import { DropdownModule } from 'primeng/dropdown';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { LookupsService } from '../service/lookups.service';
import { Button } from 'primeng/button';
import { PaymentsService } from '../service/payments.service';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import { DecimalPipe, formatDate, NgClass, NgForOf, NgIf } from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { Card } from 'primeng/card';
import { Tooltip } from 'primeng/tooltip';
import { Ripple } from 'primeng/ripple';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import {DatePicker} from "primeng/datepicker";
import {Dialog} from "primeng/dialog";
import {AddPaymentComponent} from "./add-payment/add-payment.component";
import { AccordionModule } from 'primeng/accordion';

@Component({
    selector: 'app-company-payments',
    imports: [
        // Angular modules
        DecimalPipe,
        FormsModule,
        NgForOf,
        NgIf,
        ReactiveFormsModule,

        // PrimeNG modules
        AutoComplete,
        Button,
        Card,
        DropdownModule,
        IconField,
        InputIcon,
        InputNumber,
        InputText,
        Ripple,
        TableModule,
        Toast,
        Toolbar,
        Tooltip,
        DatePicker,
        Dialog,
        AddPaymentComponent,
        AccordionModule,
        NgClass
    ],
    templateUrl: './company-payments.component.html',
    styleUrl: './company-payments.component.scss',
    providers: [CompaniesService],
    animations: [
        trigger('expandCollapse', [
            state('void', style({ height: '0', opacity: 0, overflow: 'hidden' })),
            state('*', style({ height: '*', opacity: 1, overflow: 'hidden' })),
            transition('void <=> *', [
                animate('300ms cubic-bezier(0.4,0.0,0.2,1)')
            ])
        )

})
export class CompanyPaymentsComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    cols = [
        { field: 'invoice_number', header: 'Invoice Number' },
        { field: 'invoice_date', header: 'Invoice Date' },
        { field: 'payment_method', header: 'Payment Method' },
        { field: 'payment_date', header: 'Payment Date' },
        { field: 'amount_received', header: 'Amount Received' },
        { field: 'remaining_amount', header: 'Remaining Amount' },
        { field: 'remarks', header: 'Remarks' },
        { field: 'files', header: 'Files' },
        { field: 'actions', header: 'Actions' }
    ];

    state = {
        first: 0,
        rows: 10,
        totalRecords: 0,
        globalFilter: ''
    };
    lastTableEvent = this.state;

    companyOptions = [];
    selectedCompanyId: number;
    filteredCompanies: Company[] | undefined;
    payments = [];
    paymentMethods = [];
    remarks = '';

    loading = false;
    saving = false;
    deleting = false;
    editingRowId: number | null = null;
    deletingRowId: any;

    searchSubject = new Subject<{ table: Table; event: Event }>();
    formGroup: any;
    activeAccordianIndex = undefined;
    selectedInvoices: any;
    showAddPaymentDialog = false;
    selectedInvoicesForPayment: any[] = [];
    remarksFromDialog: string = '';
    filesFromDialog: File[] = [];

    selectedInvoicesSelection = [];

    constructor(
        private companyService: CompaniesService,
        private globalMsgService: GlobalMessageService,
        private lookupService: LookupsService,
        private paymentService: PaymentsService,
        private formBuilder: FormBuilder
    ) {
        this.searchSubject.pipe(debounceTime(400)).subscribe(({ table, event }) => {
            this.onGlobalFilter(table, event);
        });

        this.formGroup = this.formBuilder.group({
            selectedCompanyId: [null, Validators.required],
            selectedPaymentMethod: [null],
            fromDate: [null],
            toDate: [null]
        });
    }

    ngOnInit() {
        this.loadCompanies();
        this.loadPaymentMethods();
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

    loadCompanies() {
        this.companyService.getCompaniesData().subscribe({
            next: (companies) => (this.companyOptions = companies),
            error: () => this.showError('Failed to load companies')
        });
    }

    loadPaymentMethods() {
        this.lookupService.getLookupBytype('payment_method').subscribe({
            next: (methods) => (this.paymentMethods = methods),
            error: () => this.showError('Failed to load payment methods')
        });
    }

    loadPayments(event?: any) {
        const tableEvent = event || this.lastTableEvent;
        const page = tableEvent.first / tableEvent.rows + 1;
        const perPage = tableEvent.rows;
        let searchText = tableEvent.filters?.global?.value || '';

        const formValue = this.formGroup.value;
        if (!formValue.selectedCompanyId) return;

        this.loading = true;
        const params = {
            page,
            per_page: perPage,
            company_id: formValue.selectedCompanyId.toString(),
            to_date: formValue.toDate ? formatDate(formValue.toDate, 'yyyy-MM-dd', 'en-US') : '',
            from_date: formValue.fromDate ? formatDate(formValue.fromDate, 'yyyy-MM-dd', 'en-US') : '',
            searchText
        };

        this.paymentService.getPayments(params).subscribe({
            next: (payments) => (this.payments = payments.data),
            error: () => this.showError('Failed to load payments'),
            complete: () => (this.loading = false)
        });
    }

    onLazyLoad(event: any) {
        this.lastTableEvent = event;
        this.loadPayments(event);
    }

    editRow(payment: any) {
        this.editingRowId = payment.id;
    }

    cancelEdit() {
        this.editingRowId = null;
    }

    savePayment(payment: any) {
        this.saving = true;
        this.paymentService.updatePayment(payment).subscribe({
            next: () => {
                this.saving = false;
                this.editingRowId = null;
                this.showSuccess('Payment updated');
            },
            error: () => {
                this.saving = false;
                this.showError('Failed to update payment');
            }
        });
    }

    deletePayment(payment: any) {
        this.deletingRowId = payment.id;
        this.deleting = true;
        this.paymentService.deletePayment(payment).subscribe({
            next: () => {
                this.showSuccess('Payment deleted');
                this.loadPayments(this.lastTableEvent);
            },
            error: () => this.showError('Failed to delete payment'),
            complete: () => {
                this.deleting = false;
                this.deletingRowId = null;
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    onGlobalFilterDebounced(table: Table, event: Event) {
        this.searchSubject.next({ table, event });
    }

    // Add Payment Logic
    openAddPaymentDialog() {
        if (!this.formGroup.value.selectedCompanyId) {
            this.showError('Please select a company first');
            return;
        }
        // this.showAddPaymentDialog = true;
        this.activeAccordianIndex = '0';
    }

    removeSelectedInvoice(inv: any) {
        this.selectedInvoices = this.selectedInvoices.filter((i) => i.invoice_id !== inv.invoice_id);
    }

    onPaymentsSelected(event: any) {
        this.selectedInvoicesForPayment = event.invoices.map((inv) => ({
            ...inv,
            amount_received: inv.outstanding_balance // default amount received
        }));
        this.remarksFromDialog = event.remarks;
        this.filesFromDialog = event.files;
    }

    closeAddPaymentDialog() {
        this.showAddPaymentDialog = false;
    }

    onAddPaymentDialogClose() {
        // This ensures complete cleanup
        setTimeout(() => {
            this.showAddPaymentDialog = false;
        });
    }

    savePayments() {
        if (!this.formGroup.value.selectedCompanyId) {
            this.showError('Company is required');
            return;
        }

        const formData = new FormData();
        formData.append('company_id', this.formGroup.value.selectedCompanyId.toString());
        formData.append('payment_date', new Date().toISOString());
        formData.append('payment_method_id', this.formGroup.value.selectedPaymentMethod || '');
        formData.append('remarks', this.remarksFromDialog || '');

        this.selectedInvoicesForPayment.forEach((inv, idx) => {
            formData.append(`payments[${idx}][invoice_id]`, inv.id);
            formData.append(`payments[${idx}][amount_received]`, inv.amount_received);
        });

        (this.filesFromDialog || []).forEach((file) => {
            formData.append('files[]', file, file.name);
        });

        this.paymentService.submitMultiplePayments(formData).subscribe({
            next: () => this.showSuccess('Payments saved'),
            error: () => this.showError('Failed to save payments')
        });
    }

    private showError(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }

    private showSuccess(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'success',
            summary: 'Success',
            detail
        });
    }
}
