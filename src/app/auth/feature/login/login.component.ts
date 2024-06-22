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
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';

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
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private firebaseAuth = inject(Auth);

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

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  constructor() {
    this.authService.authState
      .pipe(takeUntilDestroyed())
      .subscribe((authState) => {
        if (authState.status === 'success') {
          const returnUrl = this.router.parseUrl(this.router.url).queryParams[
            'returnUrl'
          ];
          this.router.navigate([returnUrl || '/']);
        }
      });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.loginWithPassword(
        this.loginForm.value.email!,
        this.loginForm.value.password!
      );
    }
  }

  async googleLogin() {
    try {
      var provider = new GoogleAuthProvider();
      provider.addScope('profile');
      const result = await signInWithPopup(this.firebaseAuth, provider);
      const token = await result?.user?.getIdToken();

      this.authService.loginWithToken({ token, provider: 'google' });
    } catch (e) {
      console.log(e);
    }
  }
}
