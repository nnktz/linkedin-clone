import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { take, tap, Observable } from 'rxjs';

import { FriendRequest } from 'src/app/home/models/FriendRequest';
import { ConnectionProfileService } from 'src/app/home/services/connection-profile.service';
import { User } from 'src/app/auth/models/user.model';

interface ExtendedFriendRequest extends FriendRequest {
  fullImagePath?: string;
}

@Component({
  selector: 'app-friend-requests-popover',
  templateUrl: './friend-requests-popover.component.html',
  styleUrls: ['./friend-requests-popover.component.scss'],
})
export class FriendRequestsPopoverComponent implements OnInit {
  constructor(
    public connectionProfileService: ConnectionProfileService,
    private popoverController: PopoverController
  ) {}

  ngOnInit() {
    this.connectionProfileService.friendRequests.map(
      (friendRequest: ExtendedFriendRequest) => {
        const creatorId = (friendRequest as any)?.creator?.id;

        if (friendRequest && creatorId) {
          this.connectionProfileService
            .getConnectionUser(creatorId)
            .pipe(
              take(1),
              tap((user: User) => {
                friendRequest.fullImagePath =
                  'http://localhost:3000/api/feed/image/' +
                  (user?.imagePath || 'user-default.png');
              })
            )
            .subscribe();
        }
      }
    );
  }

  async responseToFriendRequest(
    id: number,
    statsResponse: 'accepted' | 'declined'
  ) {
    const handledFriendRequest: FriendRequest | undefined =
      this.connectionProfileService.friendRequests.find(
        (friendRequest) => friendRequest.id === id
      );

    const unhandledFriendRequest: FriendRequest[] =
      this.connectionProfileService.friendRequests.filter(
        (friendRequest) => friendRequest.id !== handledFriendRequest?.id
      );

    this.connectionProfileService.friendRequests = unhandledFriendRequest;

    if (this.connectionProfileService?.friendRequests.length === 0) {
      await this.popoverController.dismiss();
    }

    return this.connectionProfileService
      .responseToFriendRequest(id, statsResponse)
      .pipe(take(1))
      .subscribe();
  }
}
