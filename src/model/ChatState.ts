import { User } from "./User";
import { Message } from './Message';

export interface ChatData {
    readonly currentUser: User,
    readonly users: User[],
    readonly messages: Message[]
}

export enum ChatStateType { AuthenticationFailed, AuthenticatedAndInitialized, NotAuthenticated, Authenticating }

export type ChatState =
    | {
        readonly type: ChatStateType.NotAuthenticated
    }
    | {
        readonly type: ChatStateType.Authenticating,
        readonly userName: string
    }
    | {
        readonly type: ChatStateType.AuthenticatedAndInitialized,
        readonly data: ChatData
    }
    | {
        readonly type: ChatStateType.AuthenticationFailed,
        readonly errorMessage: string
    }