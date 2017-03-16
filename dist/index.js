"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Http = require("http");
var SocketServer = require("socket.io");
var md5 = require("blueimp-md5");
var httpServer = Http.createServer();
var socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] });
var users = [];
var messages = [];
var lastMessageId = 0;
console.log('socket server started!');
socketServer.on('connection', function (socket) {
    console.log('connection acquired', socket.id, new Date());
    var currentUser = undefined;
    socket.on('chat.client.join', function (userName) {
        console.log("User '" + userName + "' joined");
        // if (users.some(x => x.name == userName)) {
        //   io.emit('chat.server.join-result', { type: ChatStateType.AuthenticationFailed, errorMessage: 'User with this name has already logged in' } as ChatState)
        // }
        currentUser = users.find(function (x) { return x.name == userName; });
        if (currentUser == null) {
            currentUser = { name: userName, avatarUrl: "http://unicornify.appspot.com/avatar/" + md5(userName) + "?s=128" };
            console.log(currentUser.avatarUrl);
            users = users.concat([currentUser]);
        }
        var joinResult = { isSuccessful: true, initialData: { currentUser: currentUser, users: users, messages: messages } };
        socket.emit('chat.server.join-result', joinResult);
        var serverEvent = { type: 'UserJoined', data: currentUser };
        socketServer.emit('chat.server.event', serverEvent);
    });
    socket.on('chat.client.message', function (messageSubmission) {
        lastMessageId++;
        var newMessage = { id: lastMessageId, text: messageSubmission.text, creationDate: new Date(), sender: currentUser };
        messages = messages.concat([newMessage]);
        var serverEvent = { type: 'MessageReceived', data: newMessage };
        socketServer.emit('chat.server.event', serverEvent);
    });
    var handleLeave = function () {
        console.log('connection closed', socket.id, new Date());
        if (!currentUser) {
            console.log('No user to kick');
            return;
        }
        console.log('Kicking user', currentUser.name);
        users = users.filter(function (x) { return x != currentUser; });
        var serverEvent = { type: 'UserLeft', data: currentUser.name };
        socketServer.emit('chat.server.event', serverEvent);
    };
    socket.on('chat.client.leave', handleLeave);
    socket.on('disconnect', handleLeave);
    // reset server data
    socket.on('chat.client.reset', function () {
        users = [];
        messages = [];
        lastMessageId = 0;
    });
});
httpServer.listen(37753);
//# sourceMappingURL=index.js.map