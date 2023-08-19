'use client';

import Image from 'next/image'
import { KeyboardEvent, useEffect, useState } from 'react'
import { ChatMessage, GameStateMessage } from '../../../server/src/index';

let socket: (WebSocket | null) = null;

export default function Home() {
    const [gameState, setGameState] = useState<GameStateMessage>();
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [message, setMessage] = useState<string>();


    useEffect(() => {
        setChat([]);
        socket = new WebSocket("ws://localhost:8080");

        // Connection opened
        socket.addEventListener("open", (event) => {
            console.log('Connection opened');
        });

        // Listen for messages
        socket.addEventListener("message", (event) => {
            const newGameState: GameStateMessage = JSON.parse(event.data);
            setGameState(newGameState);
            setChat(chat => [...chat, ...newGameState.messages]);
        });

        return () => {
            socket?.close();
        }
    }, []);

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

    return (
        <div className="p-16 bg-gray-50 space-x-5 min-h-screen flex  flex-row">
            <div className="bg-white p-5 rounded-lg border space-y-3 flex-grow flex flex-col">
                <p>Chat</p>
                <div className="border flex flex-col bg-gray-100 flex-grow">
                    {chat.map(x => x.sender.type === 'server'
                        ? <div className='font-mono text-gray-400' key={x.uuid}>[SERVER]: {x.message}</div>
                        : <div className='font-mono' key={x.uuid}>[{x.sender.display_name}]: {x.message}</div>)}
                </div>
                <textarea className="resize-none border p-4 flex h-24 bg-gray-100" value={message} onChange={(e) => { setMessage(e.target.value) }} placeholder='Type your message...' onKeyDown={handleMessageKeyDown}>
                </textarea>
            </div>
            <div className="bg-white p-5 rounded-lg border space-y-3 w-96 flex flex-col">
                <p>Lobby ({(gameState?.others.length ?? 0) + 1})</p>
                <div className="border flex flex-col bg-gray-100 flex-grow">
                    {<div className='font-mono font-bold' key={gameState?.you.display_name}>{gameState?.you.display_name}</div>}
                    {gameState?.others.map(x => <div className='font-mono' key={x.display_name}>{x.display_name}</div>)}
                </div>
            </div>
        </div>
    )
}
