import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/data-access/auth.service';

export const authLoggedInGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.authStateValue.user) {
    const urlRedirect = route.queryParams['returnUrl'] || '/';
    router.navigateByUrl(urlRedirect);
    return false;
  }

  return true;
};
