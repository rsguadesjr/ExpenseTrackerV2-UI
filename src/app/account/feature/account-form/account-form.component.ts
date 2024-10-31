import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, untracked } from '@angular/core';
import {
  AbstractControlOptions,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { AccountService } from '../../data-access/account.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StatusType } from '../../../core/constants/status-type';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { map, skip, take } from 'rxjs';
import { AccountRequest } from '../../models/account-request.model';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';
import { Message } from 'primeng/api';
import { AccountActionType } from '../../constants/account-action-type';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputSwitchModule,
    ButtonModule,
    MessagesModule,
  ],
  templateUrl: './account-form.component.html',
  styleUrl: './account-form.component.scss',
})
export class AccountFormComponent {
  private accountService = inject(AccountService);
  private ref = inject(DynamicDialogRef);

  accounts = this.accountService.accounts;
  status = this.accountService.status;
  isEditMode = this.accountService.isEditMode;
  selectedAccount = this.accountService.selectedAccount;
  action = this.accountService.action;
  errorMessages = computed(() =>
    this.accountService
      .errors()
      .map(
        (error) => ({ severity: StatusType.Error, detail: error } as Message)
      )
  );

  form = new FormGroup({
    id: new FormControl(),
    name: new FormControl('', Validators.required),
    description: new FormControl('', Validators.required),
    isActive: new FormControl(true),
    isDefault: new FormControl(false),
  });

  closeOnSuccessEffect = effect(() => {
    if (
      (this.action() === AccountActionType.Create ||
        this.action() === AccountActionType.Update) &&
      this.status() === StatusType.Success
    ) {
      this.ref.close();
    }
  });

  constructor() {
    if (this.selectedAccount() && this.isEditMode()) {
      this.form.patchValue({
        id: this.selectedAccount()?.id,
        name: this.selectedAccount()?.name,
        description: this.selectedAccount()?.description,
        isActive: this.selectedAccount()?.isActive,
        isDefault: this.selectedAccount()?.isDefault,
      });
    }
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.status() === StatusType.Loading) {
      return;
    }

    const request: AccountRequest = {
      id: this.form.value.id,
      name: this.form.value.name!,
      description: this.form.value.description!,
      isActive: this.form.value.isActive!,
      isDefault: this.form.value.isDefault!,
    };

    if (request.id) {
      this.accountService.updateAccount(request, true);
    } else {
      this.accountService.createAccount(request, true);
    }
  }

  cancel() {
    this.ref.close();
  }

  inActiveMustNotBeDefaultValidator(form: FormGroup) {
    const isActive = !!form.get('isActive')?.value;
    const isDefault = !!form.get('isDefault')?.value;
    if (!isActive && isDefault) {
      form.get('isDefault')?.setErrors({ mustNotBeDefault: true });
    } else {
      form.get('isDefault')?.setErrors(null);
    }
  }
}
