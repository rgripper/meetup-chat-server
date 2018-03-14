import * as Http from 'http';
import * as SocketServer from 'socket.io';
import { User } from "./shared/model/User";
import { Message, SubmittedMessage } from "./shared/model/Message";

//import * as md5 from 'blueimp-md5';
import { createAvatarUrl } from "./createAvatarUrl";
import { ChatRepository } from "./ChatRepository";
import { appSettings } from "./appSettings";
import { WebSocketEventName } from './shared/transport/WebSocketEventName';
import { ClientCommand, ClientCommandType } from './shared/ClientCommand';
import { ServerEvent, ServerEventType } from './shared/ServerEvent';


type EmitEvent = (event: ServerEvent) => void

function addDummyData(chatRepo: ChatRepository) {
    const dummyUser = chatRepo.addOrConnectUser('Dummy user');
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

const CustomClientEventName = 'CustomClientEvent'

enum CustomClientEventType {
    UserLeft = 'CustomClientEventType.UserLeft',
    UserJoined = 'CustomClientEventType.UserJoined',
    NewMessage = 'CustomClientEventType.MessageReceived',
    Reset = 'CustomClientEventType.Reset'
}

const socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] } as SocketIO.ServerOptions);

function handleLeave(emitEvent: EmitEvent, user: User) {
    console.log(`User '${user.name}' left`);
    chatRepo.removeUser(user.id);
    emitEvent({ type: ServerEventType.UserLeft, userId: user.id });
}

function handleSubmittedMessage(emitEvent: EmitEvent, submittedMessage: SubmittedMessage, user: User) {
    const addedMessage = chatRepo.addMessage(submittedMessage, user.id);
    emitEvent({ type: ServerEventType.MessageAdded, message: addedMessage });
}

function handleNewSocket(socket: SocketIO.Socket) {
    console.log('connection acquired', socket.id, new Date());

    socket.on(WebSocketEventName.ClientCommand, (clientCommand: ClientCommand) => {
        const emitEvent = (event: ServerEvent) => socket.emit(WebSocketEventName.ServerEvent, event);
        let currentUser: User | undefined;

        switch (clientCommand.type) {
            case ClientCommandType.TryLogin: {
                
                currentUser = chatRepo.addOrConnectUser(clientCommand.userName);
        
                socket.on(CustomClientEventType.UserLeft, () => handleLeave(emitEvent, currentUser!));
                socket.on('disconnect', () => handleLeave(emitEvent, currentUser!));
        
                emitEvent({ type: ServerEventType.LoginSuccessful, chat: chatRepo.getState() });
                emitEvent({ type: ServerEventType.UserJoined, user: currentUser });

                console.log(`User '${clientCommand}' joined`);
                return;
            }
            case ClientCommandType.Logout: {
                handleLeave(emitEvent, currentUser!);
                return;
            }
            case ClientCommandType.AddMessage: {
                handleSubmittedMessage(emitEvent, clientCommand.message, currentUser!);
                return;
            }
            case ClientCommandType.ResetState: {
                chatRepo.clear();
                emitEvent({ type: ServerEventType.LoginSuccessful, chat: chatRepo.getState() });
                return;
            }
        }
    })

    // reset server data
    socket.on(CustomClientEventType.Reset, () => chatRepo.clear());
}

socketServer.on('connection', handleNewSocket);

httpServer.listen((process.env as any).PORT || appSettings.chatServerPort);
console.log('Chat server is listening on ' + httpServer.address().port);
