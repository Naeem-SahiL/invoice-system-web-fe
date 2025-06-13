import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoice, InvoiceService } from '../../service/invoice.service';
import { ProgressBar } from 'primeng/progressbar';
import { Button } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { CommonModule, DatePipe } from '@angular/common';
import { Divider } from 'primeng/divider';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { toWords } from 'number-to-words';
import { NgxPrintModule } from 'ngx-print';
import { OrderByPipe } from '../../../pipes/order-by.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { StaticAppConfig } from '../../service/config.service';
pdfMake.vfs = pdfFonts.pdfMake.vfs;


@Component({
    selector: 'app-invoice-details',
    imports: [
        ProgressBar,
        NgxPrintModule,
        Button,
        TableModule,
        Divider,
        CommonModule,
        OrderByPipe
    ],
    templateUrl: './invoice-details.component.html',
    styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent implements OnInit {
    private invoicePdfUrl = StaticAppConfig.get('apiBaseUrl') + '/pdf-report/';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private invoiceService: InvoiceService,
        private sanitizer: DomSanitizer

    ) {}
    invoiceId: string = '';
    invoice: Invoice | null = null;
    loading: boolean = true;

    pdfUrlSafe: SafeResourceUrl



    ngOnInit(): void {
        this.invoiceId = this.route.snapshot.paramMap.get('id') ?? '';

        if (this.invoiceId) {
            this.invoiceService.getInvoiceById(this.invoiceId).subscribe({
                next: (data) => {
                    this.invoice = data;
                    this.fillImportExportServiceItems();
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error fetching invoice details:', err);
                    this.loading = false;
                }
            });

            this.invoicePdfUrl = this.invoicePdfUrl + this.invoiceId;
            this.pdfUrlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.invoicePdfUrl);
        } else {
            console.error('No invoice ID provided in route');
            this.loading = false;
        }

    }

    cancel(){
        this.router.navigate(['pages/invoices']);
    }

    fillImportExportServiceItems() {
        // if (this.invoice) {
        //     this.importServiceItems = this.invoice.items.filter(item => item.service?.service_type?.hidden_value === 'IMP');
        //     this.exportServiceItems = this.invoice.items.filter(item => item.service?.service_type?.hidden_value === 'EXP');
        //
        //     console.log(this.exportServiceItems, this.importServiceItems);
        // }
    }

    totalAmountInWords() {
      if (this.invoice?.total_amount === undefined || this.invoice?.total_amount === null) return '';

        const amount = Number(this.invoice.total_amount);
        const riyals = Math.floor(amount);
        const baiza = Math.round((amount - riyals) * 1000);
        let words = `Riyals Omani ${toWords(riyals)}`;
        if (baiza > 0) {
            words += ` and ${toWords(baiza)} Baiza`;
        }
        return words + ' Only';
    }

    pprintInvoice() {
        // check if theme is dark mode, if so, change it to light mode for printing
        if (document.body.classList.contains('dark')) {
            document.body.classList.remove('dark');
        }


        document.body.classList.add('print-mode');
        setTimeout(() => {
            window.print();
            // After printing, remove the print mode class
            // and reapply dark mode if it was previously enabled
            if (document.body.classList.contains('dark')) {
                document.body.classList.add('dark');
            }
            document.body.classList.remove('print-mode');
        }, 100);
    }

    getYearFromInvoiceDate() {
        if (this.invoice?.invoice_date) {
            const [day, month, year] = this.invoice.invoice_date.split('-');
            const date = new Date(+year, +month - 1, +day);
            return date.getFullYear().toString().slice(-2) + '/';
        }
        return '';
    }
}
