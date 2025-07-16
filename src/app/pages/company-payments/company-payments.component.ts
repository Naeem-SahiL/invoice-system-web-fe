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
import {DatePipe, DecimalPipe, formatDate, NgClass, NgFor, NgForOf, NgIf} from '@angular/common';
import {debounceTime, from, groupBy, mergeMap, of, reduce, Subject} from 'rxjs';
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
        NgFor,
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
    expandedRows = {};
    editingChequePayment = false;
    editingChequePaymentId: number | null = null;

    companyOptions = [];
    selectedCompanyId: number;
    selectedPaymentMethod: any;
    filteredCompanies: Company[] | undefined;
    payments = [];
    groupedPayments = [];
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
    existingFiles: any[] = []; // For files that already exist on the server
    paymentDate: any = new Date();
    chequeNumber: string = '';
    total_amount_received: number = 0.00;

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

    onRowExpand(event) {
        // this.expandedRows[key] = true;
        console.log(event);
    }

    onRowCollapse(event) {
        // delete this.expandedRows[key];
        console.log(event);
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
                this.groupedPayments = payments.data;
                this.state.totalRecords = payments.meta?.total;
                // this.getGroupedPayments(this.payments);
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

    savePayment(payment: any, groupId) {
        this.saving = true;
        this.paymentService.updatePayment(payment).subscribe({
            next: () => {
                this.saving = false;
                this.editingRowId = null;
                this.recalculateGroupTotal(groupId);
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

    deletePayment(payment: any, id) {
        this.deletingRowId = payment.id;
        this.deleting = true;
        this.confirmationService.confirm({
            message: `Are you sure you want to delete payment for invoice ${payment.invoice_number}?`,
            accept: () => {
                this.paymentService.deletePayment(payment).subscribe({
                    next: () => {
                        this.showSuccess('Payment deleted');
                        this.loadPayments(this.lastTableEvent);
                    },
                    error: () => {
                        this.showError('Failed to delete payment');
                        this.deleting = false;
                        this.deletingRowId = null;
                    },
                    complete: () => {
                        this.deleting = false;
                        this.deletingRowId = null;
                    }
                });
            },
            reject: () => {
                this.deleting = false;
                this.deletingRowId = null;
            }
        })
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
                this.calculateTotalReceived();
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
                // When editing a cheque payment, add the new amount to existing
                if (this.editingChequePaymentId !== null) {
                    // Add the new amount to the existing amount
                    existingInv.amount_received = (parseFloat(existingInv.amount_received) || 0) + (parseFloat(incomingInv.amount_received) || 0);
                } else {
                    // For new payments, just update the outstanding balance info
                    existingInv.outstanding_balance = incomingInv.outstanding_balance;
                }
            } else {
                this.selectedInvoicesForPayment.push(incomingInv);
            }
        });

        this.calculateTotalReceived();
    }

    calculateTotalReceived(){
        this.total_amount_received = 0.00;
        this.selectedInvoicesForPayment.forEach((inv)=>{
           this.total_amount_received += parseFloat(inv.amount_received) || 0;
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

    editChequePayment(group){
        this.editingChequePayment = true;
        this.editingChequePaymentId = group.id; // Store the cheque payment ID
        this.paymentService.getPayment(group.id).subscribe({
            next: (res:any)=>{
                this.showAddPaymentCard = true;
                this.selectedInvoicesForPayment = res.payments;
                this.remarks = res.remarks;
                this.chequeNumber = res.cheque_number;
                this.paymentDate = new Date(res.payment_date);

                // Find the payment method object from the dropdown options
                this.selectedPaymentMethod = this.paymentMethods.find(method =>
                    method.visible_value === res.payment_method ||
                    method.id === res.payment_method_id
                ) || null;

                // Set the selected company
                this.formGroup.patchValue({
                    selectedCompanyId: res.company_id
                });

                // Load existing files
                this.existingFiles = res.files || [];
                console.log('Loaded existing files:', this.existingFiles);
                this.uploadedFiles = []; // Reset new uploaded files

                // Calculate total amount from selected invoices
                this.calculateTotalReceived();

                this.editingChequePayment = false;
            },
            error: (err)=>{
                this.editingChequePayment = false;
                this.showError('Failed to load payment details');
            }
        })

        // console.log(group);

    }
    savePayments() {
        if (!this.formGroup.value.selectedCompanyId) {
            this.showError('Company is required');
            return;
        }

        if (!this.chequeNumber) {
            this.showError('Cheque number is required');
            return;
        }
        if (this.paymentDate == null || this.paymentDate === '') {
            this.showError('Payment date is required');
            return;
        }

        const formData = new FormData();
        formData.append('company_id', this.formGroup.value.selectedCompanyId.toString());
        formData.append('payment_date', this.paymentDate.toISOString());
        formData.append('payment_method_id', this.selectedPaymentMethod?.id || '');
        formData.append('remarks', this.remarks || '');
        formData.append('cheque_number', this.chequeNumber || '');
        formData.append('total_amount', `${this.total_amount_received}` );

        // Group payments by invoice_id to avoid duplicates
        const groupedPayments = this.groupPaymentsByInvoice(this.selectedInvoicesForPayment);

        groupedPayments.forEach((payment, idx) => {
            formData.append(`payments[${idx}][invoice_id]`, payment.invoice_id);
            formData.append(`payments[${idx}][amount_received]`, payment.amount_received.toString());
        });

        (this.uploadedFiles || []).forEach((file) => {
            formData.append('files[]', file, file.name);
        });        // Send existing files IDs to keep (for file deletion logic)
        console.log('Existing files before sending:', this.existingFiles);

        if (this.existingFiles && this.existingFiles.length > 0) {
            this.existingFiles.forEach((file, idx) => {
                console.log(`Adding existing file ${idx}:`, file.id);
                formData.append(`existing_files[${idx}]`, file.id.toString());
            });
        } else {
            console.log('No existing files to send');
            // Don't send anything if no files exist - let backend handle it
        }

        // Log what we're sending
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        this.savingPayment = true;

        // Determine if we're creating or updating
        const isUpdating = this.editingChequePaymentId !== null;

        console.log('=== ABOUT TO MAKE REQUEST ===', {
            isUpdating,
            editingId: this.editingChequePaymentId,
            hasFormData: !!formData
        });

        const paymentObservable = isUpdating
            ? this.paymentService.updateChequePayment(this.editingChequePaymentId, formData)
            : this.paymentService.submitMultiplePayments(formData);

        paymentObservable.subscribe({
            next: (response) => {
                console.log('=== PAYMENT UPDATE RESPONSE ===', response);
                this.showSuccess(isUpdating ? 'Payment updated successfully' : 'Payments saved successfully');
                // reset payment details
                this.cleanAddPayemntData();
                this.onCardClose();
                setTimeout(() => this.loadPayments(this.lastTableEvent), 500);
            },
            error: (err) => {
                console.error('=== PAYMENT UPDATE ERROR ===', err);
                this.showError(`${err.error?.message || 'Unknown error'}`);
                this.savingPayment = false;
            },
            complete: () => {
                console.log('=== PAYMENT UPDATE COMPLETE ===');
                this.savingPayment = false;
            }
        });
    }

    private cleanAddPayemntData(){
        this.total_amount_received = 0;
        this.remarks = '';
        this.chequeNumber = '';
        this.selectedInvoicesForPayment = [];
        this.uploadedFiles = [];
        this.existingFiles = [];
        this.editingChequePaymentId = null; // Reset editing ID
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
        this.existingFiles = [];
        this.selectedInvoices = [];
        this.editingChequePaymentId = null; // Reset editing ID
    }

    protected readonly CompanyPayments = CompanyPayments;

    private getGroupedPayments(payments: any[]) {
        this.groupedPayments = [];

        from(payments)
            .pipe(
                groupBy((p) => p.cheque_number),
                mergeMap((group$) => group$.pipe(reduce((acc, cur) => [...acc, cur], [])))
            )
            .subscribe((group) =>
                this.groupedPayments.push({
                    id: group[0].cheque_number,
                    cheque_number: group[0].cheque_number,
                    payment_method: group[0].payment_method,
                    payment_date: group[0].payment_date,
                    amount_received: group.reduce((sum, p) => sum + parseFloat(p.amount_received), 0),
                    payments: group
                })
            );

        console.log(this.groupedPayments);
    }

    private recalculateGroupTotal(groupId) {
        // let groupPayments = this.payments.filter((p) => p.cheque_number === groupId);
        let group = this.groupedPayments.find((g) => g.id === groupId);
        let totalAmount = group.payments.reduce((sum, p) => sum + parseFloat(p.amount_received), 0);
        if (group) {
            group.total_amount_received = totalAmount;
            // group.payments = groupPayments;
        }
    }

    /**
     * Group payments by invoice_id and merge amounts to avoid duplicate payment records
     */
    private groupPaymentsByInvoice(payments: any[]): any[] {
        const grouped = new Map<string, any>();

        payments.forEach(payment => {
            const invoiceId = payment.invoice_id || payment.id;
            const amount = parseFloat(payment.amount_received) || 0;

            if (grouped.has(invoiceId)) {
                // Merge amounts for the same invoice
                const existing = grouped.get(invoiceId);
                existing.amount_received = (parseFloat(existing.amount_received) || 0) + amount;
            } else {
                // Create new grouped payment
                grouped.set(invoiceId, {
                    invoice_id: invoiceId,
                    amount_received: amount,
                    invoice_number: payment.invoice_number,
                    outstanding_balance: payment.outstanding_balance,
                    // Keep other properties from the first occurrence
                    ...payment
                });
            }
        });

        return Array.from(grouped.values());
    }

    removeExistingFile(file: any) {
        console.log('Removing file:', file);
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this file?`,
            accept: () => {
                console.log('Before removal, existingFiles:', this.existingFiles);
                this.existingFiles = this.existingFiles.filter(f => f.id !== file.id);
                console.log('After removal, existingFiles:', this.existingFiles);
                this.showSuccess('File removed from list (will be deleted on save)');
            }
        });
    }
}
