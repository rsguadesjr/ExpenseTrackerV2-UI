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
import { BehaviorSubject, debounce, debounceTime, map, skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalendarModule } from 'primeng/calendar';
import { TransactionCalendarComponent } from '../../ui/transaction-calendar/transaction-calendar.component';
import { DialogService } from 'primeng/dynamicdialog';
import { TransactionFormComponent } from '../transaction-form/transaction-form.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

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
    InputNumberModule,
    TransactionFilterPanelComponent,
    TransactionCalendarComponent,
    CalendarModule,
    PanelModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './transaction-page.component.html',
  styleUrl: './transaction-page.component.scss',
})
export class TransactionPageComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);

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
    // skip initial load of data
    // sicne loading of initial data is handled by the app component
    this.dateFilter$
      .pipe(skip(1), debounceTime(500), takeUntilDestroyed())
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
    this.transactionService.setEditMode('update', transaction);
    this.dialogService.open(TransactionFormComponent, {
      header: 'Update',
      width: '420px',
    });
  }

  createTransaction() {
    this.transactionService.setEditMode('create');
    this.dialogService.open(TransactionFormComponent, {
      header: 'Create',
      width: '420px',
      closeOnEscape: true,
    });
  }

  deleteTransaction(transaction: TransactionResponse) {
    this.confirmationService.confirm({
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      message: 'Are you sure you want to delete this transaction?',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.transactionService.deleteTransaction(transaction.id);
      },
      reject: () => {},
    });
  }

  onDateFilter(event: { startDate: Date; endDate: Date }) {
    this.dateFilter$.next(event);
  }
}
