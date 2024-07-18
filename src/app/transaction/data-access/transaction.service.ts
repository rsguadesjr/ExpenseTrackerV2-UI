import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TrasactionQuery } from '../models/transaction-query.model';
import { BehaviorSubject, take } from 'rxjs';
import { TransactionState } from '../models/transaction-state.mode';
import { StatusType } from '../../core/constants/status-type';
import { TransactionResponse } from '../models/transaction-response.mode';
import { TransactionRequest } from '../models/transaction-request.model';
import { TransactionActionType } from '../constants/transaction-action-type';
import { parseError } from '../../core/helpers/error-helper';
import { HttpClientService } from '../../core/services/http-client.service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private http = inject(HttpClientService);
  private baseUrl = environment.API_BASE_URL + 'api/transactions';

  private _state$ = new BehaviorSubject<TransactionState>({
    status: StatusType.Idle,
    transactions: [],
  });
  state$ = this._state$.asObservable();
  get stateValue() {
    return this._state$.value;
  }

  resetState() {
    this._state$.next({
      status: StatusType.Idle,
      transactions: [],
    });
  }

  loadTransactions(query: TrasactionQuery, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .get<TransactionResponse[]>(
        this.baseUrl,
        { ...query },
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Success,
            action: TransactionActionType.LoadTransactions,
            transactions: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
          console.error(error);
        },
      });
  }

  loadTransactionById(id: string, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    this.http
      .get<TransactionResponse>(
        `${this.baseUrl}/${id}`,
        {},
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const index = state.transactions.findIndex(
            (x) => x.id === response.id
          );
          state.transactions[index] = response;
          this._state$.next({
            ...state,
            status: StatusType.Success,
            action: TransactionActionType.LoadTransactionById,
            selectedTransaction: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
          console.error(error);
        },
      });
  }

  createTransaction(
    request: TransactionRequest,
    skipGlobalErrorHandling = false
  ) {
    this.updateStatus(StatusType.Loading);
    this.http
      .post<TransactionResponse>(this.baseUrl, request, skipGlobalErrorHandling)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this._state$.next({
            transactions: [response, ...this._state$.value.transactions],
            status: StatusType.Success,
            action: TransactionActionType.CreateTransaction,
            selectedTransaction: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
          console.error(error);
        },
      });
  }

  updateTransaction(
    request: TransactionRequest,
    skipGlobalErrorHandling = false
  ) {
    this.updateStatus(StatusType.Loading);
    this.http
      .put<TransactionResponse>(
        `${this.baseUrl}/${request.id}`,
        request,
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const index = state.transactions.findIndex(
            (x) => x.id === response.id
          );
          state.transactions[index] = response;
          this._state$.next({
            ...state,
            status: StatusType.Success,
            action: TransactionActionType.UpdateTransaction,
            selectedTransaction: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
          console.error(error);
        },
      });
  }

  deleteTransaction(id: string, skipGlobalErrorHandling = false) {
    this.http
      .delete<TransactionResponse>(
        `${this.baseUrl}/${id}`,
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const transactions = state.transactions.filter((x) => x.id !== id);
          this._state$.next({
            ...state,
            transactions,
            status: StatusType.Success,
            action: TransactionActionType.DeleteTransaction,
            selectedTransaction: { id } as TransactionResponse,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
          console.error(error);
        },
      });
  }

  setEditMode(
    editMode: 'create' | 'update',
    transaction?: TransactionResponse
  ) {
    this._state$.next({
      ...this._state$.value,
      editMode,
      selectedTransaction: transaction,
      status: StatusType.Idle,
    });
  }

  private updateStatus(status: StatusType, errors: string[] = []) {
    this._state$.next({
      ...this._state$.value,
      status,
      errors,
    });
  }
}
