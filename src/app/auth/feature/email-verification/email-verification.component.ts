import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  Auth,
  sendEmailVerification,
  onAuthStateChanged,
} from '@angular/fire/auth';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Message } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MessagesModule, ButtonModule],
  templateUrl: './email-verification.component.html',
  styleUrl: './email-verification.component.scss',
})
export class EmailVerificationComponent {
  private firebaseAuth = inject(Auth);
  status = 'idle';

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  messages: Message[] = [];

  ngOnInit() {}

  async resend() {
    if (!this.firebaseAuth.currentUser || this.status === 'loading') {
      return;
    }

    this.form.markAllAsTouched();
    this.messages = [];
    this.status = 'loading';

    await sendEmailVerification(this.firebaseAuth.currentUser, {
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
