import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { StatusType } from '../../../core/constants/status-type';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

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
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private firebaseAuth = inject(Auth);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  errorMessages$ = this.authService.authState$.pipe(
    map((authState) => authState.errors || []),
    map((errors) =>
      errors.map(
        (error) => ({ severity: StatusType.Error, detail: error } as Message)
      )
    ),
    takeUntilDestroyed()
  );

  authState$ = this.authService.authState$;

  constructor() {
    this.authService.isAuthenticated$.pipe(takeUntilDestroyed()).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          // get returnUrl from query params
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
        }
      },
    });
  }

  async loginWithPassword() {
    this.loginForm.markAllAsTouched();

    if (
      !this.loginForm.valid ||
      this.authService.authStateValue.status === StatusType.Loading
    ) {
      return;
    }

    try {
      this.authService.setStatus(StatusType.Loading);
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
        this.authService.setStatus(
          StatusType.Error,
          'Invalid email or password'
        );
      } else {
        this.authService.setStatus(StatusType.Error, 'Something went wrong');
      }
    }
  }

  async loginWithGoogle() {
    if (this.authService.authStateValue.status === StatusType.Loading) {
      return;
    }

    try {
      var provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const idToken = await result.user.getIdToken();
      const IdTokenResult = await result.user.getIdTokenResult();

      this.authService.setStatus(StatusType.Loading);
      this.authService.login({
        idToken: idToken,
        provider: 'google',
        email: result.user.email as string,
        name: result.user.displayName as string,
      });
    } catch (e: any) {
      console.log(e);
      if (
        e.code !== 'auth/popup-closed-by-user' &&
        e.code !== 'auth/cancelled-popup-request'
      ) {
        this.authService.setStatus(StatusType.Error, 'Something went wrong');
      }
    }
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
