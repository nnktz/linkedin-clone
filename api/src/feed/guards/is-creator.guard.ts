import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable, map, switchMap } from 'rxjs';

import { FeedService } from '../services/feed.service';
import { User } from '../../auth/models/user.class';
import { FeedPost } from '../models/post.interface';
import { UserService } from '../../auth/services/user.service';

@Injectable()
export class IsCreatorGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private feedService: FeedService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const { user, params }: { user: User; params: { id: number } } = req;

    if (!user || !params) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    const userId = user.id;
    const feedId = params.id;

    return this.userService.findUserById(userId).pipe(
      switchMap((user: User) =>
        this.feedService.findPostById(feedId).pipe(
          map((feedPost: FeedPost) => {
            const isAuthor = user.id === feedPost.author.id;
            return isAuthor;
          }),
        ),
      ),
    );
  }
}
