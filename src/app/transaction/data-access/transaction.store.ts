import {
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

const initialState: TransactionState = {
  status: StatusType.Idle,
  transactions: [],
  selectedTransaction: null,
  action: null,
  dateRange: { start: new Date(), end: new Date() },
  editMode: null,
  errors: [],
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
      patchState(store, { dateRange, status: StatusType.Idle });
    },

    loadTransactions: rxMethod<{
      query: TrasactionQuery;
      skipGlobalErrorHandling?: boolean;
    }>(
      pipe(
        tap(() => {
          console.log('loadTransactions');
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
  })),
  withHooks((store) => ({
    onInit: () => {
      const accountService = inject(AccountService);
      effect(() => {
        const date = store.dateRange().start;
        const accountId = accountService.currentAccount()?.id;
        untracked(() => {
          store.loadTransactions({
            query: {
              year: date.getFullYear(),
              month: date.getMonth() + 1,
              timezoneOffset: -new Date().getTimezoneOffset(),
              accountId,
            },
          });
        });
        console.log('TransactionStore initialized');
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
