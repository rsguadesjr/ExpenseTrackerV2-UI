import { Component, Inject, inject } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { RegisterComponent } from '../register/register.component';
import { ActivatedRoute } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';

@Component({
  selector: 'app-auth-form',
  standalone: true,
  imports: [LoginComponent, RegisterComponent, TabViewModule],
  templateUrl: './auth-form.component.html',
  styleUrl: './auth-form.component.scss',
})
export class AuthFormComponent {
  activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    console.log(this.activatedRoute.snapshot);
    console.log(this.activatedRoute.data);
    this.activatedRoute.data.subscribe((data) => console.log(data));
  }
}
