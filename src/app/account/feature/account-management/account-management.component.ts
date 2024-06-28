import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AccountService } from '../../data-access/account.service';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { AccountResponse } from '../../models/account-response.model';
import { DialogService } from 'primeng/dynamicdialog';
import { ConfirmationService } from 'primeng/api';
import { AccountFormComponent } from '../account-form/account-form.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { StatusType } from '../../../core/constants/status-type';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-account-management',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ChipModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
  ],
  providers: [DialogService, ConfirmationService],
  templateUrl: './account-management.component.html',
  styleUrl: './account-management.component.scss',
})
export class AccountManagementComponent {
  private accountService = inject(AccountService);
  private dialogService = inject(DialogService);
  private confirmationService = inject(ConfirmationService);

  state$ = this.accountService.state$;

  createAccount() {
    this.accountService.setAccountForEdit(null, 'create');
    this.dialogService.open(AccountFormComponent, {
      header: 'Create',
      width: '420px',
      closeOnEscape: true,
    });
  }

  editAccount(account: AccountResponse) {
    this.accountService.setAccountForEdit(account, 'update');
    this.dialogService.open(AccountFormComponent, {
      header: 'Update',
      width: '420px',
    });
  }

  deleteAccount(account: AccountResponse) {
    this.confirmationService.confirm({
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      message: `Are you sure you want to delete "${account.name}"?`,
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.accountService.deleteAccount(account.id);
      },
      reject: () => {},
    });
  }
}
