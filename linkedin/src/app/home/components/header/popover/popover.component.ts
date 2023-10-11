import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

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

  ngOnInit() {
    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });
  }

  onSignOut() {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.userImagePathSubscription.unsubscribe();
  }
}
