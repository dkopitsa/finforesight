import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(NzMessageService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        if (error.status === 401 || error.status === 307) {
          // 401 = Unauthorized
          // 307 = Temporary Redirect (fallback for old FastAPI HTTPBearer behavior)
          errorMessage = 'Unauthorized. Please login again.';
          // Clear storage and redirect to login
          localStorage.clear();
          router.navigate(['/auth/login']);
        } else if (error.status === 403) {
          errorMessage = 'Access forbidden';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found';
        } else if (error.status === 422) {
          // Validation error from FastAPI
          if (error.error?.detail) {
            if (Array.isArray(error.error.detail)) {
              errorMessage = error.error.detail
                .map((err: any) => err.msg)
                .join(', ');
            } else {
              errorMessage = error.error.detail;
            }
          }
        } else if (error.status === 500) {
          errorMessage = 'Internal server error';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }
      }

      // Display error message
      messageService.error(errorMessage);

      return throwError(() => error);
    })
  );
};
