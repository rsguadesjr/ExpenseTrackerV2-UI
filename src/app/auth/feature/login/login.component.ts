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
import { map } from 'rxjs';
import {
  Auth,
  GoogleAuthProvider,
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
  private router = inject(Router);
  private firebaseAuth = inject(Auth);

  errorMessages: Message[] = [];
  status = 'idle';

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor() {}

  async loginWithPassword() {
    this.loginForm.markAllAsTouched();
    this.errorMessages = [];

    if (!this.loginForm.valid || this.status === 'loading') {
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(
        this.firebaseAuth,
        this.loginForm.value.email!,
        this.loginForm.value.password!
      );

      console.log('[DEBUG]', result);

      if (!result.user.emailVerified) {
        this.router.navigate(['/email-verification']);
        return;
      }
    } catch (e: any) {
      if (
        e.code === 'auth/invalid-credential' ||
        e.code === 'auth/wrong-password' ||
        e.code === 'auth/user-not-found'
      ) {
        this.errorMessages = [
          { severity: 'error', detail: 'Invalid email or password' },
        ];
      } else {
        this.errorMessages = [
          { severity: 'error', detail: 'Something went wrong' },
        ];
      }
    }
  }

  async loginWithGoogle() {
    if (this.status === 'loading') return;

    try {
      var provider = new GoogleAuthProvider();
      await signInWithPopup(this.firebaseAuth, provider);
    } catch (e) {
      console.log(e);
    }
  }

  forgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
