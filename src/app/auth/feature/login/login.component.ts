import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../data-access/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MessagesModule } from 'primeng/messages';
import { BehaviorSubject, combineLatestWith, map } from 'rxjs';
import {
  Auth,
  GoogleAuthProvider,
  OAuthProvider,
  getAdditionalUserInfo,
  sendEmailVerification,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
} from '@angular/fire/auth';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { Message } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    RouterModule,
    MessagesModule,
    PasswordModule,
    DividerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private firebaseAuth = inject(Auth);

  status = 'idle';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  private passwordLoginErrors$ = new BehaviorSubject<string[]>([]);

  errorMessages$ = this.authService.authState.pipe(
    map((authState) => authState.errors || []),
    combineLatestWith(this.passwordLoginErrors$),
    map(([authStateErrors, passwordLoginErrors]) =>
      [...authStateErrors, ...passwordLoginErrors].map(
        (error) => ({ severity: 'error', detail: error } as Message)
      )
    ),
    takeUntilDestroyed()
  );

  constructor() {
    this.authService.isAuthenticated$.pipe(takeUntilDestroyed()).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          this.router.navigate(['/']);
        }
      },
    });
  }

  async loginWithPassword() {
    this.loginForm.markAllAsTouched();
    this.passwordLoginErrors$.next([]);

    if (!this.loginForm.valid || this.status === 'loading') {
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(
        this.firebaseAuth,
        this.loginForm.value.email!,
        this.loginForm.value.password!
      );

      if (!result.user.emailVerified) {
        this.router.navigate(['/email-verification']);
        return;
      }

      // validate token to backend api
      const idToken = await result.user.getIdToken();
      this.authService.login({
        idToken: idToken,
        provider: 'password',
        email: result.user.email as string,
        name: result.user.displayName as string,
      });
    } catch (e: any) {
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/user-not-found'
      ) {
        this.passwordLoginErrors$.next(['Invalid email or password']);
      } else {
        this.passwordLoginErrors$.next(['Something went wrong']);
      }
    }
  }

  async loginWithGoogle() {
    if (this.status === 'loading') return;

    try {
      var provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const IdTokenResult = await result.user.getIdTokenResult();

      this.authService.login({
        idToken: idToken,
        provider: 'google',
        email: result.user.email as string,
        name: result.user.displayName as string,
      });
    } catch (e) {
      console.log(e);
    }
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
