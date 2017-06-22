import { Message } from "./model/Message";
import { User } from "./model/User";

export type ServerEvent =
    | {
        type: 'MessageReceived',
        data: Message
    }
    | {
        type: 'UserJoined',
        data: User
    }
    | {
        type: 'UserLeft',
        data: string
    };