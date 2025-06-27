import { Router } from '@angular/router';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './pages/auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  let isRefreshing = false;

  // Skip logic for refresh endpoint
  const isRefreshRequest = req.url.includes('/token/refresh');

  if (token && !isRefreshRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isRefreshing &&
        token &&
        !isRefreshRequest // 🚫 Skip retry for refresh request itself
      ) {
        isRefreshing = true;

        return auth.retryLogin(token).pipe(
          switchMap((newToken) => {
            isRefreshing = false;

            if (newToken) {
              auth.saveToken(newToken);

              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });

              return next(retryRequest);
            }

            auth.logout();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          }),
          catchError(() => {
            isRefreshing = false;
            auth.logout();
            router.navigate(['/auth/login']);
            return throwError(() => error);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

