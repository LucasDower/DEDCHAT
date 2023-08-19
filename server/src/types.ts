import { User } from "../../common/types";
import WebSocket from 'ws';

export type InternalUser = User & {
    token: string,
    isNew: boolean,
};

export type Connection = {
    iuser: InternalUser,
    ws: WebSocket,
}