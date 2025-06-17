import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PaymentsService } from '../../service/payments.service';
import { GlobalMessageService } from '../../service/global-message.service';
import { Card } from 'primeng/card';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { FileRemoveEvent, FileUpload } from 'primeng/fileupload';
import { Textarea } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { InputText } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { FloatLabel } from 'primeng/floatlabel';

@Component({
    selector: 'app-add-payment',
    imports: [Card, TableModule, Button, FileUpload, Textarea, FormsModule, DatePipe, DecimalPipe, InputGroup, InputGroupAddon, InputText, IconField, InputIcon, FloatLabel, NgIf, NgForOf],
    templateUrl: './add-payment.component.html',
    styleUrl: './add-payment.component.scss'
})
export class AddPaymentComponent implements OnInit {
    @Input() companyId!: number;
    @Output() paymentsSelected = new EventEmitter<any>();
    @Output() closeDialog = new EventEmitter<void>();

    state = {
        first: 0,
        rows: 10,
        totalRecords: 0,
        globalFilter: ''
    };

    outstandingInvoices: any[] = [];
    selectedInvoices: any[] = [];
    remarks: string = '';
    uploadedFiles: File[] = [];
    loading: boolean = false;
    private lastTableEvent: any = this.state;

    constructor(
        private paymentService: PaymentsService,
        private globalMsgService: GlobalMessageService
    ) {}

    ngOnInit(): void {
        if (this.companyId) {
            this.loadOutstandingInvoices();
        } else {
            // this.showError('Company ID is missing');
            this.companyId = 15;
            this.loadOutstandingInvoices();
        }
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    onLazyLoad(event: any) {
        this.lastTableEvent = event;
        this.loadOutstandingInvoices();
    }

    loadOutstandingInvoices() {
        this.loading = true;

        let params = {
            first: this.lastTableEvent.first,
            rows: this.lastTableEvent.rows,
            globalFilter: this.lastTableEvent.globalFilter || '',
            company_id: this.companyId.toString()
        }

        this.paymentService.getOutstandingInvoices(params).subscribe({
            next: (res) => {
                this.outstandingInvoices = res.data;
                this.state.totalRecords = res.total;
                this.loading = false;
            },
            error: () => {
                this.showError('Failed to load outstanding invoices');
                this.loading = false;
            }
        });
    }

    onFilesSelected(event: any) {
        if (event.files) {
            this.uploadedFiles = [...event.files];
        }
    }

    done() {
        if (!this.selectedInvoices.length) {
            this.showError('Please select at least one invoice');
            return;
        }

        this.paymentsSelected.emit({
            invoices: this.selectedInvoices,
            remarks: this.remarks,
            files: this.uploadedFiles
        });
        this.closeDialog.emit();
    }

    private showError(detail: string) {
        this.globalMsgService.showMessage({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }

    onFileRemove($event: FileRemoveEvent) {
        const removedFile = $event.file;
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== removedFile.name);
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
}
