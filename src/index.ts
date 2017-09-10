import * as Http from 'http';
import * as SocketServer from 'socket.io';
import { User } from "./model/User";
import { Message, SubmittedMessage } from "./model/Message";
import { JoinResult } from './model/ChatState';
//import * as md5 from 'blueimp-md5';
import { createAvatarUrl } from "./createAvatarUrl";
import { ServerEvent } from "./ServerEvent";
import { ChatRepository } from "./ChatRepository";
import { appSettings } from "./appSettings";


type EmitEvent = (eventName: string, eventData: ServerEvent | JoinResult) => void

function addDummyData(chatRepo: ChatRepository) {
    const dummyUser = chatRepo.addOrGetUser('Dummy user');
    chatRepo.addMessage({ text: 'Are you talking to me?' }, dummyUser.id);
    chatRepo.addMessage({ text: `Well I'm the only one here.` }, dummyUser.id);
    chatRepo.removeUser(dummyUser.id);
}

const chatRepo = new ChatRepository();
addDummyData(chatRepo);

const httpServer = Http.createServer(function (request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    if (request.url && request.url.endsWith('/clear')) {
        chatRepo.clear();
        addDummyData(chatRepo);
        response.end("Chat server data has been cleared");
    }
    else {
        response.end("Chat server is listening");
    }
});

const socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] } as SocketIO.ServerOptions);

function handleLeave(emitEvent: EmitEvent, user: User) {
    console.log(`User '${user.name}' left`);
    chatRepo.removeUser(user.id);
    emitEvent('chat.server.event', { type: 'UserLeft', data: user.id });
};

function handleSubmittedMessage(emitEvent: EmitEvent, submittedMessage: SubmittedMessage, user: User) {
    const newMessage = chatRepo.addMessage(submittedMessage, user.id);
    emitEvent('chat.server.event', { type: 'MessageReceived', data: newMessage });
}

function handleNewSocket(socket: SocketIO.Socket) {
    console.log('connection acquired', socket.id, new Date());

    socket.on('chat.client.join', (userName: string) => {
        console.log(`User '${userName}' joined`);

        const emitEvent = socket.emit.bind(socket);
        const currentUser = chatRepo.addOrGetUser(userName);

        socket.on('chat.client.leave', () => handleLeave(emitEvent, currentUser));
        socket.on('disconnect', () => handleLeave(emitEvent, currentUser));
        socket.on('chat.client.message', (submittedMessage: SubmittedMessage) => handleSubmittedMessage(emitEvent, submittedMessage, currentUser));

        const joinResult: JoinResult = { isSuccessful: true, initialData: chatRepo.getState(), user: currentUser };
        emitEvent('chat.server.join-result', joinResult);

        const serverEvent: ServerEvent = { type: 'UserJoined', data: currentUser };
        emitEvent('chat.server.event', { type: 'UserJoined', data: currentUser });
    })

    // reset server data
    socket.on('chat.client.reset', () => chatRepo.clear());
}

socketServer.on('connection', handleNewSocket);

httpServer.listen((process.env as any).PORT || appSettings.chatServerPort);
console.log('Chat server is listening on ' + httpServer.address().port);
