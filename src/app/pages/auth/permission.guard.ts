import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { PermissionService } from '../service/permission.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
    constructor(private perms: PermissionService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const required = route.data['permission'];
        if (!required) {
            console.error('PermissionGuard: No permission specified in route data');
            return false;
        }
        if (!this.perms.has(required)) {
            this.router.navigate(['/auth/access']);
            return false;
        }
        return true;
    }
}
