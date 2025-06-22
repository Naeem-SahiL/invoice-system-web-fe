import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from './user.model';
import { StaticAppConfig } from '../service/config.service';

@Injectable({ providedIn: 'root' })
export class UserService {
    private apiUrl = StaticAppConfig.get('apiBaseUrl');
    constructor(private http: HttpClient) {}

    getUsers() {
        return this.http.get<User[]>(`${(this.apiUrl)}/users`);
    }

    createUser(data: any) {
        return this.http.post(`${(this.apiUrl)}/users`, data);
    }

    updateUser(id: number, data: any) {
        return this.http.put(`${this.apiUrl}/users/${id}`, data);
    }

    getUser(id: number) {
        return this.http.get<User>(`${(this.apiUrl)}/users/${id}`);
    }

    updatePassword(selectedUserId: number, data: any) {
        return this.http.put(`${this.apiUrl}/users/${selectedUserId}/update-password`, data);
    }
}
