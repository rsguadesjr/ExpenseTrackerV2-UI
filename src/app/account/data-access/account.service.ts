import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StatusType } from '../../core/constants/status-type';
import { BehaviorSubject, take } from 'rxjs';
import { AccountState } from '../models/account-state.model';
import { AccountResponse } from '../models/account-response.model';
import { AccountRequest } from '../models/account-request.model';
import { parseError } from '../../core/helpers/error-helper';
import { HttpClientService } from '../../core/services/http-client.service';
import { state } from '@angular/animations';
import { AccountActionType } from '../constants/account-action-type';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private http = inject(HttpClientService);
  private baseUrl = environment.API_BASE_URL + 'api/accounts';

  private _state = signal<AccountState>({
    status: StatusType.Idle,
    accounts: [],
    currentAccount: null,
  });

  accounts = computed(() => this._state().accounts);
  currentAccount = computed(() => this._state().currentAccount);
  selectedAccount = computed(() => this._state().selectedAccount);
  status = computed(() => this._state().status);
  isEditMode = computed(() => this._state().editMode === 'update');
  errors = computed(() => this._state().errors ?? []);
  action = computed(() => this._state().action);

  resetState() {
    this._state.set({
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

          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            action: AccountActionType.LoadAll,
            accounts: response,
            currentAccount,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          this._state.update((state) => {
            const index = state.accounts.findIndex((x) => x.id === response.id);
            state.accounts[index] = response;
            return {
              ...state,
              status: StatusType.Success,
              action: AccountActionType.LoadById,
              selectedAccount: response,
              errors: [],
            };
          });
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          // update accounts isDefault field if the updated account is default
          let accounts = this._state().accounts;
          if (response.isDefault) {
            accounts = this._state().accounts.map((x) => ({
              ...x,
              isDefault: x.id === response.id,
            }));
          }

          this._state.update((state) => ({
            ...state,
            accounts: [response, ...accounts],
            status: StatusType.Success,
            action: AccountActionType.Create,
            selectedAccount: response,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          let accounts = this._state().accounts;
          const index = accounts.findIndex((x) => x.id === response.id);
          accounts[index] = response;

          // if currentAccount was update to inactive, set the default account as current account
          let currentAccount = this._state().currentAccount;
          let editMode = this._state().editMode;
          if (
            response.id === this._state().currentAccount?.id &&
            !response.isActive
          ) {
            currentAccount =
              accounts
                .filter((x) => x.id !== response.id)
                .find((x) => x.isDefault) ?? accounts[0];

            // set edit mode to null to force load transactions
            editMode = null;
          }
          // update accounts isDefault field if the updated account is default

          if (response.isDefault) {
            accounts = this._state().accounts.map((x) => ({
              ...x,
              isDefault: x.id === response.id,
            }));
          }

          this._state.update((state) => ({
            ...state,
            status: StatusType.Success,
            selectedAccount: response,
            action: AccountActionType.Update,
            editMode,
            currentAccount,
            accounts,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
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
          const accounts = this._state().accounts.filter((x) => x.id !== id);

          // update current account if it was deleted
          let currentAccount = this._state().currentAccount;
          let editMode = this._state().editMode;
          if (id === currentAccount?.id) {
            currentAccount = accounts.find((x) => x.isDefault) ?? accounts[0];

            // set edit mode to null to force load transactions
            editMode = null;
          }

          this._state.update((state) => ({
            ...state,
            accounts,
            status: StatusType.Success,
            action: AccountActionType.Delete,
            currentAccount,
            editMode,
            errors: [],
          }));
        },
        error: (error: HttpErrorResponse) => {
          this.updateStatus(StatusType.Error, parseError(error));
        },
      });
  }

  setAccountForEdit(
    account: AccountResponse | null,
    editMode: 'create' | 'update'
  ) {
    this._state.update((state) => ({
      ...state,
      editMode,
      selectedAccount: account,
      errors: [],
      action: AccountActionType.LoadById,
    }));
  }

  setCurrentAccount(id: string) {
    const currentAccount = this._state().accounts.find((x) => x.id === id)!;
    this._state.update((state) => ({
      ...state,
      currentAccount,
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
