import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StatusType } from '../../core/constants/status-type';
import { BehaviorSubject, take } from 'rxjs';
import { AccountState } from '../models/account-state.model';
import { AccountResponse } from '../models/account-response.model';
import { AccountRequest } from '../models/account-request.model';
import { parseError } from '../../core/helpers/error-helper';
import { HttpClientService } from '../../core/services/http-client.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClientService);
  private baseUrl = environment.API_BASE_URL + 'api/accounts';

  private _state$ = new BehaviorSubject<AccountState>({
    status: StatusType.Idle,
    accounts: [],
    currentAccount: null,
  });

  state$ = this._state$.asObservable();
  get stateValue() {
    return this._state$.value;
  }

  resetState() {
    this._state$.next({
      status: StatusType.Idle,
      accounts: [],
      currentAccount: null,
    });
  }

  loadAccounts(skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    return this.http
      .get<AccountResponse[]>(this.baseUrl, {}, skipGlobalErrorHandling)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          let currentAccount = response.find((x) => x.isDefault);
          currentAccount = currentAccount || response[0];

          this._state$.next({
            ...this._state$.value,
            status: StatusType.Success,
            accounts: response,
            currentAccount,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
        },
      });
  }

  loadAccountById(id: string, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    return this.http
      .get<AccountResponse>(
        `${this.baseUrl}/${id}`,
        {},
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const index = state.accounts.findIndex((x) => x.id === response.id);
          state.accounts[index] = response;
          this._state$.next({
            ...state,
            status: StatusType.Success,
            selectedAccount: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
        },
      });
  }

  createAccount(account: AccountRequest, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    return this.http
      .post<AccountResponse>(this.baseUrl, account, skipGlobalErrorHandling)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;

          // update accounts isDefault field if the updated account is default
          if (response.isDefault) {
            state.accounts.forEach((x) => {
              if (x.id !== response.id) {
                x.isDefault = false;
              }
            });
          }

          this._state$.next({
            ...state,
            accounts: [response, ...state.accounts],
            status: StatusType.Success,
            selectedAccount: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
        },
      });
  }

  updateAccount(account: AccountRequest, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    return this.http
      .put<AccountResponse>(
        `${this.baseUrl}/${account.id}`,
        account,
        skipGlobalErrorHandling
      )
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const state = this._state$.value;
          const index = state.accounts.findIndex((x) => x.id === response.id);
          state.accounts[index] = response;

          // update current account it was updated to inactive
          if (response.id === state.currentAccount?.id && !response.isActive) {
            state.currentAccount =
              state.accounts
                .filter((x) => x.id !== response.id)
                .find((x) => x.isDefault) ?? state.accounts[0];

            // set edit mode to null to force load transactions
            state.editMode = null;
          }

          // update accounts isDefault field if the updated account is default
          if (response.isDefault) {
            state.accounts.forEach((x) => {
              if (x.id !== response.id) {
                x.isDefault = false;
              }
            });
          }

          this._state$.next({
            ...state,
            status: StatusType.Success,
            selectedAccount: response,
            errors: [],
          });
        },
        error: (error: HttpErrorResponse) => {
          this._state$.next({
            ...this._state$.value,
            status: StatusType.Error,
            errors: parseError(error),
          });
        },
      });
  }

  deleteAccount(id: string, skipGlobalErrorHandling = false) {
    this.updateStatus(StatusType.Loading);
    return this.http
      .delete(`${this.baseUrl}/${id}`, skipGlobalErrorHandling)
      .pipe(take(1))
      .subscribe({
        next: () => {
          const state = this._state$.value;
          const accounts = state.accounts.filter((x) => x.id !== id);

          // update current account if it was deleted
          if (id === state.currentAccount?.id) {
            state.currentAccount =
              accounts.find((x) => x.isDefault) ?? accounts[0];

            // set edit mode to null to force load transactions
            state.editMode = null;
          }

          this._state$.next({
            ...state,
            accounts,
            status: StatusType.Success,
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

  setAccountForEdit(
    account: AccountResponse | null,
    editMode: 'create' | 'update'
  ) {
    this._state$.next({
      ...this._state$.value,
      selectedAccount: account,
      editMode,
      errors: [],
    });
  }

  setCurrentAccount(id: string) {
    const state = this._state$.value;
    const currentAccount = state.accounts.find((x) => x.id === id)!;
    this._state$.next({
      ...state,
      currentAccount,
      editMode: null,
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
