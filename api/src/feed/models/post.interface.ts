import { User } from 'src/auth/models/user.class';

export interface FeedPost {
  id?: number;
  body?: string;
  createAt?: Date;
  author?: User;
}
