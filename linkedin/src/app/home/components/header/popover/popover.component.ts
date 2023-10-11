import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription, take } from 'rxjs';

import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
})
export class PopoverComponent implements OnInit, OnDestroy {
  constructor(private authService: AuthService) {}

  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;

  fullName$ = new BehaviorSubject<string | null>(null);
  fullName = '';

  ngOnInit() {
    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });

    this.authService.userFullName
      .pipe(take(1))
      .subscribe((fullName: string) => {
        this.fullName = fullName;
        this.fullName$.next(fullName);
      });
  }

  onSignOut() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.userImagePathSubscription.unsubscribe();
  }
}
