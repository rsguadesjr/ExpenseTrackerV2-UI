import { Component, computed, effect, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TransactionService } from '../../data-access/transaction.service';
import { TransactionRequest } from '../../models/transaction-request.model';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { from, map, of, skip } from 'rxjs';
import { ChipsModule } from 'primeng/chips';
import { CalendarModule } from 'primeng/calendar';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../category/data-access/category.service';
import { AccountService } from '../../../account/data-access/account.service';
import { MessagesModule } from 'primeng/messages';
import { StatusType } from '../../../core/constants/status-type';
import { Message } from 'primeng/api';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ReactiveFormsModule,
    ChipsModule,
    CalendarModule,
    ButtonModule,
    MessagesModule,
  ],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss',
})
export class TransactionFormComponent {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);
  private ref = inject(DynamicDialogRef);

  transactions = this.transactionService.transactions;
  selectedTransaction = this.transactionService.selectedTranscation;
  isEditMode = this.transactionService.isEditMode;
  status = this.transactionService.status;

  categories = this.categoryService.categories;

  errorMessages = this.transactionService
    .errors()
    .map((error) => ({ severity: StatusType.Error, detail: error } as Message));

  form = new FormGroup({
    id: new FormControl<string | null>(null),
    description: new FormControl<string | null>(null, Validators.required),
    categoryId: new FormControl<string | null>(null, Validators.required),
    amount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    transactionDate: new FormControl(this.getDay(), Validators.required),
    tags: new FormControl<string[]>([]),
  });

  constructor() {
    if (this.selectedTransaction() && this.isEditMode()) {
      this.form.patchValue({
        id: this.selectedTransaction()?.id,
        description: this.selectedTransaction()?.description,
        categoryId: this.selectedTransaction()?.category?.id,
        amount: this.selectedTransaction()?.amount,
        transactionDate: this.selectedTransaction()?.transactionDate
          ? new Date(this.selectedTransaction()?.transactionDate!)
          : this.getDay(),
        tags: this.selectedTransaction()?.tags,
      });
    }

    toObservable(this.status)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe((status) => {
        if (status === 'success') {
          this.ref.close();
        }
      });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.status() === 'loading') {
      return;
    }

    const request: TransactionRequest = {
      id: this.form.value.id,
      description: this.form.value.description!,
      amount: this.form.value.amount!,
      transactionDate: this.form.value.transactionDate?.toISOString()!,
      categoryId: this.form.value.categoryId!,
      tags: this.form.value.tags!,
      accountId: this.accountService.currentAccount()?.id!,
    };

    if (request.id) {
      this.transactionService.updateTransaction(request, true);
    } else {
      this.transactionService.createTransaction(request, true);
    }
  }

  cancel() {
    this.ref.close();
  }

  getDay() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
}
