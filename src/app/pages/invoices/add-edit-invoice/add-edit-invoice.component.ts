import { Invoice, InvoiceItem } from './../../service/invoice.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { Textarea, TextareaModule } from 'primeng/textarea';
import { CompaniesService, Company } from '../../service/companies.service';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceService } from '../../service/invoice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Toast } from 'primeng/toast';
import { DatePicker } from 'primeng/datepicker';
import { InputNumber } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { AddEditInvoiceItemComponent } from './add-edit-invoice-item/add-edit-invoice-item.component';
import { ServiceItem } from '../../service/services.service';
import { ProgressBar } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { GlobalMessageService } from '../../service/global-message.service';

@Component({
    selector: 'app-add-edit-invoice',
    imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    Textarea,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    FloatLabelModule,
    AutoComplete,
    Toast,
    DatePicker,
    MessageModule,
    TableModule,
    AddEditInvoiceItemComponent,
    ProgressBar,
    ConfirmDialog
],
    templateUrl: './add-edit-invoice.component.html',
    styleUrl: './add-edit-invoice.component.scss',
    providers: [
        MessageService,
        ConfirmationService,
        CompaniesService,
        InvoiceService,
        DatePipe
    ]
})
export class AddEditInvoiceComponent {
    invoiceForm!: FormGroup;
    isEditMode = false;
    invoiceId!: string;
    loading = false;
    companies: Company[] = [];
    selectedCompany: Company | null = null;
    invoiceData : Invoice | null = null;

