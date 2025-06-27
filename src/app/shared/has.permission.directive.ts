import {
    Directive,
    Input,
    TemplateRef,
    ViewContainerRef,
    OnInit
} from '@angular/core';
import { PermissionService } from '../pages/service/permission.service';

@Directive({
    selector: '[hasPermission]'
})
export class HasPermissionDirective implements OnInit {
    private requiredPermissions: string[] = [];

    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private permissionService: PermissionService
    ) {}

    @Input()
    set hasPermission(value: string | string[]) {
        this.requiredPermissions = Array.isArray(value) ? value : [value];
        this.updateView();
    }

    ngOnInit(): void {
        this.updateView();
    }

    private updateView(): void {
        this.viewContainer.clear();

        if (this.permissionService.hasAny(this.requiredPermissions)) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        }
    }
}
