import { Component, inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { parseError } from '../../../core/helpers/error-helper';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { HttpErrorReporterService } from '../../../core/services/http-error-reporter.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-toast',
  standalone: true,
  imports: [ToastModule, CommonModule, ButtonModule],
  templateUrl: './error-toast.component.html',
  styleUrl: './error-toast.component.scss',
})
export class ErrorToastComponent {
  private messageService = inject(MessageService);
  private httpErrorReporterService = inject(HttpErrorReporterService);

  constructor() {
    this.httpErrorReporterService
      .geterror$()
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {
        const duration = error.status === 500 ? 10000 : 3000;
        const title = error.status === 500 ? 'Unexpected Error' : 'Error';
        parseError(error).forEach((message) => {
          this.messageService.add({
            severity: 'error',
            summary: title,
            detail: message,
            data: {
              traceId: error.status !== 500 ? error.error?.traceId : null,
            },
            life: duration,
          });
        });
      });
  }
}
