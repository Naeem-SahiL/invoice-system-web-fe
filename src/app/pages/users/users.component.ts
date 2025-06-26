import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { Toolbar } from 'primeng/toolbar';
import { User } from './user.model';
import { UserService } from './users.service';
import { GlobalMessageService } from '../service/global-message.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { Dialog } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';

@Component({
    selector: 'app-users',
    imports: [Button, IconField, InputIcon, InputText, TableModule, Toolbar, NgClass, NgForOf, NgIf, ChangePasswordComponent, Dialog],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss',
    providers: [ConfirmationService]
})
export class UsersComponent {
    users: User[] = [];
    selectedUsers: User[] = [];
    userLoading: boolean = false;
    globalFilter: string = '';
    showPasswordDialog = false;
    selectedUserId!: number;

    constructor(
        private userService: UserService,
        private globalMessageService: GlobalMessageService,
        private confirmationService: ConfirmationService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.userLoading = true;
        this.userService.getUsers().subscribe({
            next: (res) => (this.users = res),
            error: (err) => {
                this.globalMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error loading users',
                    detail: err.message || 'An error occurred while loading users.'
                });
                this.userLoading = false;
            },
            complete: () => (this.userLoading = false)
        });
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.router.navigate(['/pages/users/new']);
    }

    deleteSelectedUsers() {}

    editUser(user: any) {
        this.router.navigate(['/pages/users/edit', user.id]);
    }

    deleteUser(user: any) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete user ${user.name}?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.performDelete(user);
            },
            reject: () => {
                this.globalMessageService.showMessage({
                    severity: 'info',
                    summary: 'Cancelled',
                    detail: 'User deletion cancelled.'
                });
            }
        })
    }

    performDelete(user: any) {
        this.userService.deleteUser(user.id).subscribe({
            next: () => {
                this.globalMessageService.showMessage({
                    severity: 'success',
                    summary: 'Success',
                    detail: `User ${user.name} deleted successfully.`
                });
                this.loadUsers(); // Refresh the user list
            },
            error: (err) => {
                this.globalMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.message || 'An error occurred while deleting the user.'
                });
            }
        });
    }

    openPasswordDialog(userId: number) {
        this.selectedUserId = userId;
        console.log(this.selectedUserId);
        this.showPasswordDialog = true;
    }

    onPasswordChanged(data: any) {

        this.userService.updatePassword(this.selectedUserId, data).subscribe({
            next: () => {
                this.globalMessageService.showMessage({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Password changed successfully.'
                });
                this.showPasswordDialog = false;
            },
            error: (err) => {
                this.globalMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.message || 'An error occurred while changing the password.'
                });
            }
        });
    }
}
