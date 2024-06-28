import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import { Sidebar, SidebarModule } from 'primeng/sidebar';
import { UiService } from '../../services/ui-service';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SidebarModule, ButtonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private router = inject(Router);
  @ViewChild('sidebarRef') sidebarRef!: Sidebar;
  uiService = inject(UiService);

  items: MenuItem[] = [
    {
      label: 'Documents',
      items: [
        {
          label: 'New',
          icon: 'pi pi-plus',
        },
        {
          label: 'Search',
          icon: 'pi pi-search',
        },
      ],
    },
    {
      label: 'Profile',
      items: [
        {
          label: 'Settings',
          icon: 'pi pi-cog',
        },
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
        },
      ],
    },
  ];

  closeCallback(e: Event): void {
    this.sidebarRef.close(e);
  }

  navigate(url: string): void {
    this.uiService.sidebarVisible = false;
    this.router.navigateByUrl(url);
  }
}
