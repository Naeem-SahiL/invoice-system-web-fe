import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ServiceItem, ServicesService } from '../../service/services.service';
import { Message } from 'primeng/message';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-add-edit-service',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DialogModule, InputTextModule, TextareaModule, ButtonModule, FloatLabelModule, InputNumberModule, DropdownModule, InputSwitchModule, Message],
    templateUrl: './add-edit-service.component.html',
    styleUrl: './add-edit-service.component.scss'
})
export class AddEditServiceComponent {
    @Input() visible = false;
    @Input() service: ServiceItem | null = null;
    @Output() save = new EventEmitter<boolean>();
    @Output() close = new EventEmitter<void>();

    form!: FormGroup;

    // Assuming these are the dropdown values for service_type_id
    serviceTypes: any[] = [];

    constructor(
        private fb: FormBuilder,
        private _service: ServicesService,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        // Fetch service types from the service
        this._service.getServiceTypeLookup().subscribe((data) => {
            this.serviceTypes = data.map((item) => ({
                id: item.id,
                value: item.visible_value
            }));
        });
        this.buildForm();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['service'] && this.form && this.serviceTypes.length > 0) {
            const typeObj = this.serviceTypes.find((type) => type.id === this.service?.service_type_id);
            this.form.patchValue({
                ...this.service,
                service_type_id: typeObj || null
            });
        }
    }

    buildForm() {
        this.form = this.fb.group({
            id: [this.service?.id || null],
            name: [this.service?.name || '', Validators.required],
            description: [this.service?.description || '', Validators.required],
            rate: [this.service?.rate || 0, [Validators.required, Validators.min(0)]],
            vat_percentage: [this.service?.vat_percentage || 0, [Validators.required, Validators.min(0)]],
            service_type_id: [this.service?.service_type_id || 0, Validators.required],
            active: [this.service?.active || 0]
        });
    }

    onSave() {
        if (this.form.valid) {
            let payload = {
                ...this.form.value,
                service_type_id: this.form.value.service_type_id.id
            };

            console.log('Form is valid:', payload);
            this.saveService(payload);
        }
    }

    saveService(service: ServiceItem) {
        if (service.id) {
            this._service.updateService(service).subscribe({
                next: (data) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Service Updated',
                        life: 3000
                    });

                    this.save.emit(true);
                },
                error: (err) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err?.error?.message || 'Failed to update service',
                        life: 3000
                    });
                }
            });
        } else {
            this._service.addService(service).subscribe({
                next: (data) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Successful',
                        detail: 'Service Created',
                        life: 3000
                    });
                    //    this.loadServices();
                    this.save.emit(true);
                },
                error: (err) => {
                    console.error('Error creating service:', err);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err?.error?.message || 'Failed to create service',
                        life: 3000
                    });
                }
            });
        }
    }

    onClose() {
        this.form.reset();
        this.close.emit();
    }
}
