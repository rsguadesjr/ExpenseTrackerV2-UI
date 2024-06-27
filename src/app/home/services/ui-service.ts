import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  sidebarVisible: boolean = false;
}
