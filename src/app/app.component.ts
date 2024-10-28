import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './home/feature/header/header.component';
import { SidebarComponent } from './home/feature/sidebar/sidebar.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  combineLatest,
  combineLatestWith,
  filter,
  forkJoin,
  map,
  startWith,
} from 'rxjs';
import { TransactionService } from './transaction/data-access/transaction.service';
import { AccountService } from './account/data-access/account.service';
import { CategoryService } from './category/data-access/category.service';
import { StatusType } from './core/constants/status-type';
import { ProgressBarModule } from 'primeng/progressbar';
import { DashboardService } from './dashboard/services/dashboard.service';
import { endOfMonth, startOfMonth } from 'date-fns';
import { TransactionActionType } from './transaction/constants/transaction-action-type';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { UiService } from './core/services/ui-service';
import { HttpErrorReporterService } from './core/services/http-error-reporter.service';
import { parseError } from './core/helpers/error-helper';
import { ErrorToastComponent } from './shared/components/error-toast/error-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ProgressBarModule,
    ToastModule,
    ErrorToastComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);
  private dashboardService = inject(DashboardService);
  private messageService = inject(MessageService);
  private uiService = inject(UiService);

  title = 'ExpenseTracker';
  isAuthenticated$ = this.authService.isAuthenticated$;

  showProgressBar$ = this.uiService.showProgressBar$.asObservable();

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

    this.accountService.state$
      .pipe(
        filter(
          (state) => state.status === StatusType.Success && !state.editMode
        ),
        takeUntilDestroyed()
      )
      .subscribe((state) => {
        // reset previous account's dashboard data
        this.dashboardService.resetState();

        const date = new Date();
        this.transactionService.loadTransactions({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          timezoneOffset: -date.getTimezoneOffset(),
          accountId: state.currentAccount?.id,
        });
      });

    // Dashboard related logic
    // this.transactionService.state$
    //   .pipe(
    //     filter((state) => state.status === StatusType.Success),
    //     takeUntilDestroyed()
    //   )
    //   .subscribe((state) => {
    //     switch (state.action) {
    //       case TransactionActionType.LoadTransactions:
    //         this.dashboardService.setTransactions(state.transactions);
    //         break;
    //       case TransactionActionType.LoadTransactionById:
    //         this.dashboardService.updateOrInsertTransaction(
    //           state.selectedTransaction!
    //         );
    //         break;
    //       case TransactionActionType.CreateTransaction:
    //         this.dashboardService.updateOrInsertTransaction(
    //           state.selectedTransaction!
    //         );
    //         break;
    //       case TransactionActionType.UpdateTransaction:
    //         this.dashboardService.updateOrInsertTransaction(
    //           state.selectedTransaction!
    //         );
    //         break;
    //       case TransactionActionType.DeleteTransaction:
    //         this.dashboardService.removeTransaction(
    //           state.selectedTransaction!.id
    //         );
    //         break;
    //     }
    //   });
  }
}
