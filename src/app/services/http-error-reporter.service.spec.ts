import { TestBed } from '@angular/core/testing';

import { HttpErrorReporterService } from './http-error-reporter.service';

describe('HttpErrorReporterService', () => {
  let service: HttpErrorReporterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpErrorReporterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
