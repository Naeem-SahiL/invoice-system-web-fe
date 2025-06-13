import { Component, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Product, ProductService } from '../service/product.service';
import { CompaniesService, Company } from '../service/companies.service';
import { AddEditCompanyComponent } from './add-edit-company/add-edit-company.component';
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
    selector: 'app-companies',
    imports: [
        CommonModule,
        TableModule,
        FormsModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        RatingModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        RadioButtonModule,
        InputNumberModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        AddEditCompanyComponent
    ],
    standalone: true,
    templateUrl: './companies.component.html',
    styleUrl: './companies.component.scss',
    providers: [MessageService, CompaniesService, ConfirmationService]
})
export class CompaniesComponent {
    companyDialog: boolean = false;
    loading = true;
    error = false;

        companies = signal<Company[]>([{}]);

        company!: Company;

        selectedCompanies!: Company[] | null;

        submitted: boolean = false;

        statuses!: any[];

        @ViewChild('dt') dt!: Table;

        exportColumns!: ExportColumn[];

        cols!: Column[];

        constructor(
            private companiesService: CompaniesService,
            private messageService: MessageService,
            private confirmationService: ConfirmationService
        ) {}

        exportCSV() {
            this.dt.exportCSV();
        }

        ngOnInit() {
            this.loadData();
        }

        loadData() {
            this.loading = true;
            this.companiesService.getCompaniesData().subscribe({
                next: (data) => {
                    this.companies.set(data);
                    this.loading = false;
                },
                error: (err) => {
                    this.loading = false;
                    this.error = true;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to load companies data',
                        life: 3000
                    });
                }
            });

            this.statuses = [
                { label: 'INSTOCK', value: 'instock' },
                { label: 'LOWSTOCK', value: 'lowstock' },
                { label: 'OUTOFSTOCK', value: 'outofstock' }
            ];

            this.cols = [
                { field: 'name', header: 'Name' },
                { field: 'address', header: 'Address' },
                { field: 'phone', header: 'Phone' },
                { field: 'email', header: 'Email' }
            ];

            this.exportColumns = this.cols.map((col) => ({ title: col.header, dataKey: col.field }));
        }

        onGlobalFilter(table: Table, event: Event) {
            table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
        }

        openNew() {
            this.company = {};
            this.submitted = false;
            this.companyDialog = true;
        }

        editCompany(product: Product) {
            this.company = { ...product };
            this.companyDialog = true;
        }

        deleteSelectedCompanies() {
            this.confirmationService.confirm({
                message: 'Are you sure you want to delete the selected companies?',
                header: 'Confirm',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.companies.set(this.companies().filter((val) => !this.selectedCompanies?.includes(val)));
                    // ids
                    const ids = this.selectedCompanies?.map((company) => company.id).filter((id): id is string => id !== undefined) ?? [];
                    let payload : { ids: string[] } = { ids: ids };
                    this.companiesService.deleteSelectedCompanies(payload).subscribe({
                        next: (data) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Companies Deleted',
                                life: 3000
                            });
                            this.loadData();
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to delete companies',
                                life: 3000
                            });
                        }
                    });
                    this.selectedCompanies = null;

                }
            });
        }

        hideDialog() {
            console.log('Dialog hidden');
            this.companyDialog = false;
            this.submitted = false;
            this.company = {};
        }

        deleteCompany(company: Product) {
            this.confirmationService.confirm({
                message: 'Are you sure you want to delete ' + company.name + '?',
                header: 'Confirm',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.loading = true;
                    this.companiesService.deleteCompany(company.id!).subscribe({
                        next: (data) => {
                            this.company = {};
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Company Deleted',
                                life: 3000
                            });
                            this.loadData();
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to delete company',
                                life: 3000
                            });
                            this.company = {};
                            this.loading = false;
                        }
                    });
                }
            });
        }

        findIndexById(id: string): number {
            let index = -1;
            for (let i = 0; i < this.companies().length; i++) {
                if (this.companies()[i].id === id) {
                    index = i;
                    break;
                }
            }

            return index;
        }

        saveCompany(company: Company) {
            console.log('Company saved:', company);
            this.submitted = true;

            this.loading = true;
            if (company.name?.trim()) {
                if (company.id) {
                    this.companiesService.updateCompany(company).subscribe({
                        next: (data) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Company Updated',
                                life: 3000
                            });

                            this.loadData();
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to update company',
                                life: 3000
                            });
                            this.loading = false;
                        }
                    });
                } else {
                    this.companiesService.addCompany(company).subscribe({
                        next: (data) => {
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Successful',
                                detail: 'Company Created',
                                life: 3000
                            });
                           this.loadData();
                        },
                        error: (err) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Failed to create company',
                                life: 3000
                            });
                            this.loading = false;
                        }
                    });
                }

                this.companyDialog = false;
                this.company = {};
            }
        }
}
