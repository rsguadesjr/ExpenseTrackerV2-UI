import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Message } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MessagesModule,
    ButtonModule,
    RouterModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private firebaseAuth = inject(Auth);
  status = 'idle';

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  messages: Message[] = [];

  ngOnInit() {}

  async onSubmit() {
    this.form.markAllAsTouched();
    this.messages = [];

    if (this.status === 'loading' || !this.form.valid) {
      return;
    }

    this.status = 'loading';
    await sendPasswordResetEmail(this.firebaseAuth, this.form.value.email!, {
      url: `${window.location.origin}/login`,
    });
    this.status = 'success';
    this.messages = [
      {
        severity: 'success',
        detail: 'Email sent. Please check your inbox.',
        closable: true,
      },
    ];
  }
}
