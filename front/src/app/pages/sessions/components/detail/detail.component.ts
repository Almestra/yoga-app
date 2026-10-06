import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs';

import { Session } from '../../../../core/models/session.interface';
import { Teacher } from '../../../../core/models/teacher.interface';
import { SessionService } from '../../../../core/service/session.service';
import { SessionApiService } from '../../../../core/service/session-api.service';
import { TeacherService } from '../../../../core/service/teacher.service';
import { MaterialModule } from '../../../../shared/material.module';

@Component({
  selector: 'app-detail',
  imports: [CommonModule, MaterialModule],
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  public session: Session | undefined;
  public teacher: Teacher | undefined;
  public isParticipate = false;
  public isAdmin = false;
  public sessionId: string;
  public userId: string;

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private sessionApiService = inject(SessionApiService);
  private teacherService = inject(TeacherService);
  private matSnackBar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isAdmin = this.sessionService.sessionInformation?.admin ?? false;
    this.userId = this.sessionService.sessionInformation?.id.toString() ?? '';
  }

  ngOnInit(): void {
    this.fetchSession();
  }

  public back(): void {
    window.history.back();
  }

  public delete(): void {
    this.sessionApiService
      .delete(this.sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.matSnackBar.open('Session deleted !', 'Close', { duration: 3000 });
        this.router.navigate(['sessions']);
      });
  }

  public participate(): void {
    this.sessionApiService
      .participate(this.sessionId, this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchSession());
  }

  public unParticipate(): void {
    this.sessionApiService
      .unParticipate(this.sessionId, this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.fetchSession());
  }

  private fetchSession(): void {
    this.sessionApiService
      .detail(this.sessionId)
      .pipe(
        tap((session: Session) => {
          this.session = session;
          this.isParticipate = session.users.some(
            (u) => u === this.sessionService.sessionInformation?.id,
          );
        }),
        switchMap((session: Session) => this.teacherService.detail(session.teacher_id.toString())),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((teacher: Teacher) => (this.teacher = teacher));
  }
}
