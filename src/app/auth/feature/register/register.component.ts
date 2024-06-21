import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControlOptions,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { map, repeat } from 'rxjs';
import { AuthService } from '../../data-access/auth.service';
import { Message } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  private authService = inject(AuthService);
  private router = inject(Router);

  authState$ = this.authService.authState;
  errorMessages$ = this.authState$.pipe(
    map((authState) =>
      authState.errors
        ? authState.errors.map((error) => ({
            closable: true,
            severity: 'error',
            summary: 'Error',
            detail: error,
          }))
        : []
    )
  );

  constructor() {
    this.authService.authState
      .pipe(takeUntilDestroyed())
      .subscribe((authState) => {
        console.log(authState);
        if (authState.status === 'success') {
          this.router.navigate(['/']);
        }
      });
  }

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

  onSubmit() {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.valid) {
      console.log(this.registerForm.value);
      const form = this.registerForm.value;
      this.authService.register(form.email!, form.name!, form.password!);
    }
  }
}
