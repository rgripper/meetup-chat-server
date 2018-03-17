"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createAvatarUrl_1 = require("./createAvatarUrl");
class ChatRepository {
    constructor() {
        this.users = [];
        this.messages = [];
        this.lastMessageId = 0;
    }
    addOrConnectUser(name) {
        const existingUser = this.users.find(x => x.name == name);
        if (existingUser) {
            existingUser.isConnected = true;
            return existingUser;
        }
        ;
        const newUser = { name: name, isConnected: true, isTyping: false, id: this.users.length + 1, avatarUrl: createAvatarUrl_1.createAvatarUrl(name) };
        this.users.push(newUser);
        return newUser;
    }
    removeUser(userId) {
        const disconnectedUser = this.users.find(x => x.id == userId);
        if (disconnectedUser) {
            disconnectedUser.isConnected = false;
        }
    }
    setIsTyping(isTyping, userId) {
        const typingUser = this.users.find(x => x.id == userId);
        if (typingUser) {
            typingUser.isTyping = isTyping;
        }
    }
    addMessage(submittedMessage, senderId) {
        this.lastMessageId++;
        const newMessage = { id: this.lastMessageId, text: submittedMessage.text, creationDate: new Date(), senderId };
        this.messages.push(newMessage);
        return newMessage;
    }
    getState() {
        return {
            users: this.users,
            messages: this.messages
        };
    }
    clear() {
        this.users = [];
        this.messages = [];
        this.lastMessageId = 0;
    }
}
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=ChatRepository.js.map