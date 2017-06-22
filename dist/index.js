"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Http = require("http");
var SocketServer = require("socket.io");
//import * as md5 from 'blueimp-md5';
var appSettings_1 = require("./appSettings");
var ChatRepository_1 = require("./ChatRepository");
var httpServer = Http.createServer();
var socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] });
var chatRepo = new ChatRepository_1.ChatRepository();
var dummyUser = chatRepo.addOrGetUser('Dummy user');
chatRepo.addMessage({ text: 'Are you talking to me?' }, dummyUser.name);
chatRepo.addMessage({ text: "Well I'm the only one here." }, dummyUser.name);
chatRepo.removeUser(dummyUser.name);
function handleLeave(user) {
    if (!user) {
        console.error('handleLeave called when there is no current user');
        return;
    }
    console.log("User '" + user.name + "' left");
    chatRepo.removeUser(user.name);
    var serverEvent = { type: 'UserLeft', data: user.name };
    socketServer.emit('chat.server.event', serverEvent);
}
;
function handleSubmittedMessage(submittedMessage, user) {
    var newMessage = chatRepo.addMessage(submittedMessage, user.name);
    var serverEvent = { type: 'MessageReceived', data: newMessage };
    socketServer.emit('chat.server.event', serverEvent);
}
function handleNewSocket(socket) {
    console.log('connection acquired', socket.id, new Date());
    socket.on('chat.client.join', function (userName) {
        console.log("User '" + userName + "' joined");
        var currentUser = chatRepo.addOrGetUser(userName);
        socket.on('chat.client.leave', function () { return handleLeave(currentUser); });
        socket.on('disconnect', function () { return handleLeave(currentUser); });
        socket.on('chat.client.message', function (submittedMessage) { return handleSubmittedMessage(submittedMessage, currentUser); });
        var joinResult = { isSuccessful: true, initialData: __assign({ currentUser: currentUser }, chatRepo.getState()) };
        socket.emit('chat.server.join-result', joinResult);
        var serverEvent = { type: 'UserJoined', data: currentUser };
        socketServer.emit('chat.server.event', serverEvent);
    });
    // reset server data
    socket.on('chat.client.reset', function () { return chatRepo.clear(); });
}
socketServer.on('connection', handleNewSocket);
httpServer.listen(appSettings_1.appSettings.chatServerPort);
console.log('Chat server is listening');
//# sourceMappingURL=index.js.map