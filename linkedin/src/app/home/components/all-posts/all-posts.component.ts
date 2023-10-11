import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { IonInfiniteScroll, ModalController } from '@ionic/angular';
import { BehaviorSubject, Subscription, take } from 'rxjs';

import { PostService } from '../../services/post.service';
import { Post } from '../../models/Post';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ModalComponent } from '../start-post/modal/modal.component';
import { User } from 'src/app/auth/models/user.model';

@Component({
  selector: 'app-all-posts',
  templateUrl: './all-posts.component.html',
  styleUrls: ['./all-posts.component.scss'],
})
export class AllPostsComponent implements OnInit, OnDestroy {
  @ViewChild(IonInfiniteScroll)
  infiniteScroll!: IonInfiniteScroll;

  @Input() postBody?: string;

  queryParams!: string;
  allLoadedPosts: Post[] = [];
  numberOfPosts = 5;
  skipPosts = 0;

  userId$ = new BehaviorSubject<number | null>(null);

  private userSubscription!: Subscription;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.userStream.subscribe(
      (user: User | null) => {
        this.allLoadedPosts.forEach((post: Post, index: number) => {
          if (user?.imagePath && post.author.id === user.id) {
            this.allLoadedPosts[index].author.imagePath =
              this.authService.getFullImagePath(user.imagePath);
          }
        });
      }
    );

    this.getPosts(false, '');

    this.authService.userId
      .pipe(take(1))
      .subscribe((userId: number | undefined) => {
        if (userId !== undefined) {
          this.userId$.next(userId);
        } else {
          // Handle the case where userId is undefined, if needed.
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    const postBody = changes['postBody'].currentValue;

    if (!postBody) {
      return;
    }

    this.postService.createPost(postBody).subscribe((post: Post) => {
      this.authService.userFullImagePath
        .pipe(take(1))
        .subscribe((fullImagePath: string) => {
          post.author.imagePath = fullImagePath;
          this.allLoadedPosts.unshift(post);
        });
    });
  }

  getPosts(isInitialLoad: boolean, event: any) {
    if (this.skipPosts === 20) {
      event.target.disabled = true;
    }

    this.queryParams = `?take=${this.numberOfPosts}&skip=${this.skipPosts}`;
    this.postService.getSelectedPosts(this.queryParams).subscribe(
      (posts: Post[]) => {
        for (let postIndex = 0; postIndex < posts.length; postIndex++) {
          const doesAuthorHaveImage = !!posts[postIndex].author.imagePath;
          let fullImagePath = this.authService.getDefaultFullImagePath();

          if (doesAuthorHaveImage) {
            fullImagePath = this.authService.getFullImagePath(
              posts[postIndex].author.imagePath
            );
          }

          posts[postIndex].author.imagePath = fullImagePath;

          this.allLoadedPosts.push(posts[postIndex]);
        }

        if (isInitialLoad) {
          event.target.complete();
        }

        this.skipPosts = this.skipPosts + 5;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  loadData(event: any) {
    this.getPosts(true, event);
  }

  async presentUpdateModal(postId: number) {
    const modal = await this.modalController.create({
      component: ModalComponent,
      cssClass: 'my-custom-class2',
      componentProps: {
        postId,
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();

    if (!data) {
      return;
    }

    const newPostBody = data.post.body;
    this.postService.updatePost(postId, newPostBody).subscribe(() => {
      const postIndex = this.allLoadedPosts.findIndex(
        (post: Post) => post.id == postId
      );

      this.allLoadedPosts[postIndex].body = newPostBody;
    });
  }

  deletePost(postId: number) {
    this.postService.deletePost(postId).subscribe(() => {
      this.allLoadedPosts = this.allLoadedPosts.filter(
        (post: Post) => post.id !== postId
      );
    });
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
}
