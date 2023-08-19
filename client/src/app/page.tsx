'use client';

import { KeyboardEvent, useEffect, useState } from 'react'
import { ChatMessage, ChatStateSync } from '../../../common/types';

let socket: (WebSocket | null) = null;

export default function Home() {
    const [gameState, setGameState] = useState<ChatStateSync>();
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState<string>();
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState<string>();

    const handleSendMessage = (message: string) => {
        if (message.startsWith('/clear')) {
            setChat([]);
        } else {
            socket?.send(message);
        }
    }

    const handleMessageKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage(message!);
            setMessage('');
        }
    };

    const handleAttemptConnection = (address: string) => {
        socket?.close();
        socket = null;
        setConnected(false);

        setChat([]);
        socket = new WebSocket("ws://" + address);

        // Connection opened
        socket.addEventListener("open", (event) => {
            console.log('Connection opened');
            setConnected(true);
        });

        socket.addEventListener('close', (event) => {
            setConnected(false);
        })

        // Listen for messages
        socket.addEventListener("message", (event) => {
            const newGameState: ChatStateSync = JSON.parse(event.data); // TODO: Naughty
            setGameState(newGameState);
            setChat(chat => [...chat, ...newGameState.messages]);
        });
    }

    const handleAddressKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAttemptConnection(address!);
        }
    };

    return (
        <div className="p-16 bg-gray-50 space-x-5 min-h-screen flex  flex-row">
            <div className="bg-white p-5 rounded-lg border space-y-3 flex-grow flex flex-col">
                <p>Chat ({ connected ? 'Connected' : 'Disconnected' })</p>
                <input className="border p-4 flex bg-gray-100" value={ address} onChange={(e) => { setAddress(e.target.value) }} placeholder='localhost:8080' onKeyDown={handleAddressKeyDown}>
                </input>
                <div className="border flex flex-col bg-gray-100 flex-grow">
                    {chat.map(x => x.sender.type === 'server'
                        ? <div className='font-mono text-gray-400' key={x.uuid}>[SERVER]: {x.message}</div>
                        : <div className='font-mono' key={x.uuid}>[{x.sender.displayName}]: {x.message}</div>)}
                </div>
                <textarea className="resize-none border p-4 flex h-24 bg-gray-100" value={message} onChange={(e) => { setMessage(e.target.value) }} placeholder='Type your message...' onKeyDown={handleMessageKeyDown}>
                </textarea>
            </div>
            <div className="bg-white p-5 rounded-lg border space-y-3 w-96 flex flex-col">
                <p>Lobby ({(gameState?.others.length ?? 0) + 1})</p>
                <div className="border flex flex-col bg-gray-100 flex-grow">
                    {<div className='font-mono font-bold' key={gameState?.you.displayName}>{gameState?.you.displayName}</div>}
                    {gameState?.others.map(x => <div className='font-mono' key={x.displayName}>{x.displayName}</div>)}
                </div>
            </div>
        </div>
    )
}
