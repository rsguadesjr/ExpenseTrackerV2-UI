import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { AccountService } from '../../../account/data-access/account.service';
import { TransactionStore } from '../../data-access/transaction.store';

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
    TooltipModule
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './transaction-page.component.html',
  styleUrl: './transaction-page.component.scss'
})
export class TransactionPageComponent implements OnInit {
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);
  private accountService = inject(AccountService);
  private readonly transactionStore = inject(TransactionStore);

  transactions = this.transactionStore.transactions;
  status = this.transactionStore.status;
  calendarData = computed(() =>
    this.transactions().map((t) => ({
      date: new Date(t.transactionDate),
      value: t.amount
    }))
  );

  dateFilter = signal({ startDate: new Date(), endDate: new Date() });

  constructor() {
    // effect(() => {
    //   const startDate = this.dateFilter().startDate;
    //   untracked(() => {
    //     this.transactionStore.loadTransactions({
    //       query: {
    //         year: startDate.getFullYear(),
    //         month: startDate.getMonth() + 1,
    //         timezoneOffset: -new Date().getTimezoneOffset(),
    //         accountId: this.accountService.currentAccount()?.id,
    //       },
    //     });
    //   });
    // });
  }

  ngOnInit(): void {}

  editTransaction(transaction: TransactionResponse) {
    this.transactionStore.setEditMode('update', transaction);
    this.dialogService.open(TransactionFormComponent, {
      header: 'Update',
      width: '420px'
    });
  }

  createTransaction() {
    this.transactionStore.setEditMode('create');
    this.dialogService.open(TransactionFormComponent, {
      header: 'Create',
      width: '420px',
      closeOnEscape: true
    });
  }

  deleteTransaction(transaction: TransactionResponse) {
    this.confirmationService.confirm({
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      message: 'Are you sure you want to delete this transaction?',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.transactionStore.deleteTransaction({ id: transaction.id });
      },
      reject: () => {}
    });
  }

  onDateFilter(event: { startDate: Date; endDate: Date }) {
    this.transactionStore.setDateRange({
      start: event.startDate,
      end: event.endDate
    });
    // this.dateFilter.set(event);
  }
}
