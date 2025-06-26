import { User } from "./user";

export interface Blog {
  id: number;
  title: string;
  image: string;
  content: string;
  author: User;
}
