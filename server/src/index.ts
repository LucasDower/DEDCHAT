import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatStateSync, User } from '../../common/types';
import { Connection } from './types';

const wss = new WebSocketServer({ port: 8080 });

let connections: Connection[] = [];
let messagesToFlush: ChatMessage[] = [];

wss.on('connection', function connection(ws) {
    console.log('New connection...');

    ws.on('error', console.error);

    const token = uuidv4();

    ws.on('message', function message(data) {
        const connection = connections.find(x => x.iuser.token === token);
        if (connection) {
            const messageString = data.toString();

            if (messageString.startsWith('/nickname ')) {
                const nickname = messageString.replace('/nickname ', '');

                messagesToFlush.push({
                    uuid: uuidv4(),
                    sender: { type: 'server' },
                    message: `[${connection.iuser.displayName}] is now known as [${nickname}]`,
                });

                connection.iuser.displayName = nickname;
            } else {
                messagesToFlush.push({
                    uuid: uuidv4(),
                    sender: { type: 'client', displayName: connection.iuser.displayName },
                    message: messageString,
                });
            }
        }
    });

    const newDisplayName = uuidv4();

    connections.push({
        iuser: {
            displayName: newDisplayName,
            isNew: true,
            token: token,
            uuid: uuidv4(),
        },
        ws: ws,
    })

    messagesToFlush.push({
        uuid: uuidv4(),
        sender: { type: 'server' },
        message: `[${newDisplayName}] joined`,
    });
});


setInterval(() => {
    // Cleanup disconnected connections
    for (let i = connections.length - 1; i >= 0; --i) {
        const connection = connections[i];
        if ((connection.ws.readyState === connection.ws.CLOSING) || (connection.ws.readyState === connection.ws.CLOSED)) {
            messagesToFlush.push({
                uuid: uuidv4(),
                sender: { type: 'server' },
                message: `[${connection.iuser.displayName}] left`,
            });
            connections.splice(i, 1);
        }
    }

    // Send each connection the current state
    // 1. Users connected
    // 2. Messages received since last sync
    connections.forEach((connection) => {
        if (connection.ws.readyState !== connection.ws.OPEN) {
            return;
        }

        const messagesForThisClient = [...messagesToFlush];
        if (connection.iuser.isNew) {
            messagesForThisClient.push({
                uuid: uuidv4(),
                sender: { type: 'server' },
                message: `Use /nickname to choose a new display name`,
            });
            connection.iuser.isNew = false;
        }

        const response: ChatStateSync = {
            you: {
                uuid: connection.iuser.uuid,
                displayName: connection.iuser.displayName,
            },
            others: connections
                .filter(x => x.iuser.uuid !== connection.iuser.uuid)
                .map(x => {
                    return {
                        uuid: x.iuser.uuid,
                        displayName: x.iuser.displayName,
                    };
                }),
            messages: messagesForThisClient,
        }

        connection.ws.send(JSON.stringify(response));
    });

    messagesToFlush = [];

    console.log('Tick, connections:', connections.length);
}, 1000);