    selectedInvoiceItem: InvoiceItem | null = null;
    invoiceItemDialogueVisible = false;
    service!:ServiceItem;


    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private invoiceService: InvoiceService,
        private companyService: CompaniesService,
        private messageService: MessageService,
        private globalMsgService: GlobalMessageService,
        private confirmationService: ConfirmationService,
        private datePipe: DatePipe
    ) {}

    filteredComponies: Company[] | undefined;

    filterCompany(event: AutoCompleteCompleteEvent) {
        let filtered: Company[] = [];
        let query = event.query;

        for (let i = 0; i < (this.companies as Company[]).length; i++) {
            let company = (this.companies as Company[])[i];
            if (company.name?.toLowerCase().indexOf(query.toLowerCase()) == 0) {
                filtered.push(company);
            }
        }

        this.filteredComponies = filtered;
    }
    companySelect(val: any) {
        // this.selectedCompany = val.value;
        this.invoiceForm.controls['company_id'].setValue(val.value.id);
        console.log('Selected company:', this.selectedCompany);
    }

    ngOnInit(): void {
        this.invoiceId = this.route.snapshot.paramMap.get('id') ?? '';
        this.isEditMode = !!this.invoiceId;
        console.log('isEditMode:', this.isEditMode, 'invoiceId:', this.invoiceId);

        this.invoiceForm = this.fb.group({
            id: ['' ],
            invoice_number: ['', Validators.required],
            company_id: [null, Validators.required],
            invoice_date: ['', Validators.required],
            gross_amount: [0, Validators.required],
            vat_amount: [0, Validators.required],
            remarks: [''],
            company: [null],
            total_amount: [{ value: 0, disabled: true }]
        });

        this.companyService.getCompaniesData().subscribe({
            next: (companies) => {
                this.companies = companies;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load companies'
                });
            }
        });

        if (this.isEditMode) {
            this.loadInvoice(this.invoiceId);
        } else {
            this.getInvoiceNumber();
            let now = Date.now();
            let localeStr = this.datePipe.transform(now, 'dd-MM-yyyy');
            this.invoiceForm.controls['invoice_date'].setValue(localeStr);
        }

        this.calculateTotal();
    }

    loadInvoice(id: string) {
        this.loading = true;
        this.invoiceService.getInvoiceById(id).subscribe({
            next: (invoice) => {
                this.invoiceData = invoice;
                this.loadFormValues();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load invoice'
                });
                this.loading = false;
            }
        });
    }

    loadFormValues() {
        if (this.invoiceData) {
            this.invoiceForm.patchValue({
                id: this.invoiceData.id,
                invoice_number: this.invoiceData.invoice_number,
                company_id: this.invoiceData.company_id,
                invoice_date: this.invoiceData.invoice_date,
                gross_amount: this.invoiceData.gross_amount,
                vat_amount: this.invoiceData.vat_amount,
                total_amount: this.invoiceData.total_amount,
                remarks: this.invoiceData.remarks
            });

            // Set selected company
            const company = this.companies.find(c => String(c.id) === String(this.invoiceData?.company_id));
            if (company) {
                this.invoiceForm.controls['company'].setValue(company);
            }

            this.invoiceItemsList.push(...(this.invoiceData.items || []));
            this.invoiceItemsList.forEach(item => {
                item.temp_id = item.temp_id || crypto.randomUUID(); // Ensure temp_id is set
            });

            console.log('Loaded invoice data:', this.invoiceData);
            console.log('Form values:', this.invoiceForm.value);
        }
    }

    calculateTotal() {
        let gross = 0;
        let vat = 0;
        console.log('Calculating totals for invoice items:', this.invoiceItemsList);
        this.invoiceItemsList.forEach(item => {
            gross += parseFloat(String(item.amount)) || 0;
            vat += parseFloat(String(item.vat_amount)) || 0;
        })

        this.invoiceForm.get('gross_amount')?.setValue(gross);
        this.invoiceForm.get('vat_amount')?.setValue(vat);
        this.invoiceForm.get('total_amount')?.setValue(gross + vat);
        console.log('Calculated totals:', {
            gross_amount: gross,
            vat_amount: vat,
            total_amount: gross + vat
        });
    }

    onSubmit() {
        if (this.invoiceForm.invalid) return;
        if(this.invoiceItemsList.length === 0) {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please add at least one invoice item' });
            return;
        }

        let formValue = this.invoiceForm.getRawValue();

        const payload: Invoice = {
            id: formValue.id || null,
            invoice_number: formValue.invoice_number.toString(),
            company_id: formValue.company_id ,
            invoice_date: formValue.invoice_date,
            gross_amount: formValue.gross_amount,
            vat_amount: formValue.vat_amount,
            total_amount: formValue.total_amount,
            remarks: formValue.remarks || null,
            items: this.invoiceItemsList.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount,
                vat_amount: item.vat_amount,
                total_amount: item.total_amount,
                service_id: item.service_id,
                sr_no_group: item.sr_no_group,
            } as InvoiceItem)),
        };

        console.log('Submitting invoice:', payload);

        if (this.isEditMode) {
            this.invoiceService.updateInvoice(payload).subscribe({
                next: () => {
                    this.globalMsgService.showMessage({ severity: 'success', summary: 'Success', detail: 'Invoice updated' });
                    this.router.navigate(['/pages/invoices']);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update invoice' });
                }
            });
        } else {
            this.invoiceService.createInvoice(payload).subscribe({
                next: () => {
                    this.globalMsgService.showMessage({ severity: 'success', summary: 'Success', detail: 'Invoice created' });
                    this.router.navigate(['/pages/invoices']);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create invoice' });
                }
            });
        }
    }

    cancel() {
        this.router.navigate(['pages/invoices']);
    }

    getInvoiceNumber() {
        let randomNumber = Math.round(Math.random() * 1000000);
        if (!this.isEditMode) {
            this.invoiceForm.controls['invoice_number'].setValue(randomNumber);
        }
    }

    invoiceItemsList: InvoiceItem[] = [];

    addInvoiceItem() {
        // this.invoiceItemsList.push({
        //     id: this.invoiceItemsList.length + 1
        // })

        this.invoiceItemDialogueVisible = true;
        this.selectedInvoiceItem = null;
    }

    hideDialog() {
        this.invoiceItemDialogueVisible = false;
        this.selectedInvoiceItem = null;
    }

    saveInvoiceItem(item:InvoiceItem) {
        let itemValue = {...item}

        if(item.temp_id !== null && item.temp_id !== undefined && item.temp_id !== ''){
            const existingIndex = this.invoiceItemsList.findIndex(i => i.temp_id === item.temp_id);
            if (existingIndex > -1) {
                this.invoiceItemsList[existingIndex] = item; // Update existing item
            }
        }else{
            item.temp_id = crypto.randomUUID();
            this.invoiceItemsList.push(item); // Add new item
        }

        // this.invoiceItemsList.push(item);
        this.invoiceItemDialogueVisible = false;
        this.calculateTotal();
        this.selectedInvoiceItem = null;
    }

    editInvoiceItem(item: InvoiceItem) {
        this.selectedInvoiceItem = item;
        this.invoiceItemDialogueVisible = true;
        // this.service = item.service || { service_type: {} as any };
    }

    deleteInvoiceItem(item: InvoiceItem) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this invoice item?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.removeInvoiceItem(item);
            }
        });

    }

    removeInvoiceItem(item: InvoiceItem) {
        this.invoiceItemsList = this.invoiceItemsList.filter(i => i.temp_id !== item.temp_id);
        this.calculateTotal();
    }
}


