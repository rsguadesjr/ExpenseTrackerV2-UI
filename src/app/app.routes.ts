import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { authLoggedInGuard } from './core/guards/auth-logged-in.guard';
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    data: { title: 'dashboard' },
    canActivate: [authGuard],
    loadComponent: () =>
      import('./expenses/feature/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'login',
    data: { title: 'login' },
    canActivate: [authLoggedInGuard],
    loadComponent: () =>
      import('./auth/feature/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    data: { title: 'register' },
    canActivate: [authLoggedInGuard],
    loadComponent: () =>
      import('./auth/feature/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    data: { title: 'forgot-password' },
    canActivate: [authLoggedInGuard],
    loadComponent: () =>
      import('./auth/feature/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'email-verification',
    data: { title: 'email-verification' },
    canActivate: [authLoggedInGuard],
    loadComponent: () =>
      import(
        './auth/feature/email-verification/email-verification.component'
      ).then((m) => m.EmailVerificationComponent),
  },
  {
    path: 'transactions',
    data: { title: 'transactions' },
    canActivate: [authGuard],
    loadChildren: () =>
      import(
        './transaction/feature/transaction-shell/transaction-shell-routing.module'
      ).then((m) => m.TransactionShellRoutingModule),
  },
  {
    path: 'accounts',
    data: { title: 'accounts' },
    canActivate: [authGuard],
    loadChildren: () =>
      import('./account/feature/account-shell/account-shell.module').then(
        (m) => m.AccountShellModule
      ),
  },

  { path: '**', redirectTo: 'dashboard' },
];
