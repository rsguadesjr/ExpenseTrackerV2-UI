import {
  getState,
  patchState,
  signalStore,
  StateSignals,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
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
import { TrasactionQuery } from '../models/transaction-query.model';
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
      return store
        .errors()!
        .map(
          (error) => ({ severity: StatusType.Error, detail: error } as Message)
        );
    }),
  })),
  withMethods((store, httpClient = inject(HttpClientService)) => ({
    setEditMode: (
      editMode: 'create' | 'update',
      transaction?: TransactionResponse
    ) => {
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
      query: TrasactionQuery;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          showLoading(store, TransactionActionType.LoadTransactions);
        }),
        switchMap(({ query, skipGlobalErrorHandling }) =>
          httpClient
            .get<TransactionResponse[]>(
              baseUrl,
              { ...query },
              skipGlobalErrorHandling ?? false
            )
            .pipe(
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
          httpClient
            .get<TransactionResponse>(
              `${baseUrl}/${id}`,
              skipGlobalErrorHandling
            )
            .pipe(
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
          httpClient
            .post<TransactionResponse>(
              baseUrl,
              transaction,
              skipGlobalErrorHandling
            )
            .pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, {
                    transactions: [response, ...store.transactions()],
                    status: StatusType.Success,
                    action: TransactionActionType.CreateTransaction,
                    selectedTransaction: response,
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
          httpClient
            .put<TransactionResponse>(
              `${baseUrl}/${transaction.id}`,
              transaction,
              skipGlobalErrorHandling
            )
            .pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, {
                    transactions: [
                      response,
                      ...store
                        .transactions()
                        .filter((x) => x.id !== response.id),
                    ],
                    status: StatusType.Success,
                    action: TransactionActionType.UpdateTransaction,
                    selectedTransaction: response,
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
          httpClient
            .delete<TransactionResponse>(
              `${baseUrl}/${id}`,
              skipGlobalErrorHandling
            )
            .pipe(
              tapResponse({
                next: () => {
                  patchState(store, {
                    transactions: store
                      .transactions()
                      .filter((x) => x.id !== id),
                    status: StatusType.Success,
                    action: TransactionActionType.DeleteTransaction,
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

    // methods for dashboard transactions
    setDashboardTransactions: (transactions: TransactionResponse[]) => {
      const dashboardFilter = store.dashboard().filter;
      const dashboardTransactions = transactions.filter((x) => {
        const transactionDate = new Date(x.transactionDate);

        return (
          dashboardFilter.year === transactionDate.getFullYear() &&
          dashboardFilter.month === transactionDate.getMonth() &&
          dashboardFilter.timezoneOffset === transactionDate.getTimezoneOffset()
        );
      });
      console.log('[DEBUG] setDashboardTransactions', {
        dashboardFilter,
        dashboardTransactions,
        transactions,
      });
      patchState(store, {
        dashboard: {
          ...store.dashboard(),
          isInitialized: true,
          transactions: dashboardTransactions,
        },
      });
    },

    updateDashboardTransactions: () => {
      const selectedTransaction = store.selectedTransaction();
      if (!selectedTransaction) {
        return;
      }

      const dashboard = store.dashboard();
      const filter = dashboard.filter;
      const dashboardTransactions = dashboard.transactions;
      const date = new Date(filter.year, filter.month);
      if (
        selectedTransaction &&
        isSameMonth(selectedTransaction.transactionDate, date)
      ) {
        const index = dashboardTransactions?.findIndex(
          (x) => x.id === selectedTransaction.id
        );
        if (index > -1) {
          dashboardTransactions[index] = selectedTransaction;
        } else {
          dashboardTransactions.push(selectedTransaction);
        }
        patchState(store, {
          dashboard: {
            ...store.dashboard(),
            transactions: dashboardTransactions,
          },
        });
      }
    },
  })),
  withHooks((store) => ({
    onInit: () => {
      const accountService = inject(AccountService);

      // When dashboard is not yet initialized, set dashboard transactions based on transactions
      effect(() => {
        const status = store.status();
        if (status !== StatusType.Success) {
          return;
        }

        const transactions = store.transactions();
        untracked(() => {
          const dashboard = store.dashboard();
          if (!dashboard.isInitialized) {
            store.setDashboardTransactions(transactions);
            return;
          }
        });
      });

      //
      // When UpdateTransaction or CreateTransaction action is successful, update dashboard transactions
      //
      effect(() => {
        const status = store.status();
        if (status !== StatusType.Success) {
          return;
        }

        const action = store.action();
        if (
          ![
            TransactionActionType.UpdateTransaction,
            TransactionActionType.CreateTransaction,
          ].includes(action!)
        ) {
          return;
        }

        const selectedTransaction = store.selectedTransaction();
        if (selectedTransaction) {
          untracked(() => {
            store.updateDashboardTransactions();
          });
        }
      });

      //
      // When filter changes, load transactions
      //
      effect(() => {
        const filter = store.filter();
        untracked(() => {
          const accountId = accountService.currentAccount()?.id;
          store.loadTransactions({
            query: {
              year: filter.year,
              month: filter.month + 1,
              timezoneOffset: -filter.timezoneOffset,
              accountId,
            },
          });
        });
      });

      //
      // When account changes, reset dashbaord and retrigger filter effect
      //
      effect(() => {
        const accountId = accountService.currentAccount()?.id;
        untracked(() => {
          patchState(store, {
            filter: { ...store.filter(), accountId },
            dashboard: { ...store.dashboard(), isInitialized: false },
          });
        });
      });

      effect(() => {
        const state = getState(store);
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
