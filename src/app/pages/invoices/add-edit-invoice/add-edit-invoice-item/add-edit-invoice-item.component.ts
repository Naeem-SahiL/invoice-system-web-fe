import { Component, Input, Output, EventEmitter, SimpleChanges, ViewChild, OnInit, OnChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { Message } from 'primeng/message';
import { Select, SelectModule } from 'primeng/select';

import { ServiceItem, ServicesService } from '../../../service/services.service';
import { InvoiceItem } from '../../../service/invoice.service';

@Component({
    selector: 'app-add-edit-invoice-item',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DialogModule, InputTextModule, TextareaModule, ButtonModule, FloatLabelModule, InputNumberModule, DropdownModule, InputSwitchModule, SelectModule, Message],
    templateUrl: './add-edit-invoice-item.component.html',
    styleUrl: './add-edit-invoice-item.component.scss'
})
export class AddEditInvoiceItemComponent implements OnInit, AfterViewInit {
    @Input() visible = false;

    @Input() invoiceItem: InvoiceItem | null = null;

    @Output() save = new EventEmitter<InvoiceItem>();
    @Output() close = new EventEmitter<void>();

    @ViewChild('serviceSelect') serviceSelect!: Select;

    form!: FormGroup;
    serviceTypes: any[] = [];
    services: ServiceItem[] = [];
    fullServices: ServiceItem[] = [];
    serviceType: any = null;

    constructor(
        private fb: FormBuilder,
        private serviceApi: ServicesService
    ) {}

    ngOnInit() {
        this.buildForm();
        this.loadServiceTypes();
        this.loadServices();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['invoiceItem'] && this.form) {
            console.log('Invoice item changed:', this.invoiceItem);
            this.patchFormWithInvoiceData();
        }
    }

    ngAfterViewInit() {
        this.form.get('quantity')?.valueChanges.subscribe(() => {
            this.calculateAmountFromQuantityAndRate();
            this.calculateVatAndTotal();
        });

        this.form.get('rate')?.valueChanges.subscribe(() => {
            this.calculateAmountFromQuantityAndRate();
            this.calculateVatAndTotal();
        });

        this.form.get('amount')?.valueChanges.subscribe(() => {
            this.calculateVatAndTotal();
        });

        // vat amount change
        this.form.get('vat_amount')?.valueChanges.subscribe(() => {
            const amount = this.form.get('amount')?.value || 0;
            const vat_amount = this.form.get('vat_amount')?.value || 0;
            const total_amount = amount + vat_amount;

            this.form.patchValue({ total_amount }, { emitEvent: false });
        });
    }

    private roundTo(value: number, digits: number = 3): number {
        return +value.toFixed(digits);
    }

    private calculateAmountFromQuantityAndRate() {
        const quantity = +this.form.get('quantity')?.value || 0;
        const rate = +this.form.get('rate')?.value || 0;
        const amount = this.roundTo(quantity * rate);

        this.form.patchValue({ amount }, { emitEvent: false });
    }

    private calculateVatAndTotal() {
        const amount = +this.form.get('amount')?.value || 0;
        const vatPercentage = +this.form.get('service')?.value?.vat_percentage || 0;

        const vat_amount = this.roundTo((amount * vatPercentage) / 100);
        const total_amount = this.roundTo(amount + vat_amount);

        this.form.patchValue({ vat_amount, total_amount }, { emitEvent: false });
    }


    buildForm() {
        this.form = this.fb.group({
            id: [null],
            temp_id: [null],
            service_id: [null],
            service: [null],
            // sr_no_group: [null, Validators.required],
            description: ['', Validators.required],
            rate: [0, [Validators.required, Validators.min(0)]],
            quantity: [0, [Validators.required, Validators.min(0)]],
            amount: [0, [Validators.required, Validators.min(0)]],
            vat_amount: [0, [Validators.required, Validators.min(0)]],
            total_amount: [0, [Validators.required, Validators.min(0)]]
        });
    }

    loadServiceTypes() {
        this.serviceApi.getServiceTypeLookup().subscribe((data) => {
            this.serviceTypes = data.map((type) => ({
                id: type.id,
                value: type.visible_value
            }));
        });
    }

    loadServices() {
        this.serviceApi.getServicesData().subscribe((data) => {
            this.fullServices = data;
            this.services = [...data];
        });
    }

    patchFormWithInvoiceData() {
        if (!this.invoiceItem) {
            return;
        }
        const item = this.invoiceItem!;
        const selectedType = this.serviceTypes.find((t) => t.id === item.service?.service_type_id);
        const selectedService = this.fullServices.find((s) => String(s.id) === String(item.service_id));

        this.serviceType = selectedType;
        this.services = this.fullServices.filter((s) => s.service_type_id === selectedType?.id);

        this.form.patchValue({
            ...item,
            service_id: item.service?.id || null,
            service: selectedService || null
        });
        console.log('Form patched with invoice item data:', this.form.value);
    }

    onServiceTypeChange(type: any) {
        if (!type) {
            this.services = [...this.fullServices];
            this.resetFormFields();
            return;
        }

        this.serviceType = type;
        this.services = this.fullServices.filter((s) => s.service_type_id === type?.id);
        this.resetFormFields();
    }

    onServiceChange(service: ServiceItem) {
        if (!service) return;
        this.form.patchValue({
            service_id: service?.id || null,
            service: service,
            description: service?.description || '',
            rate: service?.rate || 0,
            quantity: 1
        });

        this.serviceType = this.serviceTypes.find((t) => t.id === service?.service_type_id) || null;
        this.services = this.fullServices.filter((s) => s.service_type_id === this.serviceType?.id);
    }

    updateAmounts() {
        const quantity = this.form.get('quantity')?.value || 0;
        const rate = this.form.get('rate')?.value || 0;
        const amount = quantity * rate;
        const vat = (amount * (this.form.get('service')?.value?.vat_percentage || 0)) / 100;

        this.form.patchValue(
            {
                amount,
                vat_amount: vat,
                total_amount: amount + vat
            },
            { emitEvent: false }
        );
    }

    resetFormFields() {
        this.serviceSelect?.clear();
        this.form.patchValue({
            service_id: null,
            service: null,
            description: '',
            rate: 0,
            quantity: 1,
            amount: 0,
            vat_amount: 0,
            total_amount: 0
        });
    }

    onSave() {
        if (this.form.valid) {
            this.save.emit(this.form.value);
            this.resetFormFields();
            this.form.reset();
            this.serviceSelect?.clear();
            this.serviceType = null;
            this.invoiceItem = null;
            this.services = [...this.fullServices];
        }
    }

    onClose() {
        this.form.reset();
        this.resetFormFields();
        this.serviceSelect?.clear();
        this.serviceType = null;
        this.invoiceItem = null;
        this.close.emit();
    }
}
