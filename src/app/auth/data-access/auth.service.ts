import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, take } from 'rxjs';
import { AuthState } from '../models/auth-state.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private baseUrl = environment.API_BASE_URL + 'auth';
  private jwtHelperService = inject(JwtHelperService);
  private firebaseAuth = inject(Auth);

  private authState$ = new BehaviorSubject<AuthState>({ status: 'pending' });

  constructor() {
    const authState = this.authState$.getValue();
    if (localStorage.getItem('token')) {
      const token = localStorage.getItem('token')! as string;
      try {
        const decodedToken = this.jwtHelperService.decodeToken(token);
        const isTokenExpired = this.jwtHelperService.isTokenExpired(token);
        if (decodedToken && !isTokenExpired) {
          authState.token = token;
          authState.user = decodedToken;
        }
      } catch (e) {
        console.log('Error decoding token', e);
      }
    }

    this.authState$.next(authState);
  }

  loginWithPassword(email: string, password: string) {
    return this.httpClient
      .post(this.baseUrl + '/login', { email, password })
      .pipe(take(1))
      .subscribe({
        next: (v: any) => {
          console.log(v);
          localStorage.setItem('token', v.token);
          this.setCurrentUser(v.token);
          this.setStatus('success');
        },
        error: (e: HttpErrorResponse) => {
          console.log(e);
          this.setStatus('error', e.error?.detail || e.message);
        },
      });
  }

  loginWithToken(data: { token: string; provider: string }) {
    this.setStatus('loading');
    return this.httpClient
      .post(this.baseUrl + '/social', data)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          // get refreshed token
          const token = await this.firebaseAuth.currentUser?.getIdToken(true);
          if (token) {
            localStorage.setItem('token', token);
            this.setCurrentUser(token);
            this.setStatus('success');
          } else {
            this.firebaseAuth.signOut();
          }
        },
        error: (e: HttpErrorResponse) => {
          console.log(e);
          this.setStatus('error', e.error?.detail || e.message);
          this.firebaseAuth.signOut();
        },
      });
  }

  register(email: string, name: string, password: string) {
    this.setStatus('loading');
    return this.httpClient
      .post(this.baseUrl + '/register', { email, firstName: name, password })
      .pipe(take(1))
      .subscribe({
        next: (v: any) => {
          localStorage.setItem('token', v.token);
          this.setCurrentUser(v.token);
          this.setStatus('success');
        },
        error: (e: HttpErrorResponse) => {
          console.log(e);
          const errors = this.decodeErrors(e);
          this.setStatus('error', errors);
        },
      });
  }

  get authState() {
    return this.authState$.asObservable();
  }

  get authStateValue() {
    return this.authState$.value;
  }

  private setCurrentUser(token: string) {
    if (token) {
      const decodedToken = this.jwtHelperService.decodeToken(token);
      this.authState$.next({
        ...this.authState$.value,
        token,
        user: decodedToken,
      });
    } else {
      this.authState$.next({ ...this.authState$.value, token, user: null });
    }
  }

  private setStatus(
    status: 'loading' | 'success' | 'error',
    errors?: string[]
  ) {
    this.authState$.next({ ...this.authState$.value, status, errors });
  }

  private decodeErrors(errorResponse: HttpErrorResponse) {
    if (errorResponse.error.detail) {
      return [errorResponse.error.detail];
    }

    // if errorResponse.error.errors is type of object
    if (errorResponse.error.errors instanceof Object) {
      const errors: string[] = [];
      // loop through the object keys
      Object.keys(errorResponse.error.errors).forEach((key) => {
        // loop through the array of errors
        errorResponse.error.errors[key].forEach((error: string) => {
          errors.push(error);
        });
      });

      return errors;
    }

    return [errorResponse.message];
  }
}
