import { Message } from "./model/Message";
import { User } from "./model/User";
import { ChatState } from "./model/ChatState";

export enum ServerEventType {
    UserLeft,
    UserJoined,
    MessageAdded,
    LoginSuccessful,
    LoginFailed
}

export type ServerEvent =
    | {
        type: ServerEventType.MessageAdded,
        message: Message
    }
    | {
        type: ServerEventType.UserJoined,
        user: User
    }
    | {
        type: ServerEventType.UserLeft,
        userId: number
    }
    | {
        type: ServerEventType.LoginSuccessful,
        chat: ChatState
    }
    | {
        type: ServerEventType.LoginFailed,
        error: string
    }