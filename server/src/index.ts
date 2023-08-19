import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const wss = new WebSocketServer({ port: 8080 });

type Connection = {
    internal_id: string,
    display_name: string,
    coins: number,
    ws: WebSocket,
    new: boolean,
}

export type Player = { display_name: string, coins: number };


export type MessageSender = { type: 'server' } | { type: 'client', display_name: string };

export type ChatMessage = { uuid: string, sender: MessageSender, message: string };

export type GameStateMessage = { token: string, you: Player, others: Player[], messages: ChatMessage[] };

let connections: Connection[] = [];
let messagesToFlush: ChatMessage[] = [];

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    const uuid = uuidv4();

    ws.on('message', function message(data) {
        const connection = connections.find(x => x.internal_id === uuid);
        if (connection) {
            const messageString = data.toString();

            if (messageString.startsWith('/nickname ')) {
                const nickname = messageString.replace('/nickname ', '');

                messagesToFlush.push({
                    uuid: uuidv4(),
                    sender: { type: 'server' },
                    message: `[${connection.display_name}] is now known as [${nickname}]`,
                });

                connection.display_name = nickname;
            } else {
                messagesToFlush.push({
                    uuid: uuidv4(),
                    sender: { type: 'client', display_name: connection.display_name },
                    message: messageString,
                });
            }
        }
    });

    const newDisplayName = uuidv4();

    connections.push({
        internal_id: uuid,
        display_name: newDisplayName,
        coins: 0,
        ws: ws,
        new: true,
    })

    messagesToFlush.push({
        uuid: uuidv4(),
        sender: { type: 'server' },
        message: `[${newDisplayName}] joined`,
    });
});


setInterval(() => {
    for (let i = connections.length - 1; i >= 0; --i) {
        const connection = connections[i];
        if ((connection.ws.readyState === connection.ws.OPEN) || (connection.ws.readyState === connection.ws.CONNECTING)) {
            continue;
        }
        messagesToFlush.push({
            uuid: uuidv4(),
            sender: { type: 'server' },
            message: `[${connection.display_name}] left`,
        });
    }

    connections = connections.filter((connection) => {
        return (connection.ws.readyState === connection.ws.OPEN) || (connection.ws.readyState === connection.ws.CONNECTING);
    })

    connections.forEach((connection) => {
        if (connection.ws.readyState === connection.ws.OPEN) {

            const messagesForThisClient = [...messagesToFlush];
            if (connection.new) {
                messagesForThisClient.push({
                    uuid: uuidv4(),
                    sender: { type: 'server' },
                    message: `Use /nickname to choose a new display name`,
                });
                connection.new = false;
            }

            const message: GameStateMessage = {
                token: connection.internal_id,
                you: {
                    display_name: connection.display_name,
                    coins: connection.coins,
                },
                others: connections
                    .filter(x => x.internal_id !== connection.internal_id)
                    .map(x => {
                        return {
                            display_name: x.display_name,
                            coins: x.coins
                        };
                    }),
                messages: messagesForThisClient
            }

            connection.ws.send(JSON.stringify(message));
        }
    });

    messagesToFlush = [];

    console.log('Tick, connections:', connections.length);
}, 1000);