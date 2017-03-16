import * as Http from 'http';
import * as SocketServer from 'socket.io';
import { User } from "./model/User";
import { Message, MessageSubmission } from "./model/Message";
import { JoinResult } from './model/ChatState';
import * as md5 from 'blueimp-md5';

const httpServer = Http.createServer();
const socketServer = SocketServer(httpServer, { wsEngine: 'ws', transports: ['websocket'] } as SocketIO.ServerOptions);

let users: User[] = [];
let messages: Message[] = [];
let lastMessageId = 0;

type ServerEvent =
    | {
        type: 'MessageReceived',
        data: Message
    }
    | {
        type: 'UserJoined',
        data: User
    }
    | {
        type: 'UserLeft',
        data: string
    };

console.log('socket server started!');
socketServer.on('connection', socket => {
    console.log('connection acquired', socket.id, new Date());
    let currentUser: User | undefined = undefined;

    socket.on('chat.client.join', (userName: string) => {
        console.log(`User '${userName}' joined`);
        // if (users.some(x => x.name == userName)) {
        //   io.emit('chat.server.join-result', { type: ChatStateType.AuthenticationFailed, errorMessage: 'User with this name has already logged in' } as ChatState)
        // }
        currentUser = users.find(x => x.name == userName);

        if (currentUser == null) {
            currentUser = { name: userName, avatarUrl: `http://unicornify.appspot.com/avatar/${md5(userName)}?s=128` };
            console.log(currentUser.avatarUrl);
            users = users.concat([currentUser]);
        }

        const joinResult: JoinResult = { isSuccessful: true, initialData: { currentUser, users, messages } };
        socket.emit('chat.server.join-result', joinResult);

        const serverEvent: ServerEvent = { type: 'UserJoined', data: currentUser };
        socketServer.emit('chat.server.event', serverEvent);
    })

    socket.on('chat.client.message', (messageSubmission: MessageSubmission) => {
        lastMessageId++;
        const newMessage: Message = { id: lastMessageId, text: messageSubmission.text, creationDate: new Date(), sender: currentUser! };
        messages = messages.concat([newMessage]);

        const serverEvent: ServerEvent = { type: 'MessageReceived', data: newMessage };
        socketServer.emit('chat.server.event', serverEvent);
    });

    const handleLeave = () => {
        console.log('connection closed', socket.id, new Date());

        if (!currentUser) {
            console.log('No user to kick');
            return;
        }

        console.log('Kicking user', currentUser.name);
        users = users.filter(x => x != currentUser);

        const serverEvent: ServerEvent = { type: 'UserLeft', data: currentUser!.name };
        socketServer.emit('chat.server.event', serverEvent);
    };

    socket.on('chat.client.leave', handleLeave);

    socket.on('disconnect', handleLeave);

    // reset server data
    socket.on('chat.client.reset', () => {
        users = [];
        messages = [];
        lastMessageId = 0;
    });
});

httpServer.listen(37753);