import { Component, inject } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoryService } from '../../../category/data-access/category.service';
import { AccountService } from '../../../account/data-access/account.service';

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
  ],
  templateUrl: './transaction-form.component.html',
  styleUrl: './transaction-form.component.scss',
})
export class TransactionFormComponent {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private accountService = inject(AccountService);
  private ref = inject(DynamicDialogRef);

  transactionState$ = this.transactionService.state$;

  categories$ = this.categoryService.state$.pipe(
    map((state) => state.categories)
  );

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
    this.transactionState$.pipe(takeUntilDestroyed()).subscribe((state) => {
      if (state.editMode === 'update') {
        this.form.patchValue({
          id: state.selectedTransaction?.id,
          description: state.selectedTransaction?.description,
          categoryId: state.selectedTransaction?.category?.id,
          amount: state.selectedTransaction?.amount,
          transactionDate: state.selectedTransaction?.transactionDate
            ? new Date(state.selectedTransaction?.transactionDate)
            : this.getDay(),
          tags: state.selectedTransaction?.tags,
        });
      }
    });

    this.transactionState$
      .pipe(
        skip(1),
        map((state) => state.status),
        takeUntilDestroyed()
      )
      .subscribe((status) => {
        if (status === 'success') {
          this.ref.close();
        }
      });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (
      this.form.invalid ||
      this.transactionService.stateValue.status === 'loading'
    ) {
      return;
    }

    const request: TransactionRequest = {
      id: this.form.value.id,
      description: this.form.value.description!,
      amount: this.form.value.amount!,
      transactionDate: this.form.value.transactionDate?.toISOString()!,
      categoryId: this.form.value.categoryId!,
      tags: this.form.value.tags!,
      accountId: this.accountService.stateValue.currentAccount?.id!,
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
