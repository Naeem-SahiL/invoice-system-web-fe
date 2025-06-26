import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../role.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalMessageService } from '../../service/global-message.service';
import { NgFor, NgIf } from '@angular/common';
import { Button } from 'primeng/button';
import { MultiSelect } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Table, TableModule } from 'primeng/table';

@Component({
    selector: 'app-role.form',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        NgIf,
        NgFor,
        MultiSelect,
        InputText,
        Checkbox,
        Button,
        TableModule
    ],
    templateUrl: './role.form.component.html',
    styleUrl: './role.form.component.scss'
})
export class RoleFormComponent {

    roleForm!: FormGroup;
    isEditMode = false;
    roleId!: number;
    modules: any[] = [];
    groupedPermissions: any[] = [];

    permissionTypes = ['create', 'update', 'delete', 'view'];
    modulesWithPermissions: any[] = [];
    selectedPermissions: any[] = []
    loadingPermissions = false;
    saving = false;


    constructor(
        public router: Router,
        private fb: FormBuilder,
        private roleService: RoleService,
        private route: ActivatedRoute,
        private gloablMessageService: GlobalMessageService
    ) { }

    ngOnInit(): void {
        this.buildForm();

        this.loadingPermissions = true;
        this.roleService.getAllModules().subscribe({
            next: modules => {
                this.modulesWithPermissions = modules.map(mod => {
                    const permissionMap: any = {};
                    this.permissionTypes.forEach(p => {
                        permissionMap[p] = !!mod.permissions.find(pm => pm.name === p && this.selectedPermissions.includes(pm.id));
                    });

                    return {
                        id: mod.id,
                        name: mod.name,
                        permissions: mod.permissions,
                        permissionMap,
                        allSelected: Object.values(permissionMap).every(Boolean)
                    };
                });
                this.loadingPermissions = false;
            },
            error: err => {
                this.loadingPermissions = false;
            }});

        this.roleId = +this.route.snapshot.paramMap.get('id')!;
        this.isEditMode = !!this.roleId;

        if (this.isEditMode) {
            this.loadingPermissions = true;

            this.roleService.get(this.roleId).subscribe(res => {
                const role = res.data;
                this.roleForm.patchValue({
                    name: role.name,
                    description: role.description,
                    isActive: role.isActive,
                    permissions: role.permissions.map((p: any) => p.id)
                });
                this.loadingPermissions = false;
            });
        }
    }

    buildForm(): void {
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            isActive: [true],
            permissions: [[]]
        });
    }

    onSubmit(): void {
        if (this.roleForm.invalid) return;

        this.saving = true;
        const payload = {
            ...this.roleForm.value,
            isActive: this.roleForm.value.isActive,
        };

        const request = this.isEditMode
            ? this.roleService.updateRole(this.roleId, payload)
            : this.roleService.createRole(payload);

        request.subscribe({
            next: () => {
                this.gloablMessageService.showMessage({
                    severity: 'success',
                    summary: 'Role saved successfully',
                    detail: this.isEditMode ? 'Role updated successfully.' : 'Role created successfully.'
                });
                this.saving = false;
                this.router.navigate(['pages/roles']);
            },
            error: err => {
                this.gloablMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error saving Role',
                    detail: err.error?.message || 'An error occurred while saving the role.'
                });
                this.saving = false;

            }
        });
    }

    groupPermissionsByModule(permissions: any[]): any[] {
        const grouped: { [key: string]: any[] } = {};
        permissions.forEach(p => {
            if (!grouped[p.module]) grouped[p.module] = [];
            grouped[p.module].push(p);
        });

        return Object.keys(grouped).map(key => ({
            label: key,
            items: grouped[key].map(p => ({
                label: p.name,
                value: p.id
            }))
        }));
    }

    onPermissionChange(module: any) {
        module.allSelected = Object.values(module.permissionMap).every(v => v);
        this.updatePermissionList();
    }

    toggleModulePermissions(module: any) {
        const value = module.allSelected;
        Object.keys(module.permissionMap).forEach(k => {
            module.permissionMap[k] = value;
        });
        this.updatePermissionList();
    }
    updatePermissionList() {
        const selectedIds: number[] = [];

        this.modulesWithPermissions.forEach(mod => {
            mod.permissions.forEach(p => {
                if (mod.permissionMap[p.name]) {
                    selectedIds.push(p.id);
                }
            });
        });

        this.roleForm.get('permissions')?.setValue(selectedIds);
    }

}
