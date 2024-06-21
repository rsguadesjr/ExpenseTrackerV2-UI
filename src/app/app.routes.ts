import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    data: { title: 'dashboard' },
    loadComponent: () =>
      import('./expenses/feature/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'login',
    data: { title: 'login' },
    loadComponent: () =>
      import('./auth/feature/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    data: { title: 'register' },
    loadComponent: () =>
      import('./auth/feature/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
];
