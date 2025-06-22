import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Role } from '../../roles/role.model';
import { UserService } from '../users.service';
import { RoleService } from '../../roles/role.service';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../user.model';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Checkbox } from 'primeng/checkbox';
import { Button, ButtonDirective, ButtonLabel } from 'primeng/button';
import { NgIf } from '@angular/common';
import { GlobalMessageService } from '../../service/global-message.service';
import { Toolbar } from 'primeng/toolbar';

@Component({
    selector: 'app-user.form',
    imports: [ReactiveFormsModule, InputText, MultiSelect, Checkbox, ButtonDirective, Button, ButtonLabel, NgIf, Toolbar],
    templateUrl: './user.form.component.html',
    styleUrl: './user.form.component.scss'
})
export class UserFormComponent {
    userForm!: FormGroup;
    isEditMode = false;
    roles: Role[] = [];
    userId?: number;
    saving = false;

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private roleService: RoleService,
        protected router: Router,
        private route: ActivatedRoute,
        private gloablMessageService: GlobalMessageService
    ) {}

    ngOnInit(): void {
        this.userId = Number(this.route.snapshot.paramMap.get('id'));
        this.isEditMode = !!this.userId;

        this.initForm();
        this.loadRoles();

        if (this.isEditMode) {
            this.loadUser();
        }
    }

    initForm(): void {
        this.userForm = this.fb.group({
            first_name: ['', Validators.required],
            last_name: ['', Validators.required],
            user_name: ['', Validators.required],
            password: [''],
            is_active: [true],
            roles: [[]]
        });
    }

    loadRoles(): void {
        this.roleService.getRoles().subscribe({
            next: (res) => (this.roles = res.data),
            error: (err) => {
                this.gloablMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error loading roles',
                    detail: err.error?.message || 'An error occurred while loading roles.'
                });
            }
        });
    }

    loadUser(): void {
        this.saving = true;
        this.userService.getUser(this.userId!).subscribe({
            next: (user: User) => {
                this.userForm.patchValue({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    user_name: user.user_name,
                    is_active: user.is_active,
                    roles: user.roles.map((r) => r.id)
                });
            },
            error: (err) => {
                this.gloablMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error loading user',
                    detail: err.error?.message || 'An error occurred while loading users.'
                });
            },
            complete: () => {
                this.saving = false;
            }
        });
    }

    onSubmit(): void {
        if (this.userForm.invalid) return;

        const formValue = this.userForm.value;
        const payload = {
            ...formValue,
            roles: formValue.roles
        };

        const request = this.isEditMode ? this.userService.updateUser(this.userId!, payload) : this.userService.createUser(payload);

        this.saving = true;
        request.subscribe({
            next: (res) => {
                this.gloablMessageService.showMessage({
                    severity: 'success',
                    summary: 'User saved successfully',
                    detail: this.isEditMode ? 'User updated successfully.' : 'User created successfully.'
                });
                this.router.navigate(['/pages/users']);
            },
            error: (err) => {
                this.gloablMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error saving user',
                    detail: err.error?.message || 'An error occurred while saving the user.'
                });
                this.saving = false;
            },
            complete: () => {
                this.saving = false;
            }
        });
    }
}
