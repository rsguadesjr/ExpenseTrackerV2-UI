import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  sidebarVisible: boolean = false;

  showProgressBar$ = new BehaviorSubject<boolean>(false);
}
