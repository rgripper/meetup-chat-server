import { User } from "./User";

export interface MessageSubmission {
  text: string
}

export interface Message {
  id: any,
  creationDate: Date,
  sender: User,
  text: string
}