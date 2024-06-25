import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/data-access/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = 'ExpenseTracker';
  isAuthenticated$ = this.authService.isAuthenticated$;

  constructor() {}

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }
}
