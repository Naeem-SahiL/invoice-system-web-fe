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
import {DatePipe, DecimalPipe, formatDate, NgClass, NgForOf, NgIf} from '@angular/common';
import { debounceTime, Subject } from 'rxjs';
import { Card } from 'primeng/card';
import { Tooltip } from 'primeng/tooltip';
import { Ripple } from 'primeng/ripple';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import {DatePicker} from "primeng/datepicker";
import { AccordionModule } from 'primeng/accordion';
import {animate, style, transition, trigger} from '@angular/animations';
import {FloatLabel} from "primeng/floatlabel";
import {Textarea} from "primeng/textarea";
import {FileRemoveEvent, FileUpload} from "primeng/fileupload";
import { Dialog } from 'primeng/dialog';
import { AddPaymentComponent } from './add-payment/add-payment.component';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IftaLabel } from 'primeng/iftalabel';
import { Select } from 'primeng/select';
import { HasPermissionDirective } from '../../shared/has.permission.directive';
import { CompanyPayments } from '../../shared/Permissions';

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
        AccordionModule,
        FloatLabel,
        Textarea,
        FileUpload,
        DatePipe,
        Dialog,
        AddPaymentComponent,
        ConfirmDialog,
        IftaLabel,
        Select,
        HasPermissionDirective
    ],
    templateUrl: './company-payments.component.html',
    styleUrl: './company-payments.component.scss',
    providers: [CompaniesService, ConfirmationService],
    animations: [
        trigger('cardAnimation', [
            transition(':enter', [style({ opacity: 0, transform: 'translateY(-10px)' }), animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
            transition(':leave', [animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))])
        ]),
        trigger('accordionToggle', [
            transition(':enter', [
                style({
                    height: '0',
                    opacity: 0,
                    paddingTop: '0',
                    paddingBottom: '0',
                    marginTop: '0',
                    marginBottom: '0',
                    overflow: 'hidden'
                }),
                animate(
                    '300ms ease',
                    style({
                        height: '*',
                        opacity: 1,
                        paddingTop: '*',
                        paddingBottom: '*',
                        marginTop: '*',
                        marginBottom: '*'
                    })
                )
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate(
                    '200ms ease',
                    style({
                        height: '10px',
                        opacity: 0,
                        paddingTop: '0',
                        paddingBottom: '0',
                        marginTop: '0',
                        marginBottom: '0'
                    })
                )
            ])
        ])
    ]
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
    selectedPaymentMethod: any;
    filteredCompanies: Company[] | undefined;
    payments = [];
    paymentMethods = [];

    loading = false;
    saving = false;
    deleting = false;
    editingRowId: number | null = null;
    deletingRowId: any;

    searchSubject = new Subject<{ table: Table; event: Event }>();

    formGroup: any;
    selectedInvoices: any[] = [];
    showAddPaymentCard = false;
    showAddInvoiceDialog = false;
    selectedInvoicesForPayment: any[] = [];
    remarks: string = '';
    uploadedFiles: File[] = [];
    paymentDate: any = new Date();
    referenceNumber: string = '';

    savingPayment = false;
    private editingRowOriginal: any;

    constructor(
        private companyService: CompaniesService,
        private globalMsgService: GlobalMessageService,
        private confirmationService: ConfirmationService,
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
            next: (methods) => {
                this.paymentMethods = methods;
                // Set default payment method if available
                if (methods.length > 0) {
                    this.selectedPaymentMethod = methods[0];
                }
            },
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
            next: (payments) => {
                this.payments = payments.data;
                this.state.totalRecords = payments.meta?.total;
            },
            error: () => {
                this.showError('Failed to load payments');
                this.loading = false;
            },
            complete: () => (this.loading = false)
        });
    }

    onLazyLoad(event: any) {
        this.lastTableEvent = event;
        this.loadPayments(event);
    }

    editRow(payment: any) {
        this.editingRowId = payment.id;
        this.editingRowOriginal = { ...payment }; // Store original data for cancel
    }

    cancelEdit(payment) {
        this.editingRowId = null;
        // Restore original data
        Object.assign(payment, this.editingRowOriginal);
    }

    savePayment(payment: any) {
        this.saving = true;
        this.paymentService.updatePayment(payment).subscribe({
            next: () => {
                this.saving = false;
                this.editingRowId = null;
                this.showSuccess('Payment updated');
            },
            error: (err) => {
                this.saving = false;
                console.log(err);
                this.showError(`${err.error?.message || 'Unknown error'}`);
                this.editingRowId = null;
                // Restore original data if save fails
                Object.assign(payment, this.editingRowOriginal);
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
    openAddPaymentCard() {
        if (!this.formGroup.value.selectedCompanyId) {
            this.showError('Please select a company first');
            return;
        }
        this.showAddPaymentCard = true;

        this.selectedInvoices.push(
            {
                invoice_id: 1,
                invoice_number: 'INV-001',
                invoice_date: new Date('2025-01-01 08:54').toISOString(),
                outstanding_balance: 1000.0,
                amount_received: 1000.0
            },
            {
                invoice_id: 2,
                invoice_number: 'INV-002',
                invoice_date: new Date('2025-02-01').toISOString(),
                outstanding_balance: 500.0,
                amount_received: 500.0
            }
        );
    }

    onFilesSelected(event: any) {
        if (event.files) {
            this.uploadedFiles.push(event.files[0]);
        }
    }

    onFileRemove($event: FileRemoveEvent) {
        const removedFile = $event.file;
        this.uploadedFiles = this.uploadedFiles.filter((file) => file.name !== removedFile.name);
        this.globalMsgService.showMessage({
            severity: 'info',
            summary: 'File Removed',
            detail: `Removed file: ${removedFile.name}`
        });
    }

    onClearFiles($event: Event) {
        this.uploadedFiles = [];
        this.globalMsgService.showMessage({
            severity: 'info',
            summary: 'Files Cleared',
            detail: 'All uploaded files have been cleared'
        });
    }

    removeSelectedInvoice(inv: any) {
        // show confirmation dialog before removing
        this.confirmationService.confirm({
            message: `Are you sure you want to remove invoice ${inv.invoice_number}?`,
            accept: () => {
                this.selectedInvoicesForPayment = this.selectedInvoicesForPayment.filter((i) => i.id !== inv.id);
                this.showSuccess(`Removed invoice ${inv.invoice_number}`);
            },
            reject: () => {
                this.showWarn(`Cancelled removing invoice ${inv.invoice_number}`);
            }
        });
    }

    onInvoiceSelected(event: any) {
        let incomingInvoices =
            event.invoices.map((inv) => ({
                ...inv,
                amount_received: inv.outstanding_balance // default amount received
            })) || [];

        // if incoming has some overlap invoice, add outstanding balance to existing
        incomingInvoices.forEach((incomingInv) => {
            const existingInv = this.selectedInvoicesForPayment.find((inv) => inv.id === incomingInv.id);
            if (existingInv) {
                existingInv.amount_received += incomingInv.outstanding_balance;
            } else {
                this.selectedInvoicesForPayment.push(incomingInv);
            }
        });
    }

    closeAddInvoiceDialog() {
        this.showAddInvoiceDialog = false;
    }

    onAddPaymentDialogClose() {
        // This ensures complete cleanup
        setTimeout(() => {
            this.showAddInvoiceDialog = false;
        });
    }

    savePayments() {
        if (!this.formGroup.value.selectedCompanyId) {
            this.showError('Company is required');
            return;
        }

        const formData = new FormData();
        formData.append('company_id', this.formGroup.value.selectedCompanyId.toString());
        formData.append('payment_date', this.paymentDate.toISOString());
        formData.append('payment_method_id', this.selectedPaymentMethod?.id || '');
        formData.append('remarks', this.remarks || '');
        formData.append('reference_no', this.referenceNumber || '');

        this.selectedInvoicesForPayment.forEach((inv, idx) => {
            formData.append(`payments[${idx}][invoice_id]`, inv.id);
            formData.append(`payments[${idx}][amount_received]`, inv.amount_received);
        });

        (this.uploadedFiles || []).forEach((file) => {
            formData.append('files[]', file, file.name);
        });

        this.savingPayment = true;
        this.paymentService.submitMultiplePayments(formData).subscribe({
            next: () => {
                this.showSuccess('Payments saved successfully');
                // reset payment details
                this.onCardClose();
                setTimeout(() => this.loadPayments(this.lastTableEvent), 500);
            },
            error: (err) => this.showError(`Failed to save payments: ${err.error?.message || 'Unknown error'}`),
            complete: () => {
                this.savingPayment = false;
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

    private showWarn(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'Warn',
            summary: 'Action Cancelled',
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

    onCardClose() {
        this.showAddPaymentCard = false;
        this.selectedInvoicesForPayment = [];
        this.remarks = '';
        this.uploadedFiles = [];
        this.selectedInvoices = [];
    }

    protected readonly CompanyPayments = CompanyPayments;
}
