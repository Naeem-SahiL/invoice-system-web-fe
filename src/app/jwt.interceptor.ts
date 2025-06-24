import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './pages/auth/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService);
  const token = auth.getToken();
    console.log(token);

    if (token) {
      const cloned = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(cloned);
    }

    return next(req);
};
