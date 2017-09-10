import { User } from "./User";
import { Message } from './Message';

export interface ChatData {
    readonly users: User[],
    readonly messages: Message[]
}

export type JoinResult = { isSuccessful: true, initialData: ChatData, user: User } | { isSuccessful: false, errorMessage: string };