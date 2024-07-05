import { Component, inject } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { TransactionService } from '../../../transaction/data-access/transaction.service';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import {
  combineLatest,
  debounceTime,
  forkJoin,
  from,
  map,
  of,
  take,
  withLatestFrom,
} from 'rxjs';
import { TagModule } from 'primeng/tag';
import { AccountService } from '../../../account/data-access/account.service';
import { getDaysInMonth, isSameDay } from 'date-fns';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { CategoryService } from '../../../category/data-access/category.service';
import { TableModule } from 'primeng/table';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { FormsModule } from '@angular/forms';
import { DashboardTransactionListComponent } from '../../ui/dashboard-transaction-list/dashboard-transaction-list.component';
import { DashboardCategorySummaryComponent } from '../../ui/dashboard-category-summary/dashboard-category-summary.component';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MenuModule,
    CalendarModule,
    TagModule,
    ChartModule,
    ProgressBarModule,
    TableModule,
    ToggleButtonModule,
    DashboardTransactionListComponent,
    DashboardCategorySummaryComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  dashboardService = inject(DashboardService);
  accountService = inject(AccountService);
  categoryService = inject(CategoryService);
  router = inject(Router);

  currentAccount$ = this.accountService.state$.pipe(
    map((state) => state.currentAccount)
  );

  state$ = this.dashboardService.state$.pipe(
    map((state) => {
      const totalAmount = state.transactions.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );

      const recentTransactions = state.transactions.slice(0, 5);
      return {
        ...state,
        totalAmount,
        recentTransactions,
      };
    })
  );

  // get the total amount of each category
  // to be used for Categorized Chart
  categorizedData$ = combineLatest([
    this.dashboardService.state$.pipe(map((state) => state.transactions)),
    this.categoryService.state$.pipe(map((state) => state.categories)),
  ]).pipe(
    map(([_transactions, _categories]) => {
      const categories = _categories.map((x) => ({ id: x.id, name: x.name }));

      // Add "Uncategorized" category if there are no transactions with null category
      if (_transactions.find((x) => x.category === null)) {
        categories.push({ id: null!, name: 'Uncategorized' });
      }

      const overallAmount = _transactions.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      return categories
        .map((category) => {
          const totalAmount = _transactions
            .filter((transaction) => transaction.category?.id == category.id)
            .reduce((acc, curr) => acc + curr.amount, 0);
          return {
            name: category.name,
            totalAmount,
            percentage: (totalAmount / overallAmount) * 100,
          };
        })
        .sort((a, b) => b.totalAmount - a.totalAmount);
    })
  );

  showDetails = false;
  // get the top 5 transactions based on amount
  topTransactions$ = this.dashboardService.state$.pipe(
    map((state) => {
      const transactions = state.transactions.slice();
      return transactions.sort((a, b) => b.amount - a.amount).slice(0, 5);
    })
  );

  transctionsByDate$ = this.dashboardService.state$.pipe(
    map((state) => {
      const daysInMonth = getDaysInMonth(new Date());
      const dates = Array.from(
        { length: daysInMonth },
        (_, index) =>
          new Date(new Date().getFullYear(), new Date().getMonth(), index + 1)
      );
      const data = dates.map((date) => {
        const transactions = state.transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transactionDate);
          return isSameDay(date, transactionDate);
        });
        const totalAmount = transactions.reduce(
          (acc, curr) => acc + curr.amount,
          0
        );

        return {
          date,
          transactions,
          totalAmount,
        };
      });

      return data;
    })
  );

  highestDailyTransaction$ = this.transctionsByDate$.pipe(
    map((data) => {
      if (data.length === 0) {
        return null;
      }

      return data.slice().sort((a, b) => b.totalAmount - a.totalAmount)[0];
    })
  );

  highestCategoryTransaction$ = this.categorizedData$.pipe(
    map((data) => {
      if (data.length === 0) {
        return {
          name: '',
          totalAmount: 0,
          percentage: 0,
        };
      }

      return data.slice().sort((a, b) => b.totalAmount - a.totalAmount)[0];
    })
  );

  chartData$ = this.state$.pipe(
    map((state) => {
      const documentStyle = getComputedStyle(document.documentElement);
      const daysInMonth = getDaysInMonth(new Date());
      const dates = Array.from(
        { length: daysInMonth },
        (_, index) =>
          new Date(new Date().getFullYear(), new Date().getMonth(), index + 1)
      );

      const data = dates.map((date) => {
        const transactions = state.transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.transactionDate);
          return isSameDay(date, transactionDate);
        });
        const totalAmount = transactions.reduce(
          (acc, curr) => acc + curr.amount,
          0
        );

        return { date, transactions, totalAmount };
      });

      return {
        labels: dates.map((date) => date.getDate()),
        datasets: [
          {
            label: 'Amount',
            data: data.map((d) => d.totalAmount),
            fill: true,
            borderColor: documentStyle.getPropertyValue('--orange-500'),
            tension: 0.5,
            backgroundColor: documentStyle.getPropertyValue('--orange-800'),
          },
        ],
      };
    })
  );

  chartOptions$ = of(null).pipe(
    map(() => {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--text-color');
      const textColorSecondary = documentStyle.getPropertyValue(
        '--text-color-secondary'
      );
      const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
      return {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary,
            },
            grid: {
              color: surfaceBorder,
            },
          },
          y: {
            ticks: {
              color: textColorSecondary,
            },
            grid: {
              color: surfaceBorder,
            },
          },
        },
      };
    })
  );

  tableMenuItems: MenuItem[] = [
    {
      label: 'View All',
      command: () => {
        console.log('Test');
        this.router.navigateByUrl('/transactions');
      },
    },
  ];
}
