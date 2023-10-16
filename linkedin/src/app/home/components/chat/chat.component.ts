import { Component, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { ChatService } from '../../services/chat.service';
import { User } from '../../../auth/models/user.model';
import { AuthService } from '../../../auth/services/auth.service';
import { Conversation } from '../../models/Conversation';
import { Message } from '../../models/Message';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  @ViewChild('form') form!: NgForm;

  userFullImagePath!: string;
  userId!: number;

  conversations$!: Observable<Conversation[]>;
  conversations: Conversation[] = [];
  conversation: Conversation | undefined;

  newMessage$!: Observable<string>;
  messages: Message[] = [];

  friends: User[] = [];
  friend: User | undefined;
  friend$: BehaviorSubject<User> = new BehaviorSubject<User>({});

  selectedConversationIndex: number = 0;

  private userImagePathSubscription!: Subscription;
  private userIdSubscription!: Subscription;
  private friendsSubscription!: Subscription;
  private friendSubscription!: Subscription;
  private newMessagesSubscription!: Subscription;
  private conversationSubscription!: Subscription;
  private messageSubscription!: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ionViewDidEnter() {
    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });

    this.userIdSubscription = this.authService.userId.subscribe(
      (userId: number | undefined) => {
        if (userId) {
          this.userId = userId;
        }
      }
    );

    this.conversationSubscription = this.chatService
      .getConversations()
      .subscribe((conversations: Conversation[]) => {
        this.conversations.push(conversations[0]); // NOTE: from mergeMap stream
      });

    this.messageSubscription = this.chatService
      .getConversationMessages()
      .subscribe((messages: Message[]) => {
        messages.forEach((message: Message) => {
          const allMessageIds = this.messages.map(
            (message: Message) => message.id
          );

          if (!allMessageIds.includes(message.id)) {
            this.messages.push(message);
          }
        });
      });

    this.newMessagesSubscription = this.chatService
      .getNewMessage()
      .subscribe((message: Message) => {
        message.createdAt = new Date();
        const allMessageIds = this.messages.map(
          (message: Message) => message.id
        );

        if (!allMessageIds.includes(message.id)) {
          this.messages.push(message);
        }
      });

    this.friendSubscription = this.friend$.subscribe((friend: any) => {
      if (
        JSON.stringify(friend) !== '{}' &&
        this.friend !== undefined &&
        this.friend.id !== undefined
      ) {
        this.chatService.joinConversation(this.friend.id);
      }
    });

    this.friendsSubscription = this.chatService
      .getFriends()
      .subscribe((friends: User[]) => {
        this.friends = friends;

        if (friends.length > 0) {
          this.friend = this.friends[0];
          this.friend$.next(this.friend);

          friends.forEach((friend: User) => {
            this.chatService.createConversation(friend);
          });

          if (this.friend.id !== undefined) {
            this.chatService.joinConversation(this.friend.id);
          }
        }
      });
  }

  onSubmit() {
    const { message } = this.form.value;
    if (!message) {
      return;
    }

    if (this.friend !== undefined) {
      let conversationUserIds = [this.userId, this.friend.id].sort();

      this.conversations.forEach((conversation: Conversation) => {
        if (conversation.users !== undefined) {
          let userIds = conversation.users.map((user: User) => user.id).sort();

          if (JSON.stringify(conversationUserIds) === JSON.stringify(userIds)) {
            this.conversation = conversation;
          }
        }
      });
    }

    if (this.conversation !== undefined) {
      this.chatService.sendMessage(message, this.conversation);
    }
    this.form.reset();
  }

  openConversation(friend: User, index: number) {
    this.selectedConversationIndex = index;
    this.chatService.leaveConversation();
    this.friend = friend;
    this.friend$.next(this.friend);
    this.messages = [];
  }

  deriveFullImagePath(user: User): string {
    let url = 'http://localhost:3000/api/feed/image/';

    if (user.id === this.userId) {
      return this.userFullImagePath;
    } else if (user.imagePath) {
      return url + user.imagePath;
    } else if (this.friend?.imagePath) {
      return url + this.friend.imagePath;
    } else {
      return url + 'user-default.png';
    }
  }

  ionViewDidLeave(): void {
    this.chatService.leaveConversation();

    this.selectedConversationIndex = 0;
    this.conversations = [];
    this.conversation = undefined;
    this.messages = [];
    this.friends = [];
    this.friend = undefined;

    this.userImagePathSubscription.unsubscribe();
    this.userIdSubscription.unsubscribe();
    this.conversationSubscription.unsubscribe();
    this.newMessagesSubscription.unsubscribe();
    this.messageSubscription.unsubscribe();
    this.friendSubscription.unsubscribe();
    this.friendsSubscription.unsubscribe();
  }
}
