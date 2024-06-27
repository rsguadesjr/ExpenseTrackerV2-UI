import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SidebarModule } from 'primeng/sidebar';
import { UiService } from '../../services/ui-service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SidebarModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  uiService = inject(UiService);
}
