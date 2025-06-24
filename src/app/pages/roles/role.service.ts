import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Permission, Role } from './role.model';
import { StaticAppConfig } from '../service/config.service';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private apiUrl = StaticAppConfig.get('apiBaseUrl');
    constructor(private http: HttpClient) {}

    getRoles() {
        return this.http.get<any>(`${this.apiUrl}/roles`);
    }

    createRole(data: any) {
        return this.http.post(`${this.apiUrl}/roles`, data);
    }

    updateRole(id: number, data: any) {
        return this.http.put(`${this.apiUrl}/roles/${id}`, data);
    }

    getPermissions() {
        return this.http.get<Permission[]>('/api/permissions');
    }
}
