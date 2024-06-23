import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControlOptions,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, map, repeat } from 'rxjs';
import { AuthService } from '../../data-access/auth.service';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateCurrentUser,
  updateProfile,
} from '@angular/fire/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MessagesModule,
    ButtonModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private router = inject(Router);
  private firebaseAuth = inject(Auth);

  status = 'idle';
  errorMessages: Message[] = [];

  constructor() {}

  registerForm = new FormGroup(
    {
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: this.passwordMatchValidator } as AbstractControlOptions
  );

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
  }

  async onSubmit() {
    this.registerForm.markAllAsTouched();
    this.errorMessages = [];

    if (!this.registerForm.valid) {
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(
        this.firebaseAuth,
        this.registerForm.value.email!,
        this.registerForm.value.password!
      );

      await updateProfile(result.user, {
        displayName: this.registerForm.value.name,
      });

      const emailVerified = result.user.emailVerified;
      if (!emailVerified) {
        sendEmailVerification(result.user, {
          url: window.location.origin + '/login',
        });
        this.router.navigate(['/email-verification']);
        return;
      }
    } catch (e: any) {
      const code = e.code;
      switch (code) {
        case 'auth/email-already-in-use':
          this.errorMessages = [
            { severity: 'error', summary: 'Email already in use' },
          ];
          break;
        case 'auth/invalid-email':
          this.errorMessages = [
            { severity: 'error', summary: 'Invalid email' },
          ];
          break;
        case 'auth/operation-not-allowed':
          this.errorMessages = [
            { severity: 'error', summary: 'Operation not allowed' },
          ];
          break;
        case 'auth/weak-password':
          this.errorMessages = [
            { severity: 'error', summary: 'Try a stronger password' },
          ];
          break;
        default:
          this.errorMessages = [
            {
              severity: 'error',
              summary:
                'Something went wrong. Please try again or contact support',
            },
          ];
          break;
      }
      console.log(e);
    }
  }
}
