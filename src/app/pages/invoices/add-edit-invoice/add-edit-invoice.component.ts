import { Invoice, InvoiceItem } from '../../service/invoice.service';
import { CommonModule, DatePipe } from '@angular/common';
import {Component, OnInit} from '@angular/core';
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
import { ConfirmationService } from 'primeng/api';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Toast } from 'primeng/toast';
import { DatePicker } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ServiceItem } from '../../service/services.service';
import { ProgressBar } from 'primeng/progressbar';
import { InvoiceItemComponent } from './invoice-item/invoice-item.component';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import {GlobalMessageService} from "../../service/global-message.service";
import {ConfirmDialog} from "primeng/confirmdialog";

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
        ProgressBar,
        ConfirmPopupModule,
        InvoiceItemComponent,
        ConfirmDialog
    ],
    templateUrl: './add-edit-invoice.component.html',
    styleUrl: './add-edit-invoice.component.scss',
    providers: [CompaniesService, ConfirmationService, InvoiceService, DatePipe]
})
export class AddEditInvoiceComponent implements OnInit {
    groupForm: FormGroup;
    invoiceForm!: FormGroup;
    isEditMode = false;
    invoiceId!: string;
    loading = false;
    companies: Company[] = [];
    selectedCompany: Company | null = null;
    invoiceData: Invoice | null = null;

