"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var createAvatarUrl_1 = require("./createAvatarUrl");
var ChatRepository = (function () {
    function ChatRepository() {
        this.users = [];
        this.messages = [];
        this.lastMessageId = 0;
    }
    ChatRepository.prototype.addOrGetUser = function (name) {
        var existingUser = this.users.find(function (x) { return x.name == name; });
        if (existingUser)
            return existingUser;
        var newUser = { name: name, avatarUrl: createAvatarUrl_1.createAvatarUrl(name) };
        this.users.push(newUser);
        return newUser;
    };
    ChatRepository.prototype.removeUser = function (name) {
        this.users.splice(this.users.findIndex(function (x) { return x.name == name; }), 1);
    };
    ChatRepository.prototype.addMessage = function (submittedMessage, senderName) {
        this.lastMessageId++;
        var newMessage = { id: this.lastMessageId, text: submittedMessage.text, creationDate: new Date(), senderName: senderName };
        this.messages.push(newMessage);
        return newMessage;
    };
    ChatRepository.prototype.getState = function () {
        return {
            users: this.users,
            messages: this.messages
        };
    };
    ChatRepository.prototype.clear = function () {
        this.users = [];
        this.messages = [];
        this.lastMessageId = 0;
    };
    return ChatRepository;
}());
exports.ChatRepository = ChatRepository;
//# sourceMappingURL=ChatRepository.js.map