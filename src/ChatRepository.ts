import { User } from "./model/User";
import { Message, SubmittedMessage } from "./model/Message";
import { createAvatarUrl } from "./createAvatarUrl";

export class ChatRepository {

    private users: User[] = [];
    private messages: Message[] = [];
    private lastMessageId = 0;

    addOrGetUser(name: string): User {
        const existingUser = this.users.find(x => x.name == name);
        if (existingUser) return existingUser;

        const newUser = { name: name, id: this.users.length+1, avatarUrl: createAvatarUrl(name) };
        this.users.push(newUser);
        return newUser;
    }

    removeUser(userId: number): void {
        this.users.splice(this.users.findIndex(x => x.id == userId), 1);
    }

    addMessage(submittedMessage: SubmittedMessage, senderId: number): Message {
        this.lastMessageId++;
        const newMessage: Message = { id: this.lastMessageId, text: submittedMessage.text, creationDate: new Date(), senderId };
        this.messages.push(newMessage);
        return newMessage;
    }

    getState(): { users: User[], messages: Message[] } {
        return {
            users: this.users,
            messages: this.messages
        }
    }

    clear() {
        this.users = [];
        this.messages = [];
        this.lastMessageId = 0;
    }
}