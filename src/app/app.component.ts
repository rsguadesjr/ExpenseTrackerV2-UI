import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './home/ui/header/header.component';
import { SidebarComponent } from './home/ui/sidebar/sidebar.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { takeUntil } from 'rxjs';
import { TransactionService } from './transaction/data-access/transaction.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private router = inject(Router);

  // TODO: categoryService
  // TODO: accountService

  title = 'ExpenseTracker';
  isAuthenticated$ = this.authService.isAuthenticated$;

  constructor() {
    this.isAuthenticated$
      .pipe(takeUntilDestroyed())
      .subscribe((isAuthenticated) => {
        console.log('Authenticated 1', isAuthenticated);
        if (isAuthenticated) {
          console.log('Authenticated 2', isAuthenticated);
          this.transactionService.loadTransactions({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
          });
        } else {
          this.transactionService.resetState();
        }
      });
  }
}
