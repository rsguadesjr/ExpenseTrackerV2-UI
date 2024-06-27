import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TransactionService } from '../../data-access/transaction.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TransactionResponse } from '../../models/transaction-response.mode';
import { ChipModule } from 'primeng/chip';
import { PanelModule } from 'primeng/panel';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { TransactionFilterPanelComponent } from '../../ui/transaction-filter-panel/transaction-filter-panel.component';
import { BehaviorSubject, debounce, debounceTime, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalendarModule } from 'primeng/calendar';
import { TransactionCalendarComponent } from '../../ui/transaction-calendar/transaction-calendar.component';

@Component({
  selector: 'app-transaction-page',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TableModule,
    ButtonModule,
    ChipModule,
    ToolbarModule,
    InputTextModule,
    TransactionFilterPanelComponent,
    TransactionCalendarComponent,
    CalendarModule,
    PanelModule,
  ],
  templateUrl: './transaction-page.component.html',
  styleUrl: './transaction-page.component.scss',
})
export class TransactionPageComponent implements OnInit {
  private transactionService = inject(TransactionService);

  transactionsState$ = this.transactionService.state$;
  calendarData$ = this.transactionService.state$.pipe(
    map((state) =>
      state.transactions.map((t) => ({
        date: new Date(t.transactionDate),
        value: t.amount,
      }))
    )
  );

  dateFilter$ = new BehaviorSubject({
    startDate: new Date(),
    endDate: new Date(),
  });

  constructor() {
    this.dateFilter$
      .pipe(debounceTime(500), takeUntilDestroyed())
      .subscribe((event) => {
        // TODO: update parameters in the future, currently only year and month
        this.transactionService.loadTransactions({
          year: event.startDate.getFullYear(),
          month: event.startDate.getMonth() + 1,
        });
      });
  }

  ngOnInit(): void {}

  editTransaction(transaction: TransactionResponse) {
    console.log(transaction);
  }

  deleteTransaction(transaction: TransactionResponse) {
    console.log(transaction);
  }

  onDateFilter(event: { startDate: Date; endDate: Date }) {
    this.dateFilter$.next(event);
  }
}
