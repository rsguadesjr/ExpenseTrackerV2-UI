import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  from,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { AuthService } from '../../auth/data-access/auth.service';

@Injectable()
export class AuthInterceptorX implements HttpInterceptor {
  private authService = inject(AuthService);

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let authReq = req;
    let token = this.authService.authStateValue.token;
    if (token) {
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((httpErrorResponse: HttpErrorResponse) => {
        if (
          !req.url.toLowerCase().includes('api/auth/login') &&
          httpErrorResponse.status === HttpStatusCode.Unauthorized
        ) {
          return this.handle401Error(authReq, next);
        }

        return throwError(() => httpErrorResponse);
      })
    );
  }

  private handle401Error(req: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const x = from(this.authService.generateAccessToken()).pipe(
        switchMap((token) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          return next.handle(this.addTokenHeader(req, token!));
        }),
        catchError((error) => {
          this.isRefreshing = false;

          this.authService.signOut();
          return throwError(() => error);
        })
      );

      // return this.authService.refreshToken().pipe(
      //   switchMap((token) => {
      //     this.isRefreshing = false;

      //     this.authService.setAuthData(token);
      //     const user = this.authService.getAuthData();
      //     this.store.dispatch(loginSuccess({ user }));

      //     this.refreshTokenSubject.next(token);
      //     return next.handle(this.addTokenHeader(req, token));
      //   }),
      //   catchError((error) => {
      //     this.isRefreshing = false;

      //     this.authService.signOut();
      //     return throwError(() => error);
      //   })
      // );
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => !!token),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(req, token)))
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
  }
}
