"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Koa = require("koa");
var Http = require("http");
var IO = require("socket.io");
var ChatState_1 = require("./model/ChatState");
var app = new Koa();
var server = Http.createServer(app.callback);
var io = IO(server);
var users = [];
var messages = [];
var lastMessageId = 0;
console.log('started!');
io.on('connection', function (socket) {
    console.log('connection aquired', socket.id, new Date());
    var currentUser = undefined;
    socket.on('chat.client.join', function (_, userName) {
        console.log("User " + userName + " joined");
        // if (users.some(x => x.name == userName)) {
        //   io.emit('chat.server.join-result', { type: ChatStateType.AuthenticationFailed, errorMessage: 'User with this name has already logged in' } as ChatState)
        // }
        currentUser = users.find(function (x) { return x.name == userName; }) || { name: userName, avatarUrl: undefined };
        users = users.concat([currentUser]);
        var chatState = { type: ChatState_1.ChatStateType.AuthenticatedAndInitialized, data: { users: users, messages: messages, currentUser: currentUser } };
        socket.emit('chat.server.join-result', chatState);
        var serverEvent = { type: 'UserJoined', data: currentUser };
        io.emit('chat.server.event', serverEvent);
    });
    socket.on('chat.client.message', function (_, messageSubmission) {
        lastMessageId++;
        var newMessage = { id: lastMessageId, text: messageSubmission.text, creationDate: new Date(), sender: currentUser };
        messages = messages.concat([newMessage]);
        var serverEvent = { type: 'MessageReceived', data: newMessage };
        io.emit('chat.server.event', serverEvent);
    });
    var handleLeave = function () {
        console.log('connection closed', socket.id, new Date());
        users = users.filter(function (x) { return x != currentUser; });
        var serverEvent = { type: 'UserLeft', data: currentUser };
        io.emit('chat.server.event', serverEvent);
    };
    socket.on('chat.client.leave', handleLeave);
    socket.on('disconnect', handleLeave);
});
server.listen(process.env.PORT || 26335);
//# sourceMappingURL=main.js.map