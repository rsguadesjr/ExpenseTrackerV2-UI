import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpErrorReporterService {
  private _error$ = new Subject<HttpErrorResponse>();

  geterror$() {
    return this._error$.asObservable();
  }

  reportError(error: HttpErrorResponse) {
    console.log('HttpErrorReporterService', error);
    this._error$.next(error);
  }
}
