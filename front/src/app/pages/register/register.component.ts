import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { RegisterRequest } from '../../core/models/registerRequest.interface';
import { AuthService } from '../../core/service/auth.service';
import { MaterialModule } from '../../shared/material.module';
import { ValidationMessagePipe } from '../../shared/validation-message.pipe';

@Component({
  selector: 'app-register',
  imports: [MaterialModule, ValidationMessagePipe],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public onError = false;
  private destroyRef = inject(DestroyRef);

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
    firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(40)]],
  });

  public submit(): void {
    const registerRequest = this.form.value as RegisterRequest;
    this.authService
      .register(registerRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/login']),
        error: () => (this.onError = true),
      });
  }
}
