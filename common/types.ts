export type User = {
    uuid: string,
    displayName: string,
};

export type ChatMessage = {
    uuid: string,
    sender: { type: 'server' } | { type: 'client', displayName: string }
    message: string
};

export type ChatStateSync = {
    you: User,
    others: User[],
    messages: ChatMessage[]
};
