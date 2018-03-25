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
        //addDummyData(chatRepo);
        response.end("Chat server data has been cleared");
    }
    else {
        response.end("Chat server is listening");
    }
});

const CustomClientEventName = 'CustomClientEvent'

const socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] } as SocketIO.ServerOptions);

const broadcast = (event: ServerEvent) => socketServer.emit(WebSocketEventName.ServerEvent, event);

function handleLogout(user: User) {
    console.log(`User '${user.name}' left`);
    chatRepo.removeUser(user.id);
    broadcast({ type: ServerEventType.UserLeft, userId: user.id });
}

function handleAddMessage(submittedMessage: SubmittedMessage, user: User) {
    const addedMessage = chatRepo.addMessage(submittedMessage, user.id);
    broadcast({ type: ServerEventType.MessageAdded, message: addedMessage });
}

function handlResetState() {
    chatRepo.clear();
    broadcast({ type: ServerEventType.LoginSuccessful, chat: chatRepo.getState() });
}


function handleNewSocket(socket: SocketIO.Socket) {
    console.log('Connected', socket.id);
    let currentUser: User | undefined;
    socket.on('disconnect', () => {
        if (currentUser != undefined) {
            handleLogout(currentUser);
            currentUser = undefined;
        }
    });
    socket.on(WebSocketEventName.ClientCommand, (clientCommand: ClientCommand) => {
        console.log('receiving command', JSON.stringify(clientCommand))
        const reply = (event: ServerEvent) => socket.emit(WebSocketEventName.ServerEvent, event);
        
        if (clientCommand.type === ClientCommandType.TryLogin) {
            currentUser = chatRepo.addOrConnectUser(clientCommand.userName);

            broadcast({ type: ServerEventType.UserJoined, user: currentUser });
            reply({ type: ServerEventType.LoginSuccessful, chat: chatRepo.getState() });

            console.log(`User '${clientCommand.userName}' joined`);
            return;
        }

        if (currentUser == undefined) {
            return;
        }

        switch (clientCommand.type) {
            case ClientCommandType.Logout: {
                handleLogout(currentUser);
                currentUser = undefined;
                return;
            }
            case ClientCommandType.AddMessage: {
                handleAddMessage(clientCommand.message, currentUser);
                return;
            }
            case ClientCommandType.ResetState: {
                handlResetState();
                return;
            }
        }
    })
}

socketServer.on('connection', handleNewSocket);

httpServer.listen((process.env as any).PORT || appSettings.chatServerPort);
console.log('Chat server is listening on ' + httpServer.address().port);
