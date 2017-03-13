import * as Koa from 'koa';
import * as Http from 'http';
import * as IO from 'socket.io';
import { User } from "./model/User";
import { Message, MessageSubmission } from "./model/Message";
import { ChatState, ChatStateType } from './model/ChatState';

const app = new Koa();
const server = Http.createServer(app.callback);
const io = IO(server);

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
        data: User
    };

io.on('connection', socket => {
    let currentUser: User | undefined = undefined;

    socket.on('chat.client.join', (_, userName: string) => {
        // if (users.some(x => x.name == userName)) {
        //   io.emit('chat.server.join-result', { type: ChatStateType.AuthenticationFailed, errorMessage: 'User with this name has already logged in' } as ChatState)
        // }
        currentUser = users.find(x => x.name == userName) || { name: userName, avatarUrl: undefined };
        users = users.concat([currentUser]);
        const chatState: ChatState = { type: ChatStateType.AuthenticatedAndInitialized, data: { users, messages, currentUser } };
        socket.emit('chat.server.join-result', chatState);

        const serverEvent: ServerEvent = { type: 'UserJoined', data: currentUser };
        io.emit('chat.server.event', serverEvent);
    })

    socket.on('chat.client.message', (_, messageSubmission: MessageSubmission) => {
        lastMessageId++;
        const newMessage: Message = { id: lastMessageId, text: messageSubmission.text, creationDate: new Date(), sender: currentUser! };
        messages = messages.concat([newMessage]);

        const serverEvent: ServerEvent = { type: 'MessageReceived', data: newMessage };
        io.emit('chat.server.event', serverEvent);
    });

    const handleLeave = () => {
        users = users.filter(x => x != currentUser);

        const serverEvent: ServerEvent = { type: 'UserLeft', data: currentUser! };
        io.emit('chat.server.event', serverEvent);
    };

    socket.on('chat.client.leave', handleLeave);
    socket.on('disconnect', handleLeave);
});

server.listen(process.env.PORT || 3000);