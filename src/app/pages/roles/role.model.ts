export interface Role {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
    permissions: Permission[];
}

export interface Permission {
    id: number;
    module: string;
    action: string;
}
