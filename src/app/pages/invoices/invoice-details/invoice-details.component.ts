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
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
    selector: 'app-invoice-details',
    imports: [
        ProgressBar,
        Button,
        TableModule,
        Divider,
        CommonModule
    ],
    templateUrl: './invoice-details.component.html',
    styleUrl: './invoice-details.component.scss'
})
export class InvoiceDetailsComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private invoiceService: InvoiceService

    ) {}
    invoiceId: string = '';
    invoice: Invoice | null = null;
    loading: boolean = true;
    ngOnInit(): void {
        this.invoiceId = this.route.snapshot.paramMap.get('id') ?? '';

        if (this.invoiceId) {
            this.invoiceService.getInvoiceById(this.invoiceId).subscribe({
                next: (data) => {
                    this.invoice = data;
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Error fetching invoice details:', err);
                    this.loading = false;
                }
            });
        } else {
            console.error('No invoice ID provided in route');
            this.loading = false;
        }

    }

    cancel(){
        this.router.navigate(['pages/invoices']);
    }

    printInvoice() {

    }

    downloadPDF() {
        const docDefinition: any = {
    content: [
      { text: 'Invoice Details', style: 'header' },
      {
        columns: [
          [
            { text: `Invoice #: ${this.invoice?.invoice_number}`, style: 'subheader' },
            { text: `Invoice Date: ${this.invoice?.invoice_date}` },
          ],
        ],
        margin: [0, 0, 0, 10],
      },
      {
        text: `Company: ${this.invoice?.company?.name}`,
        margin: [0, 0, 0, 2],
        bold: true,
      },
      {
        text: `Company Address: ${this.invoice?.company?.address}`,
        margin: [0, 0, 0, 2],
      },
      {
        text: `Remarks: ${this.invoice?.remarks}`,
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', '*', '*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Sr.', style: 'tableHeader' },
              { text: 'Description', style: 'tableHeader' },
              { text: 'Service Name', style: 'tableHeader' },
              { text: 'QTY', style: 'tableHeader' },
              { text: 'Rate', style: 'tableHeader' },
              { text: 'Vat Amount', style: 'tableHeader' },
              { text: 'Total Amount', style: 'tableHeader' },
            ],
            ...(this.invoice?.items || []).map((item: any) => [
              item.sr_no_group,
              item.description,
              item.service?.name || '',
              item.quantity,
              item.rate,
              item.vat_amount,
              item.total_amount,
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 10],
      },
      {
        style: 'summaryTable',
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Gross Amount:', this.invoice?.gross_amount],
            ['VAT Amount:', this.invoice?.vat_amount],
            ['Total Amount:', this.invoice?.total_amount],
          ],
        },
        layout: 'noBorders',
      },
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 12,
        bold: true,
      },
      tableHeader: {
        bold: true,
        fillColor: '#eeeeee',
      },
      summaryTable: {
        margin: [0, 10, 0, 0],
      },
    },
    defaultStyle: {
      fontSize: 10,
    },
  };

  pdfMake.createPdf(docDefinition).download(`Invoice_${this.invoice?.invoice_number}.pdf`);
    }
}
