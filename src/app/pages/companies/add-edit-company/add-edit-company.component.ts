import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FluidModule } from 'primeng/fluid';
import { SelectModule } from 'primeng/select';
import { Company } from '../../service/companies.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageModule } from 'primeng/message';

@Component({
    selector: 'app-add-edit-company',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        InputTextModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        FloatLabelModule,
        MessageModule
    ],
    templateUrl: './add-edit-company.component.html',
    styleUrl: './add-edit-company.component.scss'
})
export class AddEditCompanyComponent {
    @Input() visible = false;
    @Input() company: Company | null = null;
    @Output() save = new EventEmitter<Company>();
    @Output() close = new EventEmitter<void>();

    form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['company'] && this.form) {
      this.form.patchValue(this.company || {});
    }
  }

  buildForm() {
    // create the form with validation
      this.form = this.fb.group({
          id: [this.company?.id || null],
          name: [this.company?.name || '', Validators.required],
          address: [this.company?.address || '', Validators.required],
          phone: [this.company?.phone || '', Validators.pattern(/^\+?[0-9]*$/)],
          email: [this.company?.email || '', [Validators.required, Validators.email]],
          vat_no: [this.company?.vat_no || '', [Validators.required]],
      });
  }

  onSave() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  onClose() {
    this.form.reset();
    this.close.emit();
  }
}
