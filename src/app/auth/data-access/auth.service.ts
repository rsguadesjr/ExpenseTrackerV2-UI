import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  combineLatestWith,
  from,
  map,
  switchMap,
  take,
} from 'rxjs';
import { AuthState } from '../models/auth-state.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  Auth,
  IdTokenResult,
  ParsedToken,
  User,
  authState,
  signInWithCustomToken,
  verifyBeforeUpdateEmail,
} from '@angular/fire/auth';
import { LoginRequest } from '../models/login-request';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private baseUrl = environment.API_BASE_URL + 'auth';
  private auth: Auth = inject(Auth);
  private jwtHelper = new JwtHelperService();

  private authState$ = new BehaviorSubject<AuthState>({
    status: 'idle',
  });

  constructor() {
    try {
      const accessToken = localStorage.getItem('access_token');

      if (accessToken) {
        this.jwtHelper.decodeToken(accessToken);
        const isExpired = this.jwtHelper.isTokenExpired(accessToken);
        if (!isExpired) {
          this.authState$.next({
            status: 'success',
            token: accessToken,
            user: this.jwtHelper.decodeToken(accessToken),
          });
        } else {
          this.signOut();
        }
      }
    } catch (error) {
      console.log('Error parsing token', error);
      this.signOut();
    }
  }

  // check if user is authenticated via firebase
  isFirebaseAuthenticated$: Observable<boolean> = authState(this.auth).pipe(
    map((user: User | null) => !!user && user.emailVerified)
  );

  // check if user is authenticated via firebase and also the backend api
  isAuthenticated$ = this.isFirebaseAuthenticated$.pipe(
    combineLatestWith(this.authState$),
    map(
      ([isFirebaseAuthenticated, authState]) =>
        isFirebaseAuthenticated && !!authState.token
    )
  );

  // claims$: Observable<ParsedToken | null> = authState(this.auth).pipe(
  //   switchMap((user: User | null) => {
  //     if (user) {
  //       return from(user.getIdTokenResult());
  //     }
  //     return from(Promise.resolve(null));
  //   }),
  //   map((token: IdTokenResult | null) => !!token && token.claims)
  // );

  login(request: LoginRequest) {
    this.authState$.next({
      status: 'loading',
    });
    return this.httpClient
      .post<string>(`${this.baseUrl}/token/login`, request)
      .pipe(take(1))
      .subscribe({
        next: async () => {
          // after backend validation, or some custom claims added
          // we have to re-generate the access token to get the updated claims
          await this.generateAccessToken(true);
        },
        error: (error: HttpErrorResponse) => {
          this.authState$.next({
            status: 'error',
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  async generateAccessToken(forceRefresh = false) {
    const result = await this.auth.currentUser?.getIdTokenResult(forceRefresh);
    if (result) {
      localStorage.setItem('access_token', result.token);
      this.authState$.next({
        status: 'success',
        user: result.claims,
        token: result.token,
        errors: [],
      });
      return result.token;
    }

    return '';
  }

  async signOut() {
    localStorage.removeItem('access_token');
    this.authState$.next({
      status: 'idle',
      errors: [],
    });
    await this.auth.signOut();
  }

  get authState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }
}
