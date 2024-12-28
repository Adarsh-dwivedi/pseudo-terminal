import "@xterm/xterm/css/xterm.css";
import {io} from "socket.io-client";
import {Terminal} from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useEffect, useRef } from "react";

export default function NewTerminal(){
    const terminalRef = useRef<HTMLDivElement>(null);
    const commandText = useRef("");
    const lastCommand = useRef(false);

    useEffect(()=>{
        //initalize terminal
        const terminal = new Terminal({
            cursorBlink: true,
        })
        const fit = new FitAddon();
        
        //attach terminial on dom
        if(terminalRef.current){
            terminal.loadAddon(fit);
            terminal.open(terminalRef.current);
            
        }

        const fitAndResize = () => {
            fit.fit();
            const { cols, rows } = terminal;
            socket.emit("resize", { cols, rows }); // Send dimensions to the backend
        };
        
        //initialize socket connection
        const socket = io("http://localhost:3000/");

        fitAndResize();
        //add data event listener
        window.addEventListener("resize", fitAndResize);
        socket.on("data", (data)=>{
            if(lastCommand.current){
                lastCommand.current = false;
                terminal.write("\n\r");
                return;
            }
            terminal.write(data);
        })
        //send data if user write one
        terminal.onData((data)=>{
            // socket.emit("data", data);
            if(data=="\r"){
                lastCommand.current = true;
                socket.emit("data", commandText.current);
                commandText.current="";
            }else if(data=="\u007F"){
                //handle backspace
                if(commandText.current.length>0){
                    commandText.current = commandText.current.slice(0,-1);
                    terminal.write("\b \b");
                }
            }else{
                commandText.current += data;
                terminal.write(data);
            }
            
        })
        //clean up
        socket.on("close", ()=>{
            terminal.dispose();
            socket.disconnect();
            window.removeEventListener("resize", fitAndResize);
        })
        // socket.emit("data", "");
    }, []);

    return (
        <div ref={terminalRef}></div>
    )
}