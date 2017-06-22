import * as Http from 'http';
import * as SocketServer from 'socket.io';
import { User } from "./model/User";
import { Message, SubmittedMessage } from "./model/Message";
import { JoinResult } from './model/ChatState';
//import * as md5 from 'blueimp-md5';
import { appSettings } from './appSettings';
import { createAvatarUrl } from "./createAvatarUrl";
import { ServerEvent } from "./ServerEvent";
import { ChatRepository } from "./ChatRepository";

const httpServer = Http.createServer();
const socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] } as SocketIO.ServerOptions);

const chatRepo = new ChatRepository();

const dummyUser = chatRepo.addOrGetUser('Dummy user');
chatRepo.addMessage({ text: 'Are you talking to me?' }, dummyUser.name);
chatRepo.addMessage({ text: `Well I'm the only one here.` }, dummyUser.name);
chatRepo.removeUser(dummyUser.name);

function handleLeave (user: User) {
    if (!user) {
        console.error('handleLeave called when there is no current user');
        return;
    }

    console.log(`User '${user.name}' left`);
    chatRepo.removeUser(user.name);

    const serverEvent: ServerEvent = { type: 'UserLeft', data: user.name };
    socketServer.emit('chat.server.event', serverEvent);
};

function handleSubmittedMessage(submittedMessage: SubmittedMessage, user: User) {
    const newMessage = chatRepo.addMessage(submittedMessage, user.name);
    const serverEvent: ServerEvent = { type: 'MessageReceived', data: newMessage };
    socketServer.emit('chat.server.event', serverEvent);
}

function handleNewSocket(socket: SocketIO.Socket) {
    console.log('connection acquired', socket.id, new Date());

    socket.on('chat.client.join', (userName: string) => {
        console.log(`User '${userName}' joined`);

        const currentUser = chatRepo.addOrGetUser(userName);

        socket.on('chat.client.leave', () => handleLeave(currentUser));
        socket.on('disconnect', () => handleLeave(currentUser));
        socket.on('chat.client.message', (submittedMessage: SubmittedMessage) => handleSubmittedMessage(submittedMessage, currentUser));

        const joinResult: JoinResult = { isSuccessful: true, initialData: { currentUser, ...chatRepo.getState() } };
        socket.emit('chat.server.join-result', joinResult);

        const serverEvent: ServerEvent = { type: 'UserJoined', data: currentUser };
        socketServer.emit('chat.server.event', serverEvent);
    })

    // reset server data
    socket.on('chat.client.reset', () => chatRepo.clear());
}

socketServer.on('connection', handleNewSocket);

httpServer.listen(appSettings.chatServerPort);
console.log('Chat server is listening');
