const { error } = require("node:console");
const socketpackage = require("../packages/socketpackage");
const io = socketpackage.getIO();
const crypto = require('node:crypto');


const ROOMS = socketpackage.ROOMS;
const CLIENT_ROOMS = {};


io.on("connection", (socket) => {

    const userid = socket.handshake.auth.userid;
    const username = socket.handshake.auth.username;
    console.log("User Connected and joined in rooms : ",userid);
    socket.userid = userid;
    socket.username = username;
    socket.status = "online";
    CLIENT_ROOMS[userid]=socket;

    socket.on('offer', (data) => {
        const roomid = crypto.randomUUID();
        console.log("OFFER RECEIVED")
        const clientsocket = CLIENT_ROOMS[data.userid]
        try{
            console.log(data.userid)
            if(!ROOMS[roomid])
            {
                ROOMS[roomid]={
                    "userc":null,
                    "userr":null
                }
            }
            ROOMS[roomid]["userc"]=data.sdp;

            const clientsocket = CLIENT_ROOMS[data.userid];

            if(clientsocket)
            {
                if(clientsocket.status=="busy")
                {
                    let payloadr = {
                        "roomid":roomid,
                        "userid":data.userid,
                        "data":"busy"
                    }
                    socket.emit("phonestatus",payloadr);
                }
                else if(clientsocket.status=="online")
                {
                    let payloadc = {
                        "roomid":roomid,
                        "userid":userid,
                        "username":socket.username,
                        "data":"phoneringing"
                    }
                    let payloadr = {
                        "roomid":roomid,
                        "data":"calling"
                    }

                    
                    clientsocket.emit("phonestatus",payloadc);
                    socket.emit("phonestatus",payloadr);
                }
                else
                {
                    console.log("SOME INVALID STATE")
                }
            }
            else
            {
                console.log("OFFER CLIENT SOCKET NOT FOUND")
                let payloadr = {
                    "roomid":roomid,
                    "userid":data.userid,
                    "data":"offline"
                }
                socket.emit("phonestatus",payloadr);
            }
        }catch(err)
        {
            console.log("OFFER ERROR : ",err);
        }
    })

    socket.on("needoffer",(data)=>{
        let payload = {
            sdp:ROOMS[data.roomid]["userc"]
        }
        socket.emit("receiveoffer",payload)
    })



    socket.on('answer', (data) => {
        console.log("RECEIVED ANSWER")

        let clientsocket = CLIENT_ROOMS[data.userid];

        ROOMS[data.roomid]["userr"] = data.sdp;

        let payload = {
            "answer":ROOMS[data.roomid]["userr"]
        }
        clientsocket.emit("receiveanswer",payload)
    })

    socket.on("ice", (data) =>{
        console.log("ICE RECEIVED")
        let clientsocket = CLIENT_ROOMS[data.userid];
        if(clientsocket)
        {
            clientsocket.emit("receiveice",data.icedata)
            console.log("ICE SUCCESS");

        }
        else{
            console.log("ERRO IN ICE")
        }
    })


    socket.on("phonestatus",(data)=>{
        if(data.data=="endcall")
        {
            if(ROOMS[data.roomid])
            {
                let clientsocket = CLIENT_ROOMS[data.userid];

                if(clientsocket)
                {
                    try{
                        clientsocket.emit("phonestatus",data)
                        socket.emit("phonestatus",data)
                    }
                    catch(err)
                    {
                        console.log(err);
                        let payload = {
                            "data":"error"
                        }
                        clientsocket.emit("phonestatus",payload)
                    }
                }
                else{
                    socket.emit("phonestatus",{
                        "data":"error"
                    })
                }
            }
        }
    })


});