    service!: ServiceItem;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private invoiceService: InvoiceService,
        private companyService: CompaniesService,
        private globalMsgService: GlobalMessageService,
        private confirmationService: ConfirmationService,
        private datePipe: DatePipe
    ) {
        this.groupForm = this.fb.group({
            customerInvoiceNo: ['', Validators.required],
            declarationNo: ['', Validators.required]
        });
    }

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

        this.invoiceForm = this.fb.group({
            id: [''],
            invoice_number: ['', Validators.required],
            company_id: [null, Validators.required],
            invoice_date: ['', Validators.required],
            gross_amount: [0, Validators.required],
            vat_amount: [0, Validators.required],
            remarks: [''],
            company: [null],
            total_amount: [0, Validators.required],
            groups: this.fb.array([])
        });

        if (!this.isEditMode) this.addGroupToForm();

        this.companyService.getCompaniesData().subscribe({
            next: (companies) => {
                this.companies = companies;
            },
            error: () => {
                this.globalMsgService.showMessage({
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

    addGroupToForm(groupData?: any) {
        const groupsArray = this.invoiceForm.get('groups') as any;
        if (groupsArray) {
            groupsArray.push(
                this.fb.group({
                    id: [groupData?.id || ''],
                    blNo: [groupData?.blNo || ''],
                    customerInvoiceNo: [groupData?.customerInvoiceNo || ''],
                    title: [groupData?.title || '', Validators.required],
                    declarationNo: [groupData?.declarationNo || '', Validators.required],
                    items: this.fb.array(groupData?.items || [])
                })
            );
        }
    }

    moveGroupUp(index:any) {
        const groupsArray = this.invoiceForm.get('groups') as any;
        if (groupsArray && index > 0) {
            const group = groupsArray.at(index);
            groupsArray.removeAt(index);
            groupsArray.insert(index - 1, group);
        }
    }

    moveGroupDown(index) {
        const groupsArray = this.invoiceForm.get('groups') as any;
        if (groupsArray && index < groupsArray.length - 1) {
            const group = groupsArray.at(index);
            groupsArray.removeAt(index);
            groupsArray.insert(index + 1, group);
        }
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
                this.globalMsgService.showMessage({
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

            this.invoiceData.groups.map((group) => {
                this.addGroupToForm({
                    id: group.id,
                    blNo: group.blNo,
                    customerInvoiceNo: group.customerInvoiceNo,
                    title: group.title,
                    declarationNo: group.declarationNo,
                    items: group.items.map((item) => ({
                        ...item,
                        temp_id: item.temp_id || crypto.randomUUID() // Ensure temp_id is set
                    }))
                });
            });

            // Set selected company
            const company = this.companies.find((c) => String(c.id) === String(this.invoiceData?.company_id));
            if (company) {
                this.invoiceForm.controls['company'].setValue(company);
            }
            //
            // this.invoiceItemsList.push(...(this.invoiceData.items || []));
            // this.invoiceItemsList.forEach((item) => {
            //     item.temp_id = item.temp_id || crypto.randomUUID(); // Ensure temp_id is set
            // });

            console.log('Loaded invoice data:', this.invoiceData);
            console.log('Form values:', this.invoiceForm.value);
        }
    }

    private roundTo(value: number, digits: number = 3): number {
        return +value.toFixed(digits);
    }

    calculateTotal() {
        const groupsArray = this.invoiceForm.get('groups') as any;
        let invoiceItemsList: InvoiceItem[] = [];

        if (groupsArray?.length > 0) {
            groupsArray.controls.forEach((group: any) => {
                const items = group.get('items')?.value;
                if (Array.isArray(items)) {
                    invoiceItemsList.push(...items);
                }
            });
        }

        let gross = 0.0;
        let vat = 0.0;

        invoiceItemsList.forEach((item) => {
            const amount = this.roundTo(+item.amount || 0);
            const vatAmount = this.roundTo(+item.vat_amount || 0);

            gross += amount;
            vat += vatAmount;
        });

        this.invoiceForm.get('gross_amount')?.setValue(this.roundTo(gross));
        this.invoiceForm.get('vat_amount')?.setValue(this.roundTo(vat));
        this.invoiceForm.get('total_amount')?.setValue(this.roundTo(gross + vat));
    }

    onSubmit() {
        if (this.invoiceForm.invalid) {
            this.invoiceForm.markAllAsTouched();
            this.globalMsgService.showMessage({
                severity: 'error',
                summary: 'Error',
                detail: 'Please fill all required fields'
            });
            return;
        }

        this.validateGroups();
        let formValue = this.invoiceForm.value;

        const payload: Invoice = {
            id: formValue.id,
            invoice_number: formValue.invoice_number,
            company_id: formValue.company_id,
            invoice_date: formValue.invoice_date,
            gross_amount: formValue.gross_amount,
            vat_amount: formValue.vat_amount,
            total_amount: formValue.total_amount,
            remarks: formValue.remarks || null,
            groups: formValue.groups.map((group, index) => ({
                srNo: (index + 1).toString(),
                ...group,
                items: group.items.map((item) => ({
                    ...item
                }))
            }))
        };

        // console.log(payload);

        this.loading = true;

        if (this.isEditMode) {
            this.invoiceService.updateInvoice(payload).subscribe({
                next: () => {
                    this.globalMsgService.showMessage({ severity: 'success', summary: 'Success', detail: 'Invoice updated' });
                    this.loading = false;
                    this.router.navigate(['/pages/invoices']);
                },
                error: (err) => {
                    this.loading = false;
                    this.globalMsgService.showMessage({ severity: 'error', summary: 'Error', detail: err.error.message });
                    this.router.navigate(['/pages/invoices']);
                }
            });
        } else {
            this.invoiceService.createInvoice(payload).subscribe({
                next: () => {
                    this.loading = false;
                    this.globalMsgService.showMessage({ severity: 'success', summary: 'Success', detail: 'Invoice created' });
                    this.router.navigate(['/pages/invoices']);
                },
                error: (err) => {
                    console.log(err);
                    this.loading = false;
                    this.globalMsgService.showMessage({ severity: 'error', summary: 'Error', detail: err.error.message });
                }
            });
        }
    }

    validateGroups() {
        const groupsArray = this.invoiceForm.get('groups') as any;
        if (groupsArray.length === 0) {
            this.globalMsgService.showMessage({
                severity: 'error',
                summary: 'Error',
                detail: 'Please add at least one group'
            });
            return false;
        }

        for (let i = 0; i < groupsArray.length; i++) {
            const group = groupsArray.at(i);
            if (!group.valid || group.get('items').value.length === 0) {
                this.globalMsgService.showMessage({
                    severity: 'error',
                    summary: 'Error',
                    detail: `Please fill all fields in group ${i + 1}`
                });
                return false;
            }
        }
        return true;
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

    addGroup() {
        const groupsArray = this.invoiceForm.get('groups') as any;
        // if groups array last item has valid fields then add new group
        if (groupsArray.length > 0) {
            const lastGroup = groupsArray.at(groupsArray.length - 1);
            if (lastGroup.valid && lastGroup.get('items')?.value?.length > 0) {
                this.addGroupToForm();
            } else {
                lastGroup.markAllAsTouched();
                this.globalMsgService.showMessage({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Please fill the last group before adding a new one'
                });
                return;
            }
        } else {
            this.addGroupToForm();
        }
    }

    deleteGroup(groupIndex: number) {
        this.confirmationService.confirm({
            header: 'Confirm',
            message: 'Are you sure you want to delete this group?',
            icon: 'pi pi-exclamation-triangle',

            accept: () => {
                (this.invoiceForm.get('groups') as any).removeAt(groupIndex);
                this.calculateTotal();

            },
            reject: () => {}
        });
    }
}


