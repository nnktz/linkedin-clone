import { User } from '../../auth/models/user.class';
import { Conversation } from './conversation.interface';

export interface Message {
  id?: number;
  user?: User;
  conversation: Conversation;
  createdAt?: Date;
}
