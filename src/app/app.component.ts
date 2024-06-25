import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './home/ui/header/header.component';
import { SidebarComponent } from './home/ui/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  title = 'ExpenseTracker';
  isAuthenticated$ = this.authService.isAuthenticated$;

  constructor() {}
}
