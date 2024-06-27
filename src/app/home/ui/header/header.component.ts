import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SplitButtonModule } from 'primeng/splitbutton';
import { ToolbarModule } from 'primeng/toolbar';
import { AuthService } from '../../../auth/data-access/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UiService } from '../../services/ui-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    SplitButtonModule,
    InputTextModule,
    AvatarModule,
    RouterModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  uiService = inject(UiService);

  authState$ = this.authService.authState;
  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
      {
        label: 'Sign Out',
        icon: 'pi pi-sign-out',
        command: async () => {
          await this.authService.signOut();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
          });
        },
      },
    ];
  }
}
