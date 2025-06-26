import { NgClass, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import { Role } from './role.model';
import { RoleService } from './role.service';
import { GlobalMessageService } from '../service/global-message.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-roles',
    imports: [Button, IconField, InputIcon, InputText, TableModule, Toolbar, NgClass, NgIf],

    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent {
    roles: Role[] = [];
    selectedRoles: Role[] = [];
    roleLoading: boolean = false;
    globalFilter: string = '';
    showPasswordDialog = false;
    selectedUserId!: number;

    constructor(
        private roleService: RoleService,
        private globalMessageService: GlobalMessageService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadRoles();
    }

    loadRoles(): void {
        this.roleLoading = true;
        this.roleService.getRoles().subscribe({
            next: (res) => (this.roles = res.data),
            error: (err) => {
                this.globalMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error loading roles',
                    detail: err.message || 'An error occurred while loading roles.'
                });
                this.roleLoading = false;
            },
            complete: () => (this.roleLoading = false)
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/pages/roles/new']);
    }

    deleteSelectedRoles() { }

    editUser(user: any) {
        this.router.navigate(['/pages/roles/edit', user.id]);
    }

    deleteUser(user: any) { }

}
