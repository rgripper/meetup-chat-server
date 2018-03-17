import { User } from "./shared/model/User";
import { Message, SubmittedMessage } from "./shared/model/Message";
import { createAvatarUrl } from "./createAvatarUrl";

export class ChatRepository {

    private users: User[] = [];
    private messages: Message[] = [];
    private lastMessageId = 0;

    addOrConnectUser(name: string): User {
        const existingUser = this.users.find(x => x.name == name);
        if (existingUser) {
            existingUser.isConnected = true;
            return existingUser;
        };

        const newUser = { name: name, isConnected: true, isTyping: false, id: this.users.length + 1, avatarUrl: createAvatarUrl(name) };
        this.users.push(newUser);
        return newUser;
    }

    removeUser(userId: number): void {
        const disconnectedUser = this.users.find(x => x.id == userId);
        if (disconnectedUser) {
            disconnectedUser.isConnected = false;
        }
    }

    setIsTyping(isTyping: boolean, userId: number): void {
        const typingUser = this.users.find(x => x.id == userId);
        if (typingUser) {
            typingUser.isTyping = isTyping;
        }
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