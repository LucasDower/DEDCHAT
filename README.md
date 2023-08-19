# DEDCHAT
A dead simple chat room I made to try learn [React](https://react.dev/) and [Next.js](https://nextjs.org/). Verdict: They're pretty cool.


![](https://i.imgur.com/JB9hXSY.png)

## Usage

**Install**

```bash
git clone https://github.com/LucasDower/DEDCHAT.git
cd DEADCHAT/client
npm install
cd ../server
npm install
cd ..
```

**Run**

Start the chat server with `./run-server` and then start the web server with `./run-client` and open your browser to `http://localhost:3000`. Finally type in the address of the chat server which will be `localhost:8080` if you're running it locally.

Note the misnomer, they're both servers really, any number of browser clients can connect to the chat.

## Additions
As this is pretty barebones there's plenty of room for improvements:
1. Timestamps,
2. Reconnect on disconnect, for both server and client,
3. Add nodemon to client,
4. Prevent users with matching display names,
5. Proper command handling
