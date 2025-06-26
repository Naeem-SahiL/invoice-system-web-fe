import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleService } from '../role.service';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalMessageService } from '../../service/global-message.service';
import { NgFor, NgIf } from '@angular/common';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'app-role.form',
    imports: [
        ReactiveFormsModule,
        FormsModule,
        NgIf,
        NgFor,
        InputText,
        Checkbox,
        Button,
        TableModule
    ],
    templateUrl: './role.form.component.html',
    styleUrl: './role.form.component.scss'
})
export class RoleFormComponent implements OnInit{

    roleForm!: FormGroup;
    isEditMode = false;
    roleId!: number;
    modules: any[] = [];
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
        this.roleId = +this.route.snapshot.paramMap.get('id')!;
        this.isEditMode = !!this.roleId;

        if (this.isEditMode) {
            this.fetchRoleThenModules();
        } else {
            this.fetchModules();
        }
    }

    buildForm(): void {
        this.roleForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            isActive: [true],
            permissions: this.fb.array([])
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
        this.permissionsArray.clear();

        this.modulesWithPermissions.forEach(mod => {
            mod.permissions.forEach(p => {
                if (mod.permissionMap[p.name]) {
                    this.permissionsArray.push(this.fb.control(p.id));
                }
            });
        });
    }


    syncPermissionsToModules(): void {
        this.modulesWithPermissions.forEach(mod => {
            const permissionMap: any = {};

            this.permissionTypes.forEach(p => {
                const perm = mod.permissions.find(pm => pm.name === p);
                permissionMap[p] = perm ? this.selectedPermissions.includes(perm.id) : false;
            });

            mod.permissionMap = permissionMap;
            mod.allSelected = Object.values(permissionMap).every(Boolean);
        });
    }

    get permissionsArray(): FormArray {
        return this.roleForm.get('permissions') as FormArray;
    }

    private fetchRoleThenModules(): void {
        this.loadingPermissions = true;

        this.roleService.get(this.roleId).subscribe({
            next: (res) => {
                const role = res.data;
                this.roleForm.patchValue({
                    name: role.name,
                    description: role.description,
                    isActive: role.isActive === 1,
                });
                this.selectedPermissions = role.permissions.map((p: any) => p);
                this.fetchModules(); // fetch modules after role
            },
            error: (err) => {
                this.loadingPermissions = false;
                this.gloablMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error loading role',
                    detail: err.error?.message || 'An error occurred while loading the role.',
                });
            }
        });
    }


    private fetchModules(): void {
        this.roleService.getAllModules().subscribe({
            next: (modules) => {
                this.modulesWithPermissions = modules.map(mod => {
                    const permissionMap: any = {};
                    this.permissionTypes.forEach(p => {
                        const matched = mod.permissions.find(pm => pm.name === p);
                        permissionMap[p] = matched ? this.selectedPermissions.includes(matched.id) : false;
                    });

                    return {
                        id: mod.id,
                        name: mod.name,
                        permissions: mod.permissions,
                        permissionMap,
                        allSelected: Object.values(permissionMap).every(Boolean),
                    };
                });

                this.updatePermissionList(); // also sync FormArray with selected ones
                this.loadingPermissions = false;
            },
            error: (err) => {
                this.loadingPermissions = false;
                this.gloablMessageService.showMessage({
                    severity: 'error',
                    summary: 'Error loading permissions',
                    detail: err.error?.message || 'An error occurred while loading permissions.'
                });
            }
        });
    }
}
