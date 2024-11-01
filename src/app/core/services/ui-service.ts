import { Injectable, computed, inject, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private _sidebarToggle = signal(false);
  private _progressBarToggle = signal(false);

  sidebarToggle = computed(() => this._sidebarToggle());
  progressBarToggle = computed(() => this._progressBarToggle());

  toggleSidebar(value: boolean) {
    this._sidebarToggle.set(value);
  }

  toggleProgressBar(value: boolean) {
    this._progressBarToggle.set(value);
  }
}
