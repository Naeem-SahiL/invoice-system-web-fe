import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-roles',
    imports: [Button, IconField, InputIcon, InputText, TableModule, Toolbar, NgClass, ConfirmDialog],
    providers: [ConfirmationService],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
    roles: Role[] = [];
    selectedRoles: Role[] = [];
    roleLoading: boolean = false;
    globalFilter: string = '';
    deleting : number = 0;

    constructor(
        private roleService: RoleService,
        private globalMessageService: GlobalMessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

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

    deleteSelectedRoles() {}

    editRole(role: any) {
        this.router.navigate(['/pages/roles/edit', role.id]);
    }

    deleteRole(role: any) {
        // Show confirmation dialog before deleting
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the role "${role.name}"?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.performDelete(role);
            },
            reject: () => {
                this.globalMessageService.showMessage({
                    severity: 'info',
                    summary: 'Deletion cancelled',
                    detail: `Role ${role.name} deletion has been cancelled.`
                });
            }
        });
    }

    performDelete(role){
        this.deleting = role.id;
        this.roleService.deleteRole(role.id).subscribe({
            next: () => {
                this.globalMessageService.showMessage({
                    severity: 'success',
                    summary: 'Role deleted successfully',
                    detail: `Role ${role.name} has been deleted.`
                });
                this.deleting = 0;
                this.loadRoles();
            },
            error: (err) => {
                this.globalMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error deleting role',
                    detail: err.error?.message || 'An error occurred while deleting the role.'
                });
                this.deleting = 0;
            }
        });
    }
}
