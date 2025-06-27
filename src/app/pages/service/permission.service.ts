import { Injectable } from '@angular/core';
import { Constants } from '../../shared/constants';

@Injectable({ providedIn: 'root' })
export class PermissionService {
    private get decodedUser(): any {
        const user = localStorage.getItem(Constants.AUTH_USER);
        return user ? JSON.parse(user) : {};
    }

    private get permissionSlugs(): string[] {
        const permissions = this.decodedUser.permissions || [];

        // If permissions are in object format, map to "module.action"
        return permissions.map((p: any) =>
            typeof p === 'string' ? p : `${p.module}.${p.action}`
        );
    }

    has(permission: string): boolean {
        return this.permissionSlugs.includes(permission);
    }

    hasAny(perms: string[]): boolean {
        return perms.some(p => this.has(p));
    }
}
