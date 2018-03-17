"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Http = require("http");
const SocketServer = require("socket.io");
const ChatRepository_1 = require("./ChatRepository");
const appSettings_1 = require("./appSettings");
const WebSocketEventName_1 = require("./shared/transport/WebSocketEventName");
const ClientCommand_1 = require("./shared/ClientCommand");
const ServerEvent_1 = require("./shared/ServerEvent");
function addDummyData(chatRepo) {
    const dummyUser = chatRepo.addOrConnectUser('Dummy user');
    chatRepo.addMessage({ text: 'Are you talking to me?' }, dummyUser.id);
    chatRepo.addMessage({ text: `Well I'm the only one here.` }, dummyUser.id);
    chatRepo.removeUser(dummyUser.id);
}
const chatRepo = new ChatRepository_1.ChatRepository();
//addDummyData(chatRepo);
const httpServer = Http.createServer(function (request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    if (request.url && request.url.endsWith('/clear')) {
        chatRepo.clear();
        //addDummyData(chatRepo);
        response.end("Chat server data has been cleared");
    }
    else {
        response.end("Chat server is listening");
    }
});
const CustomClientEventName = 'CustomClientEvent';
const socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] });
function handleLogout(emitEvent, user) {
    console.log(`User '${user.name}' left`);
    chatRepo.removeUser(user.id);
    emitEvent({ type: ServerEvent_1.ServerEventType.UserLeft, userId: user.id });
}
function handleAddMessage(emitEvent, submittedMessage, user) {
    const addedMessage = chatRepo.addMessage(submittedMessage, user.id);
    emitEvent({ type: ServerEvent_1.ServerEventType.MessageAdded, message: addedMessage });
}
function handlResetState(emitEvent) {
    chatRepo.clear();
    emitEvent({ type: ServerEvent_1.ServerEventType.LoginSuccessful, chat: chatRepo.getState() });
}
const broadcast = (event) => socketServer.emit(WebSocketEventName_1.WebSocketEventName.ServerEvent, event);
function handleNewSocket(socket) {
    console.log('Connected', socket.id);
    let currentUser;
    socket.on('disconnect', () => {
        if (currentUser != undefined) {
            handleLogout(broadcast, currentUser);
            currentUser = undefined;
        }
    });
    socket.on(WebSocketEventName_1.WebSocketEventName.ClientCommand, (clientCommand) => {
        console.log('receiving command', JSON.stringify(clientCommand));
        const reply = (event) => socket.emit(WebSocketEventName_1.WebSocketEventName.ServerEvent, event);
        if (clientCommand.type === ClientCommand_1.ClientCommandType.TryLogin) {
            currentUser = chatRepo.addOrConnectUser(clientCommand.userName);
            broadcast({ type: ServerEvent_1.ServerEventType.UserJoined, user: currentUser });
            reply({ type: ServerEvent_1.ServerEventType.LoginSuccessful, chat: chatRepo.getState() });
            console.log(`User '${clientCommand.userName}' joined`);
            return;
        }
        if (currentUser == undefined) {
            return;
        }
        switch (clientCommand.type) {
            case ClientCommand_1.ClientCommandType.Logout: {
                handleLogout(broadcast, currentUser);
                currentUser = undefined;
                return;
            }
            case ClientCommand_1.ClientCommandType.AddMessage: {
                handleAddMessage(broadcast, clientCommand.message, currentUser);
                return;
            }
            case ClientCommand_1.ClientCommandType.ResetState: {
                handlResetState(broadcast);
                return;
            }
        }
    });
}
socketServer.on('connection', handleNewSocket);
httpServer.listen(process.env.PORT || appSettings_1.appSettings.chatServerPort);
console.log('Chat server is listening on ' + httpServer.address().port);
//# sourceMappingURL=index.js.map