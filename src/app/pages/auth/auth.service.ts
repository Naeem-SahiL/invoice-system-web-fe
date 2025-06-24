import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { StaticAppConfig } from '../service/config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private apiBaseUrl = StaticAppConfig.get('apiBaseUrl')

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { user_name: string; password: string }) {
    return this.http.post<{ token: string }>(this.apiBaseUrl + '/user/login', credentials);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
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
}
