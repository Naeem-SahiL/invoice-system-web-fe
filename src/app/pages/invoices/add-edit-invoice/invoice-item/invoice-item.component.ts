import { Component, EventEmitter, Input, OnInit, Output, output } from '@angular/core';
import { InvoiceGroup, InvoiceItem } from '../../../service/invoice.service';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmationService } from 'primeng/api';
import { AddEditInvoiceItemComponent } from '../add-edit-invoice-item/add-edit-invoice-item.component';
import { Toast } from 'primeng/toast';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { NgIf } from '@angular/common';
import { Message } from 'primeng/message';
import { group } from '@angular/animations';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Observable } from 'rxjs';
import { GlobalMessageService } from '../../../service/global-message.service';

@Component({
    selector: 'app-invoice-item',
    imports: [Button, TableModule, AddEditInvoiceItemComponent, Toast, FormsModule, InputText, ReactiveFormsModule, Select, NgIf, Message],
    templateUrl: './invoice-item.component.html',
    styleUrl: './invoice-item.component.scss'
})
export class InvoiceItemComponent implements OnInit {
    @Output() calculateTotal = new EventEmitter<boolean>();

    constructor(private confirmationService: ConfirmationService,
                private globalMessageService: GlobalMessageService) {}

    inputTypes = [
        { label: 'Invoice No', value: 'invoiceNo' },
        { label: 'BL No', value: 'blNo' }
    ];

    @Input() group: FormGroup;

    selectedItem: InvoiceItem | null = null;
    invoiceItemDialogueVisible = false;

    ngOnInit() {
        if (this.group.get('id').value === '') {
            this.inputTypeChange(this.inputTypes[0]); // Default to BL No if no ID
        }else{
            // If the group already has an ID, we assume it's an existing invoice and set the input type accordingly
            const customerInvoiceNo = this.group.get('customerInvoiceNo').value;
            const blNo = this.group.get('blNo').value;

            if (customerInvoiceNo) {
                this.inputTypeChange(this.inputTypes[0]); // Invoice No
            } else if (blNo) {
                this.inputTypeChange(this.inputTypes[1]); // BL No
            } else {
                this.inputTypeChange(this.inputTypes[0]); // Default to Invoice No
            }
        }
    }

    inputTypeChange(value: any) {
        let invoiceNoCtrl = this.group.get('customerInvoiceNo');
        let blNoCtrl = this.group.get('blNo');

        if (value.value === 'invoiceNo') {
            blNoCtrl.setValue(null);
            blNoCtrl.removeValidators([Validators.required]);
            blNoCtrl.updateValueAndValidity();
            blNoCtrl.disable();

            invoiceNoCtrl.setValidators([Validators.required]);
            invoiceNoCtrl.updateValueAndValidity();
            invoiceNoCtrl.enable();
        } else {
            invoiceNoCtrl.setValue(null);
            invoiceNoCtrl.removeValidators([Validators.required]);
            invoiceNoCtrl.updateValueAndValidity();
            invoiceNoCtrl.disable();

            blNoCtrl.setValidators([Validators.required]);
            blNoCtrl.updateValueAndValidity();
            blNoCtrl.enable();
        }
    }

    hideDialog() {
        this.invoiceItemDialogueVisible = false;
        this.selectedItem = null;
    }

    addInvoiceItem() {
        if(!this.group.valid){
          (this.group as FormGroup).markAllAsTouched();
            this.globalMessageService.showMessage({
                severity: 'error',
                summary: 'Invalid Form',
                detail: 'Please fill all required fields before adding an item.'
            })
            return;
        }

        this.invoiceItemDialogueVisible = true;
        this.selectedItem = null;

    }

    editInvoiceItem(item: InvoiceItem) {
        this.selectedItem = item;
        this.invoiceItemDialogueVisible = true;
        // // this.service = item.service || { service_type: {} as any };
    }

    saveInvoiceItem(item: InvoiceItem) {
        let itemArray = this.group.get('items').value || [];
        if (item.temp_id !== null && item.temp_id !== undefined && item.temp_id !== '') {
            const existingIndex = itemArray.findIndex((i) => i.temp_id === item.temp_id);
            if (existingIndex > -1) {
                itemArray[existingIndex] = item; // Update existing item
            }
        } else {
            item.temp_id = crypto.randomUUID();
            itemArray.push(item); // Add new item
        }

        this.invoiceItemDialogueVisible = false;
        this.selectedItem = null;
        this.calculateTotal.emit(true);
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
     let itemArray = this.group.get('items').value || [];
     const index = itemArray.findIndex((i) => i.temp_id === item.temp_id);
     if (index > -1) {
         itemArray.splice(index, 1);
         this.calculateTotal.emit(true);
     }
 }

    protected readonly Validators = Validators;
}
