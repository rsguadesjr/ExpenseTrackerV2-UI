import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, from, map, switchMap, take } from 'rxjs';
import { AuthState } from '../models/auth-state.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  Auth,
  IdTokenResult,
  ParsedToken,
  User,
  authState,
  verifyBeforeUpdateEmail,
} from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient = inject(HttpClient);
  private baseUrl = environment.API_BASE_URL + 'auth';

  private auth: Auth = inject(Auth);
  authState$ = authState(this.auth);

  isAuthenticated$: Observable<boolean> = authState(this.auth).pipe(
    map((user: User | null) => !!user && user.emailVerified)
  );

  claims$: Observable<ParsedToken | null> = authState(this.auth).pipe(
    switchMap((user: User | null) => {
      if (user) {
        return from(user.getIdTokenResult());
      }
      return from(Promise.resolve(null));
    }),
    map((token: IdTokenResult | null) => !!token && token.claims)
  );
}
