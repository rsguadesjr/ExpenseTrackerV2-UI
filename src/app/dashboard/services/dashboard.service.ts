import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DashboardState } from '../models/dashboard-state.mode';
import { TransactionResponse } from '../../transaction/models/transaction-response.mode';
import {
  endOfMonth,
  isAfter,
  isBefore,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
} from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private _state$ = new BehaviorSubject<DashboardState>({
    account: null,
    transactions: [],
    dateRange: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    },
  });

  state$ = this._state$.asObservable();
  get stateValue() {
    return this._state$.value;
  }

  resetState() {
    this._state$.next({
      account: null,
      transactions: [],
      dateRange: {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      },
    });
  }

  setTransactions(transactions: TransactionResponse[]) {
    // add or update transactions in the state
    const dashboarTransactions = this.stateValue.transactions
      .slice()
      .map((x) => Object.assign({}, x));
    for (const transaction of transactions) {
      if (
        isWithinInterval(
          transaction.transactionDate,
          this.stateValue.dateRange!
        )
      ) {
        const index = dashboarTransactions.findIndex(
          (x) => x.id === transaction.id
        );

        if (index === -1) {
          dashboarTransactions.push(transaction);
        } else {
          dashboarTransactions[index] = transaction;
        }
      }
    }

    this._state$.next({
      ...this.stateValue,
      transactions: dashboarTransactions,
    });
  }

  updateOrInsertTransaction(transaction: TransactionResponse) {
    if (
      isWithinInterval(transaction.transactionDate, this.stateValue.dateRange!)
    ) {
      // update the transaction from the list

      const dashboarTransactions = this.stateValue.transactions.slice();
      const index = dashboarTransactions.findIndex(
        (x) => x.id === transaction.id
      );

      if (index === -1) {
        dashboarTransactions.push(transaction);
      } else {
        dashboarTransactions[index] = transaction;
      }

      this._state$.next({
        ...this.stateValue,
        transactions: dashboarTransactions,
      });
    }
  }

  removeTransaction(id: string) {
    let dashboarTransactions = this.stateValue.transactions;
    dashboarTransactions = dashboarTransactions.filter((x) => x.id !== id);

    this._state$.next({
      ...this._state$.value,
      transactions: dashboarTransactions,
    });
  }
}
