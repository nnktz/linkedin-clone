import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import {
  Observable,
  Subscription,
  map,
  retry,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { BannerColorService } from '../../services/banner-color.service';
import { User } from 'src/app/auth/models/user.model';
import { ConnectionProfileService } from '../../services/connection-profile.service';
import {
  FriendRequestStatus,
  FriendRequest_Status,
} from '../../models/FriendRequest';

@Component({
  selector: 'app-connection-profile',
  templateUrl: './connection-profile.component.html',
  styleUrls: ['./connection-profile.component.scss'],
})
export class ConnectionProfileComponent implements OnInit, OnDestroy {
  user!: User;
  friendRequestStatus!: FriendRequest_Status;
  friendRequestStatusSubscription$!: Subscription;
  userSubscription$!: Subscription;

  constructor(
    public bannerColorService: BannerColorService,
    private route: ActivatedRoute,
    private connectionProfileService: ConnectionProfileService
  ) {}

  ngOnInit() {
    this.friendRequestStatusSubscription$ = this.getFriendRequestStatus()
      .pipe(
        tap((friendRequestStatus: FriendRequestStatus) => {
          if (friendRequestStatus && friendRequestStatus.status) {
            this.friendRequestStatus = friendRequestStatus.status;
          } else {
            // Handle the case where status is not defined as expected
          }

          this.userSubscription$ = this.getUser().subscribe((user: User) => {
            this.user = user;
            const imgPath = user.imagePath ?? 'user-default.png';
            this.user.imagePath =
              'http://localhost:3000/api/feed/image/' + imgPath;
          });
        })
      )
      .subscribe();
  }

  private getUserIdFromUrl(): Observable<number> {
    return this.route.url.pipe(
      map((urlSegment: UrlSegment[]) => {
        return +urlSegment[0].path;
      })
    );
  }

  getUser(): Observable<User> {
    return this.getUserIdFromUrl().pipe(
      switchMap((userId: number) => {
        return this.connectionProfileService.getConnectionUser(userId);
      })
    );
  }

  getFriendRequestStatus(): Observable<FriendRequestStatus> {
    return this.getUserIdFromUrl().pipe(
      switchMap((userId: number) => {
        return this.connectionProfileService.getFriendRequestStatus(userId);
      })
    );
  }

  addUser(): Subscription {
    this.friendRequestStatus = 'pending';
    return this.getUserIdFromUrl()
      .pipe(
        switchMap((userId: number) => {
          return this.connectionProfileService.addConnectionUser(userId);
        })
      )
      .pipe(take(1))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.userSubscription$.unsubscribe();
    this.friendRequestStatusSubscription$.unsubscribe();
  }
}
