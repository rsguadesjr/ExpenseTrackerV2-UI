import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  from,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../../auth/data-access/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isRefreshing = false;
  const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  let token = authService.authStateValue.token;
  console.log('[DEBUG][authInterceptor] token', token);
  if (token) {
    req = addTokenHeader(req, token);
  }

  return next(req).pipe(
    catchError((httpErrorResponse: HttpErrorResponse) => {
      if (
        !['login', 'token/login'].includes(req.url.toLowerCase()) &&
        httpErrorResponse.status === HttpStatusCode.Unauthorized
      ) {
        if (!isRefreshing) {
          return from(authService.generateAccessToken()).pipe(
            switchMap((token) => {
              if (token) {
                req = addTokenHeader(req, token);
                return next(req);
              } else {
                return throwError(() => httpErrorResponse);
              }
            }),
            catchError((error) => {
              authService.signOut();
              return throwError(() => error);
            })
          );
        }
        return refreshTokenSubject.pipe(
          filter((token) => !!token),
          take(1),
          switchMap((token) => next(addTokenHeader(req, token)))
        );
      }

      return throwError(() => httpErrorResponse);
    })
  );
};

function addTokenHeader(request: HttpRequest<any>, token: string) {
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`),
  });
}
