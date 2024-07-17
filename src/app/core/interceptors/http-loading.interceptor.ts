import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UiService } from '../services/ui-service';
import { finalize } from 'rxjs';

export const httpLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const uiService = inject(UiService);

  uiService.showProgressBar$.next(true);
  return next(req).pipe(
    finalize(() => {
      uiService.showProgressBar$.next(false);
    })
  );
};
