import { Role } from '../roles/role.model';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    user_name: string;
    is_active: boolean;
    roles: Role[];
}
