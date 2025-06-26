import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StaticAppConfig } from '../service/config.service';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { jwtDecode as jwt_decode } from 'jwt-decode';
import { Constants } from '../../shared/constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private tokenKey = Constants.AUTH_TOKEN;
    private userKey = Constants.AUTH_USER;
    private apiBaseUrl = StaticAppConfig.get('apiBaseUrl')

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: { user_name: string; password: string }) {
        return this.http.post<{ token: string }>(this.apiBaseUrl + '/user/login', credentials);
    }

    saveToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
        const decoded = jwt_decode(token);
        localStorage.setItem(this.userKey, JSON.stringify(decoded));
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        this.router.navigate(['/auth/login']);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    retryLogin(token): Observable<string | null> {

        return this.http.post<{ token: string }>(this.apiBaseUrl + '/token/refresh', {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).pipe(
            switchMap(res => of(res.token)),
            catchError(() => of(null))
        );
    }
}
