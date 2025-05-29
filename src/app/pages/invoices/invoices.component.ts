import { Component, signal, ViewChild } from '@angular/core';
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
import { Invoice, InvoiceService } from '../service/invoice.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoices',
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
            ConfirmDialogModule
  ],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss',
providers: [MessageService, ConfirmationService, InvoiceService]
})
export class InvoicesComponent {
    invoiceDialog = false;
    loading = true;
    error = false;

    invoices = signal<Invoice[]>([]);
    selectedInvoices: Invoice[] = [];
    invoice!: Invoice;

    @ViewChild('dt') dt!: Table;

    constructor(
        private router: Router,
        private invoiceService: InvoiceService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadInvoices();
    }

    loadInvoices() {
        this.loading = true;
        this.invoiceService.getInvoiceData().subscribe({
            next: (data) => {
                this.invoices.set(data);
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.error = true;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load invoices',
                    life: 3000
                });
            }
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNewInvoice() {
        this.router.navigate(['/pages/invoices/create']);
    }

    hideDialog() {
        this.invoiceDialog = false;
        this.invoice = {};
    }

    editInvoice(invoice: Invoice) {
       this.router.navigate(['/pages/invoices/edit', invoice.id]);
    }

    saveInvoice(invoice: Invoice) {
        if (invoice.id) {
            this.invoiceService.updateInvoice(invoice).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Updated',
                        detail: 'Invoice updated successfully',
                        life: 3000
                    });
                    this.loadInvoices();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update invoice',
                        life: 3000
                    });
                }
            });
        } else {
            this.invoiceService.createInvoice(invoice).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Created',
                        detail: 'Invoice created successfully',
                        life: 3000
                    });
                    this.loadInvoices();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create invoice',
                        life: 3000
                    });
                }
            });
        }

        this.invoiceDialog = false;
        this.invoice = {};
    }

    deleteInvoice(invoice: Invoice) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete invoice #${invoice.invoice_number}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.invoiceService.deleteInvoice(invoice).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: 'Invoice deleted successfully',
                            life: 3000
                        });
                        this.loadInvoices();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete invoice',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    deleteSelectedInvoices() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected invoices?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedInvoices.map(inv => inv.id).filter((id): id is number => id !== undefined) ?? [];
                this.invoiceService.deleteSelectedInvoices({ ids }).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Deleted',
                            detail: 'Selected invoices deleted',
                            life: 3000
                        });
                        this.selectedInvoices = [];
                        this.loadInvoices();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete selected invoices',
                            life: 3000
                        });
                    }
                });
            }
        });
    }

    viewInvoice(invoice: Invoice) {
        this.router.navigate(['/pages/invoices/view', invoice.id]);
    }


}
