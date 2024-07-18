import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { HttpErrorReporterService } from './http-error-reporter.service';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpClientService {
  private http = inject(HttpClient);
  private httpErrorReporter = inject(HttpErrorReporterService);

  get<T>(url: string, params: any = null, skipErrorHandling = false) {
    return this.request<T>({ method: 'GET', url, params }, skipErrorHandling);
  }

  post<T>(url: string, body: any, skipErrorHandling = false) {
    return this.request<T>({ method: 'POST', url, body }, skipErrorHandling);
  }

  put<T>(url: string, body: any, skipErrorHandling = false) {
    return this.request<T>({ method: 'PUT', url, body }, skipErrorHandling);
  }

  delete<T>(url: string, skipErrorHandling = false) {
    return this.request<T>({ method: 'DELETE', url }, skipErrorHandling);
  }

  request<T>(
    request:
      | HttpRequest<T>
      | { method: string; url: string; body?: any; params?: any },
    skipErrorHandling = false
  ) {
    const { method, url, body, params } = request;
    return this.http
      .request<T>(method, url, {
        body,
        params,
      })
      .pipe(
        catchError((error) => {
          if (!skipErrorHandling) {
            this.httpErrorReporter.reportError(error);
          }
          return throwError(() => error);
        })
      );
  }
}
