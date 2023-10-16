import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Socket } from 'ngx-socket-io';
import { Observable } from 'rxjs';

import { User } from '../../../app/auth/models/user.model';
import { environment } from '../../../environments/environment';
import { ChatSocketService } from '../../core/chat-socket.service';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  constructor(
    private chatSocketService: ChatSocketService,
    private http: HttpClient
  ) {}

  getFriends(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.baseApiUrl}/user/friends/my`);
  }

  sendMessage(message: string, conversation: Conversation): void {
    const newMessage: Message = {
      message,
      conversation,
    };

    this.chatSocketService.emit('sendMessage', newMessage);
  }

  getNewMessage(): Observable<Message> {
    return this.chatSocketService.fromEvent<Message>('newMessage');
  }

  createConversation(friend: User): void {
    this.chatSocketService.emit('createConversation', friend);
  }

  joinConversation(friendId: number): void {
    this.chatSocketService.emit('joinConversation', friendId);
  }

  leaveConversation(): void {
    this.chatSocketService.emit('leaveConversation');
  }

  getConversationMessages(): Observable<Message[]> {
    return this.chatSocketService.fromEvent<Message[]>('messages');
  }

  getConversations(): Observable<Conversation[]> {
    return this.chatSocketService.fromEvent<Conversation[]>('conversations');
  }
}
