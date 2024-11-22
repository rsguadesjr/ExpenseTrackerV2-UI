import { Component, effect, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TransactionRequest } from '../../models/transaction-request.model';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { ChipsModule } from 'primeng/chips';
import { CalendarModule } from 'primeng/calendar';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { CategoryService } from '../../../category/data-access/category.service';
import { AccountService } from '../../../account/data-access/account.service';
import { MessagesModule } from 'primeng/messages';
import { StatusType } from '../../../core/constants/status-type';
import { TransactionStore } from '../../data-access/transaction.store';

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
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);
  private ref = inject(DynamicDialogRef);
  private transactionStore = inject(TransactionStore);

  transactions = this.transactionStore.transactions;
  selectedTransaction = this.transactionStore.selectedTransaction;
  isEditMode = this.transactionStore.isEditMode;
  status = this.transactionStore.status;

  categories = this.categoryService.categories;

  errorMessages = this.transactionStore.errorMessages;

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

    effect(() => {
      if (this.status() === StatusType.Success) {
        this.ref.close();
      }
    });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.status() === StatusType.Loading) {
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
      this.transactionStore.updateTransaction({ transaction: request });
    } else {
      this.transactionStore.createTransaction({ transaction: request });
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
