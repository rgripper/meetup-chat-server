import { User } from "./User";

export interface SubmittedMessage {
  text: string
}

export interface Message {
  id: any,
  creationDate: Date
  senderId: number
  text: string
}