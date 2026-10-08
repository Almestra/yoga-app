import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { Session } from '../../../../core/models/session.interface';
import { SessionService } from '../../../../core/service/session.service';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { MaterialModule } from '../../../../shared/material.module';

@Component({
  selector: 'app-form',
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private matSnackBar = inject(MatSnackBar);
  private sessionApiService = inject(SessionApiService);
  private sessionService = inject(SessionService);
  private teacherService = inject(TeacherService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public onUpdate = false;
  public sessionForm: FormGroup | undefined;
  public teachers$ = this.teacherService.all();
  private id: string | undefined;

  ngOnInit(): void {
    if (!this.sessionService.sessionInformation?.admin) {
      this.router.navigate(['/sessions']);
    }
    const url = this.router.url;
    const id = this.route.snapshot.paramMap.get('id');
    if (url.includes('update') && id) {
      this.onUpdate = true;
      this.id = id;
      this.sessionApiService
        .detail(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((session: Session) => this.initForm(session));
    } else {
      this.initForm();
    }
  }

  public submit(): void {
    const session = this.sessionForm?.value as Session;

    if (!this.onUpdate || !this.id) {
      this.sessionApiService
        .create(session)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.exitPage('Session created !'),
          error: () => this.showError(),
        });
    } else {
      this.sessionApiService
        .update(this.id, session)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.exitPage('Session updated !'),
          error: () => this.showError(),
        });
    }
  }

  private initForm(session?: Session): void {
    this.sessionForm = this.fb.group({
      name: [session ? session.name : '', [Validators.required, Validators.maxLength(50)]],
      date: [
        session ? new Date(session.date).toISOString().split('T')[0] : '',
        [Validators.required],
      ],
      teacher_id: [session ? session.teacher_id : '', [Validators.required]],
      description: [
        session ? session.description : '',
        [Validators.required, Validators.maxLength(2500)],
      ],
    });
  }

  private exitPage(message: string): void {
    this.matSnackBar.open(message, 'Close', { duration: 3000 });
    this.router.navigate(['sessions']);
  }

  private showError(): void {
    this.matSnackBar.open('An error occurred', 'Close', { duration: 3000 });
  }
}
