import { User } from 'src/auth/models/user.interface';

export interface FeedPost {
  id?: number;
  body?: string;
  createAt?: Date;
  author?: User;
}
