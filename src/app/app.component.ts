import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './home/feature/header/header.component';
import { SidebarComponent } from './home/feature/sidebar/sidebar.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatestWith, filter, map } from 'rxjs';
import { TransactionService } from './transaction/data-access/transaction.service';
import { AccountService } from './account/data-access/account.service';
import { CategoryService } from './category/data-access/category.service';
import { StatusType } from './core/constants/status-type';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ProgressBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);

  title = 'ExpenseTracker';
  isAuthenticated$ = this.authService.isAuthenticated$;

  showProgressBar$ = this.transactionService.state$.pipe(
    combineLatestWith(this.accountService.state$, this.categoryService.state$),
    map(
      ([transactionState, accountState, categoryState]) =>
        transactionState.status === StatusType.Loading ||
        accountState.status === StatusType.Loading ||
        categoryState.status === StatusType.Loading
    )
  );

  constructor() {
    this.isAuthenticated$
      .pipe(takeUntilDestroyed())
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.accountService.loadAccounts();
          this.categoryService.loadCategories();
        } else {
          this.accountService.resetState();
          this.transactionService.resetState();
          this.categoryService.resetState();
        }
      });

    // subscribe to account changes except wh
    this.accountService.state$
      .pipe(
        filter(
          (state) => state.status === StatusType.Success && !state.editMode
        ),
        takeUntilDestroyed()
      )
      .subscribe((state) => {
        console.log('Account State', state);
        const date = new Date();
        this.transactionService.loadTransactions({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          timezoneOffset: -date.getTimezoneOffset(),
          accountId: state.currentAccount?.id,
        });
      });
  }
}
