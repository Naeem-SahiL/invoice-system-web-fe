import { Component, ViewChild, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicesService, ServiceItem } from '../service/services.service';
import { AddEditServiceComponent } from './add-edit-service/add-edit-service.component';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';

interface Column {
    field: string;
    header: string;
    customExportHeader?: string;
}

interface ExportColumn {
    title: string;
    dataKey: string;
}

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        TextareaModule,
        InputNumberModule,
        DialogModule,
        ConfirmDialogModule,
        InputIconModule,
        IconFieldModule,
        DropdownModule,
        AddEditServiceComponent,
        TagModule
    ],
    templateUrl: './services.component.html',
    styleUrl: './services.component.scss',
    providers: [MessageService, ConfirmationService, ServicesService]
})
export class ServicesComponent {
    serviceDialog: boolean = false;
    loading = true;

    services = signal<ServiceItem[]>([]);
    service!: ServiceItem;
    selectedServices!: ServiceItem[] | null;
    submitted = false;

    serviceTypes = [
        { label: 'Imports', value: 'IMPORTS' },
        { label: 'Exports', value: 'EXPORTS' }
    ];

    cols!: Column[];
    exportColumns!: ExportColumn[];

    @ViewChild('dt') dt!: Table;

    constructor(
        private servicesService: ServicesService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'description', header: 'Description' },
            { field: 'rate', header: 'Rate' },
            { field: 'service_type', header: 'Type' },
            { field: 'active', header: 'Active' }
        ];

        this.exportColumns = this.cols.map(col => ({
            title: col.header,
            dataKey: col.field
        }));
        this.loadServices();
    }

    exportCSV() {
        this.dt.exportCSV();
    }

    loadServices() {
        this.loading = true;
        this.servicesService.getServicesData().subscribe(
            (data: ServiceItem[]) => {
                this.loading = false;
                this.services.set(data);
            },
            (error) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load services',
                    life: 3000
                });
            }
        );

    }

    openNew() {
        this.service = { service_type: {} as any };
        this.submitted = false;
        this.serviceDialog = true;
    }

    editService(service: ServiceItem) {
        this.service = { ...service };
        this.serviceDialog = true;
    }

    deleteSelectedServices() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected services?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // ids
                const ids = (this.selectedServices?.map(service => service.id).filter((id): id is string => id !== undefined)) ?? [];
                let payload : { ids: string[] } = { ids: ids };
                this.servicesService.deleteSelectedServices(payload).subscribe({
                    next: (data) => {
                        this.selectedServices = null;
                        this.loadServices();

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Services Deleted',
                            life: 3000
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete services',
                            life: 3000
                        });
                    }
                });

            }
        });
    }

    hideDialog() {
        this.serviceDialog = false;
        this.submitted = false;
        this.service = { service_type: {} as any };
    }

    saveService(isSaved: any) {
        this.submitted = true;

        if (isSaved) {
            this.loadServices();
            this.serviceDialog = false;
            this.service = { service_type: {} as any };
        }
    }

    deleteService(service: ServiceItem) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${service.name}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.servicesService.deleteService(service).subscribe({
                    next: (data) => {
                        this.services.set(this.services().filter(s => s.id !== service.id));
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Successful',
                            detail: 'Service Deleted',
                            life: 3000
                        });
                    },
                    error: (err) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete service',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    findIndexById(id: string): number {
        return this.services().findIndex(s => s.id === id);
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }
}
