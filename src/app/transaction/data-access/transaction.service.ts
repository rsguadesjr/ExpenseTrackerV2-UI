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

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private httpClient = inject(HttpClient);
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

  loadTransactions(query: TrasactionQuery) {
    this.updateStatus(StatusType.Loading);
    this.httpClient
      .get<TransactionResponse[]>(this.baseUrl, { params: { ...query } })
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
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  loadTransactionById(id: string) {
    this.updateStatus(StatusType.Loading);
    this.httpClient
      .get<TransactionResponse>(`${this.baseUrl}/${id}`)
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
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  createTransaction(request: TransactionRequest) {
    this.updateStatus(StatusType.Loading);
    this.httpClient
      .post<TransactionResponse>(this.baseUrl, request)
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
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  updateTransaction(request: TransactionRequest) {
    this.updateStatus(StatusType.Loading);
    this.httpClient
      .put<TransactionResponse>(`${this.baseUrl}/${request.id}`, request)
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
            errors: [error.error?.detail || 'Something went wrong'],
          });
          console.error(error);
        },
      });
  }

  deleteTransaction(id: string) {
    this.httpClient
      .delete<TransactionResponse>(`${this.baseUrl}/${id}`)
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
            errors: [error.error?.detail || 'Something went wrong'],
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
