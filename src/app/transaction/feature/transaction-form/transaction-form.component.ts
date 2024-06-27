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
  private ref = inject(DynamicDialogRef);
  transactionState$ = this.transactionService.state$;

  categories$ = of([
    {
      id: '9121844b-ff38-4274-b5db-19325a129a02',
      name: 'Food',
      description: null,
      isActive: true,
      order: 1,
      createdDate: null,
      modifiedDate: null,
    },
    {
      id: '2c647552-175a-4d82-815f-3b7c365ab466',
      name: 'Others',
      description: null,
      isActive: true,
      order: 7,
      createdDate: null,
      modifiedDate: null,
    },
    {
      id: 'f80d182e-3334-40cd-a09f-40ac395022f6',
      name: 'Rent',
      description: null,
      isActive: true,
      order: 6,
      createdDate: null,
      modifiedDate: null,
    },
    {
      id: '995fd19f-bf08-46b8-b1ce-9c51945fbf7f',
      name: 'Shopping',
      description: null,
      isActive: true,
      order: 5,
      createdDate: null,
      modifiedDate: null,
    },
    {
      id: '96699e79-4af8-4cf7-8b48-d6dc0678065f',
      name: 'Bills',
      description: null,
      isActive: true,
      order: 2,
      createdDate: null,
      modifiedDate: null,
    },
    {
      id: '40fff92b-97d1-4cf5-8164-f9646cfb0929',
      name: 'Transportation',
      description: null,
      isActive: true,
      order: 4,
      createdDate: null,
      modifiedDate: null,
    },
    {
      id: 'e71f4560-75f0-4c9a-b1a4-fe813f4fdc9b',
      name: 'Health',
      description: null,
      isActive: true,
      order: 3,
      createdDate: null,
      modifiedDate: null,
    },
  ]);

  form = new FormGroup({
    id: new FormControl<string | null>(null),
    description: new FormControl('', Validators.required),
    categoryId: new FormControl('', Validators.required),
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

      // TODO: get account id from account service (to be implemented)
      accountId: '8223b7c6-73ca-4c4c-bc2d-a32eb347105a',
    };

    if (request.id) {
      this.transactionService.updateTransaction(request);
    } else {
      this.transactionService.createTransaction(request);
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
