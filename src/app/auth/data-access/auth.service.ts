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
import { StatusType } from '../../core/constants/status-type';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private baseUrl = environment.API_BASE_URL + 'auth';
  private firebaseAuth: Auth = inject(Auth);
  private jwtHelper = new JwtHelperService();

  private firebaseUser$ = new BehaviorSubject<User | null>(null);
  private _authState$ = new BehaviorSubject<AuthState>({
    status: StatusType.Idle,
  });

  private initialize = true;

  constructor() {
    // this.processToken();
    this.firebaseAuth.onAuthStateChanged(async (user) => {
      this.firebaseUser$.next(user);

      if (this.initialize) {
        await this.processToken();
        this.initialize = false;
      }
    });
  }

  // check if user is authenticated via firebase
  isFirebaseAuthenticated$: Observable<boolean> = authState(
    this.firebaseAuth
  ).pipe(map((user: User | null) => !!user && user.emailVerified));

  // check if user is authenticated via firebase and also the backend api
  isAuthenticated$ = this.isFirebaseAuthenticated$.pipe(
    combineLatestWith(this._authState$),
    map(
      ([isFirebaseAuthenticated, authState]) =>
        isFirebaseAuthenticated && !!authState.token
    )
  );

  login(request: LoginRequest) {
    this._authState$.next({
      status: StatusType.Loading,
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
          this._authState$.next({
            status: StatusType.Error,
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  async generateAccessToken(forceRefresh = false) {
    const result = await this.firebaseUser$.value?.getIdTokenResult(
      forceRefresh
    );
    if (result) {
      localStorage.setItem('access_token', result.token);
      this._authState$.next({
        status: StatusType.Success,
        user: result.claims,
        token: result.token,
        errors: [],
      });
    }

    return result?.token;
  }

  async signOut() {
    localStorage.removeItem('access_token');
    this._authState$.next({
      status: StatusType.Idle,
      errors: [],
    });
    await this.firebaseAuth.signOut();
  }

  get authState$(): Observable<AuthState> {
    return this._authState$.asObservable();
  }

  get authStateValue(): AuthState {
    return this._authState$.value;
  }

  setStatus(status: StatusType, errors?: string | string[]) {
    this._authState$.next({
      ...this._authState$.value,
      status,
      errors: errors ? (Array.isArray(errors) ? errors : [errors]) : [],
    });
  }

  async processToken() {
    try {
      // check if token is present in local storage, if not, sign out
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        await this.signOut();
        return;
      }

      // check if token is valid and not expired
      this.jwtHelper.decodeToken(accessToken);
      const isExpired = this.jwtHelper.isTokenExpired(accessToken);
      if (!isExpired) {
        this._authState$.next({
          status: StatusType.Success,
          token: accessToken,
          user: this.jwtHelper.decodeToken(accessToken),
        });
        return;
      }

      // if token is expired, generate a new one
      const newToken = await this.generateAccessToken(true);
      if (!newToken) {
        await this.signOut();
        return;
      }
    } catch (error) {
      console.log('Error parsing token', error);
      await this.signOut();
    }
  }
}
