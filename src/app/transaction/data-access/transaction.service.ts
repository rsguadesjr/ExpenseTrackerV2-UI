import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
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

  private _state = signal<TransactionState>({
    status: StatusType.Idle,
    transactions: [],
  } as unknown as TransactionState);

  // Selector
  transactions = computed(() => this._state().transactions);
  status = computed(() => this._state().status);
  selectedTranscation = computed(() => this._state().selectedTransaction);
  errors = computed(() => this._state().errors ?? []);
  isEditMode = computed(() => this._state().editMode === 'update');

  resetState() {
    this._state.set({
      status: StatusType.Idle,
      transactions: [],
    } as unknown as TransactionState);
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
          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            action: TransactionActionType.LoadTransactions,
            transactions: response,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          this._state.update((state) => {
            const index = state.transactions.findIndex(
              (x) => x.id === response.id
            );
            state.transactions[index] = response;
            return {
              ...state,
              status: StatusType.Success,
              action: TransactionActionType.LoadTransactionById,
              selectedTransaction: response,
              errors: [],
            };
          });
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          this._state.update((state) => ({
            ...state,
            transactions: [response, ...state.transactions],
            status: StatusType.Success,
            action: TransactionActionType.CreateTransaction,
            selectedTransaction: response,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          this._state.update((state) => {
            const index = state.transactions.findIndex(
              (x) => x.id === response.id
            );
            state.transactions[index] = response;
            return {
              ...state,
              status: StatusType.Success,
              action: TransactionActionType.UpdateTransaction,
              selectedTransaction: response,
              errors: [],
            };
          });
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
        next: () => {
          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            action: TransactionActionType.DeleteTransaction,
            transactions: state.transactions.filter((x) => x.id !== id),
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
          console.error(error);
        },
      });
  }

  setEditMode(
    editMode: 'create' | 'update',
    transaction?: TransactionResponse
  ) {
    this._state.update((state) => ({
      ...state,
      editMode,
      selectedTransaction: transaction as TransactionResponse,
      status: StatusType.Idle,
    }));
  }

  private updateStatus(status: StatusType, errors: string[] = []) {
    this._state.update((state) => ({
      ...state,
      status,
      errors,
    }));
  }
}
