import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { NgIf } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    imports: [PrimeTemplate, ReactiveFormsModule, NgIf, Button]
})
export class ChangePasswordComponent {
    @Input() visible = false;
    @Input() userId!: number;
    @Output() close = new EventEmitter<void>();
    @Output() passwordChanged = new EventEmitter<any>();

    passwordForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.passwordForm = this.fb.group(
            {
                password: ['', [Validators.required, Validators.minLength(6)]],
                confirmPassword: ['', [Validators.required]]
            },
            {
                validators: this.passwordMatchValidator
            }
        );
    }

    passwordMatchValidator(group: FormGroup) {
        const pass = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return pass === confirm ? null : { mismatch: true };
    }

    onSubmit() {
        if (this.passwordForm.invalid) return;

        // 🔥 Replace this with actual API call
        console.log('Change password for user', this.userId, this.passwordForm.value.password);
        let data = {
            userId: this.userId,
            password: this.passwordForm.value.password,
            confirmPassword: this.passwordForm.value.confirmPassword
        }
        this.passwordChanged.emit(data);
        this.onClose();
    }

    onClose() {
        this.passwordForm.reset();
        this.close.emit();
    }
}
