import { getState, patchState, signalStore, StateSignals, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import { TransactionResponse } from '../models/transaction-response.mode';
import { TransactionState } from '../models/transaction-state.mode';
import { StatusType } from '../../core/constants/status-type';
import { TransactionService } from './transaction.service';
import { tapResponse } from '@ngrx/operators';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { onErrorResumeNext, pipe, switchMap, tap } from 'rxjs';
import { computed, effect, inject, untracked } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { parseError } from '../../core/helpers/error-helper';
import { TransactionActionType } from '../constants/transaction-action-type';
import { environment } from '../../../environments/environment';
import { FilterTrasactionQuery } from '../models/filter-transaction-query.model';
import { HttpClientService } from '../../core/services/http-client.service';
import { AccountService } from '../../account/data-access/account.service';
import { Message } from 'primeng/api';
import { TransactionRequest } from '../models/transaction-request.model';
import { isSameMonth, startOfMonth } from 'date-fns';

const currentDate = new Date();

const initialState: TransactionState = {
  status: StatusType.Idle,
  transactions: [],
  selectedTransaction: null,
  action: null,
  dateRange: { start: currentDate, end: currentDate },
  editMode: null,
  errors: [],
  filter: {
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    timezoneOffset: currentDate.getTimezoneOffset(),
    accountId: undefined,
  },

  dashboard: {
    isInitialized: false,
    transactions: [],
    filter: {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      timezoneOffset: currentDate.getTimezoneOffset(),
      accountId: undefined,
    },
  },
};

const baseUrl = environment.API_BASE_URL + 'api/transactions';

export const TransactionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isEditMode: computed(() => store.editMode() == 'update'),
    isLoading: computed(() => store.status() === StatusType.Loading),
    errorMessages: computed(() => {
      if (!store.errors || !store.errors()) {
        return [];
      }
      return store.errors()!.map((error) => ({ severity: StatusType.Error, detail: error } as Message));
    }),
  })),
  withMethods((store, httpClient = inject(HttpClientService)) => ({
    setEditMode: (editMode: 'create' | 'update', transaction?: TransactionResponse) => {
      patchState(store, {
        editMode,
        selectedTransaction: transaction,
        status: StatusType.Idle,
      });
    },

    setDateRange: (dateRange: { start: Date; end: Date }) => {
      patchState(store, {
        dateRange,
        filter: {
          ...store.filter(),
          month: dateRange.start.getMonth(),
          year: dateRange.start.getFullYear(),
          timezoneOffset: dateRange.start.getTimezoneOffset(),
        },
        status: StatusType.Idle,
      });
    },

    loadTransactions: rxMethod<{
      query: FilterTrasactionQuery;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.LoadTransactions);
        }),
        switchMap(({ query, skipGlobalErrorHandling }) =>
          httpClient.get<TransactionResponse[]>(baseUrl, { ...query }, skipGlobalErrorHandling ?? false).pipe(
            tapResponse({
              next: (response) => {
                patchState(store, {
                  transactions: response,
                  status: StatusType.Success,
                  action: TransactionActionType.LoadTransactions,
                });
              },
              error: (error: HttpErrorResponse) => {
                showError(store, error);
              },
            })
          )
        )
      )
    ),

    loadTransactionById: rxMethod<{
      id: string;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.LoadTransactionById);
        }),
        switchMap(({ id, skipGlobalErrorHandling }) =>
          httpClient.get<TransactionResponse>(`${baseUrl}/${id}`, skipGlobalErrorHandling).pipe(
            tapResponse({
              next: (response) => {
                patchState(store, {
                  selectedTransaction: response,
                  status: StatusType.Success,
                  action: TransactionActionType.LoadTransactionById,
                });
              },
              error: (error: HttpErrorResponse) => {
                showError(store, error);
              },
            })
          )
        )
      )
    ),

    createTransaction: rxMethod<{
      transaction: TransactionRequest;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.CreateTransaction);
        }),
        switchMap(({ transaction, skipGlobalErrorHandling }) =>
          httpClient.post<TransactionResponse>(baseUrl, transaction, skipGlobalErrorHandling).pipe(
            tapResponse({
              next: (response) => {
                const dashboard = updateDashboardTransactions(store as any, response);
                patchState(store, {
                  transactions: [response, ...store.transactions()],
                  status: StatusType.Success,
                  action: TransactionActionType.CreateTransaction,
                  selectedTransaction: response,
                  dashboard,
                });
              },
              error: (error: HttpErrorResponse) => {
                showError(store, error);
              },
            })
          )
        )
      )
    ),

    updateTransaction: rxMethod<{
      transaction: TransactionRequest;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.UpdateTransaction);
        }),
        switchMap(({ transaction, skipGlobalErrorHandling }) =>
          httpClient.put<TransactionResponse>(`${baseUrl}/${transaction.id}`, transaction, skipGlobalErrorHandling).pipe(
            tapResponse({
              next: (response) => {
                const dashboard = updateDashboardTransactions(store as any, response);
                patchState(store, {
                  transactions: [response, ...store.transactions().filter((x) => x.id !== response.id)],
                  status: StatusType.Success,
                  action: TransactionActionType.UpdateTransaction,
                  selectedTransaction: response,
                  dashboard,
                });
              },
              error: (error: HttpErrorResponse) => {
                showError(store, error);
              },
            })
          )
        )
      )
    ),

    deleteTransaction: rxMethod<{
      id: string;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.DeleteTransaction);
        }),
        switchMap(({ id, skipGlobalErrorHandling }) =>
          httpClient.delete<TransactionResponse>(`${baseUrl}/${id}`, skipGlobalErrorHandling).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  transactions: store.transactions().filter((x) => x.id !== id),
                  status: StatusType.Success,
                  action: TransactionActionType.DeleteTransaction,
                  dashboard: { ...store.dashboard(), transactions: store.dashboard().transactions.filter((x) => x.id !== id) },
                });
              },
              error: (error: HttpErrorResponse) => {
                showError(store, error);
              },
            })
          )
        )
      )
    ),

    loadDashboardTransactions: rxMethod<{
      filter: FilterTrasactionQuery;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.LoadDashboardTransactions);
        }),
        switchMap(({ filter, skipGlobalErrorHandling }) =>
          httpClient.get<TransactionResponse[]>(baseUrl, { ...filter }, skipGlobalErrorHandling ?? false).pipe(
            tapResponse({
              next: (response) => {
                const dashboard = store.dashboard();
                patchState(store, {
                  dashboard: { ...dashboard, transactions: response },
                  action: TransactionActionType.LoadDashboardTransactions,
                });
              },
              error: (error: HttpErrorResponse) => {
                showError(store, error);
              },
            })
          )
        )
      )
    ),
  })),
  withHooks((store) => ({
    onInit: () => {
      const accountService = inject(AccountService);
      // //
      // // When account changes, reset dashbaord and retrigger filter effect
      // //
      effect(() => {
        const accountId = accountService.currentAccount()?.id;
        untracked(() => {
          const filter = store.filter();
          const dashboard = store.dashboard();

          patchState(store, {
            filter: { ...filter, accountId },
            dashboard: { ...dashboard, filter: { ...dashboard.filter, accountId } },
          });

          store.loadTransactions({
            query: {
              year: filter.year,
              month: filter.month + 1,
              timezoneOffset: -filter.timezoneOffset,
              accountId,
            },
          });

          store.loadDashboardTransactions({
            filter: {
              year: dashboard.filter.year,
              month: dashboard.filter.month + 1,
              timezoneOffset: -dashboard.filter.timezoneOffset,
              accountId,
            },
          });
        });
      });

      // console log the current state
      effect(() => {
        const state = getState(store);
        console.log('[DEBUG] TransactionStore', state);
      });
    },
  }))
);

export type TransactionStore = InstanceType<typeof TransactionStore>;

const showLoading = (store: any, action: TransactionActionType) => {
  patchState(store, {
    status: StatusType.Loading,
    action,
    errors: [],
  });
};

const showError = (store: any, error: HttpErrorResponse) => {
  patchState(store, {
    status: StatusType.Error,
    errors: parseError(error),
  });
};

const updateDashboardTransactions = (store: TransactionStore, currentTransaction: TransactionResponse) => {
  const dashboard = store.dashboard();
  const filter = dashboard.filter;
  const transactions = dashboard.transactions;
  const date = new Date(filter.year, filter.month);
  if (currentTransaction && isSameMonth(currentTransaction.transactionDate, date) && filter.accountId === currentTransaction.accountId) {
    const index = transactions?.findIndex((x) => x.id === currentTransaction.id);
    if (index > -1) {
      transactions[index] = currentTransaction;
    } else {
      transactions.push(currentTransaction);
    }
  }

  return { ...dashboard, transactions };
};
