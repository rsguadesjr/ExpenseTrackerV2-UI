import {
  afterNextRender,
  AfterRenderPhase,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { endOfMonth, getDaysInMonth, isSameDay, startOfMonth } from 'date-fns';
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
import { TransactionStore } from '../../../transaction/data-access/transaction.store';
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
  // dashboardService = inject(DashboardService);
  // transctionService = inject(TransactionService);
  accountService = inject(AccountService);
  categoryService = inject(CategoryService);
  router = inject(Router);
  transactionStore = inject(TransactionStore);

  currentAccount = this.accountService.currentAccount;
  transactions = computed(() => this.transactionStore.dashboard().transactions);
  categories = this.categoryService.categories;

  date = signal(new Date());
  dateParams = computed(() => {
    const _date = this.date();
    const daysInMonth = getDaysInMonth(_date);

    return {
      start: startOfMonth(_date),
      end: endOfMonth(_date),
      daysInMonth: daysInMonth,
      daysInMonthArray: Array.from(
        { length: daysInMonth },
        (_, index) => new Date(_date.getFullYear(), _date.getMonth(), index + 1)
      ),
    };
  });

  // transactions for the month
  dailyTransactionData = computed(() => {
    const allUserTransactions = this.transactions();
    const daysInMonthArray = this.dateParams().daysInMonthArray;

    return daysInMonthArray.map((date) => {
      const transactions = allUserTransactions.filter((transaction) =>
        isSameDay(date, new Date(transaction.transactionDate))
      );

      const totalAmount = transactions.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );

      return {
        date,
        totalAmount,
        transactions,
      };
    });
  });

  //
  monthlyTransactions = computed(() =>
    this.dailyTransactionData()
      .map((x) => x.transactions)
      .flat()
  );

  // transaction summary
  totalTransactionAmount = computed(() =>
    this.dailyTransactionData().reduce((acc, curr) => acc + curr.totalAmount, 0)
  );

  recentTransactions = computed(() => this.monthlyTransactions().slice(0, 5));

  topTransactions = computed(() => {
    return [...this.monthlyTransactions()]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  highestDailyTransaction = computed(() => {
    const dailyTransactionData = this.dailyTransactionData();
    if (dailyTransactionData.length === 0) {
      return null;
    }

    return [...dailyTransactionData].sort(
      (a, b) => b.totalAmount - a.totalAmount
    )[0];
  });

  categorizedData = computed(() => {
    const totalAmount = this.totalTransactionAmount();
    const transactions = this.monthlyTransactions();
    let categories = this.categories().map((x) => ({ id: x.id, name: x.name }));

    if (
      transactions.find(
        (t) => categories.findIndex((c) => c.id === t.category?.id) === -1
      )
    ) {
      categories = [...categories, { id: null!, name: 'Uncategorized' }];
    }

    const result = categories.map((category) => {
      const amount = transactions
        .filter((x) => x.category?.id === category.id)
        .reduce((acc, curr) => acc + curr.amount, 0);

      return {
        ...category,
        totalAmount: amount,
        percentage: (amount / totalAmount) * 100,
      };
    });

    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  });

  highestCategoryTransaction = computed(() => {
    const categorizedData = this.categorizedData();
    if (categorizedData.length === 0) {
      return null;
    }

    return categorizedData[0];
  });

  tableMenuItems: MenuItem[] = [
    {
      label: 'View All',

      command: () => {
        this.router.navigateByUrl('/transactions');
      },
    },
  ];

  // Chart data
  documentStyle = signal(getComputedStyle(document.documentElement));
  textColor = computed(() =>
    this.documentStyle().getPropertyValue('--text-color')
  );
  textColorSecondary = computed(() =>
    this.documentStyle().getPropertyValue('--text-color-secondary')
  );
  surfaceBorder = computed(() =>
    this.documentStyle().getPropertyValue('--surface-border')
  );

  chartData = computed(() => {
    const dailyTransactionData = this.dailyTransactionData();
    const documentStyle = this.documentStyle();

    return {
      labels: dailyTransactionData.map((data) => data.date.getDate()),
      datasets: [
        {
          label: 'Amount',
          data: dailyTransactionData.map((d) => d.totalAmount),
          fill: true,
          borderColor: documentStyle.getPropertyValue('--orange-500'),
          tension: 0.5,
          backgroundColor: documentStyle.getPropertyValue('--orange-800'),
        },
      ],
    };
  });

  chartOptions = computed(() => {
    const textColor = this.textColor();
    const textColorSecondary = this.textColorSecondary();
    const surfaceBorder = this.surfaceBorder();
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
  });
}
