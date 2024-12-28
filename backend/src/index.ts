import express from "express";
import {spawn} from "node-pty";
import {Server} from "socket.io";
import {createServer} from "http";

const app = express();
const server = createServer(app);


//create web socket connection
const io = new Server(server, {
    cors:{
        origin: "*"
    }
});
//create a pty
const terminal = spawn("cmd.exe", [], {
    "cwd": ".",
    "name": "random",
});

io.on("connection", (socket)=>{
    //listen for data
    process.stdin.setRawMode(true)
    socket.on("data", data =>{
        terminal.write(data+"\r");
    });
    //send when terminal produce data
    terminal.onData((data)=>{
        socket.emit("data", data);
    })

    socket.on("resize", ({cols, rows}: {cols: number, rows: number})=>{
        terminal.resize(cols, rows);
    })

    socket.on("close", ()=> {terminal.kill()});
});

server.listen("3000", ()=>{
    console.log("Server is listening on 3000");
})

