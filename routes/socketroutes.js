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
        socket.status = "busy";
        const clientsocket = CLIENT_ROOMS[data.userid]
        try{
            console.log(data.userid)
            if(!ROOMS[roomid])
            {
                ROOMS[roomid]={
                    "userc":null,
                    "userr":null,
                    "status":"null",
                    "statusinterval":null

                }
            }
            ROOMS[roomid]["userc"]=data.sdp;

            const clientsocket = CLIENT_ROOMS[data.userid];

            if(clientsocket && clientsocket.connected)
            {
                if(clientsocket.status=="busy")
                {
                    let payloadr = {
                        "roomid":roomid,
                        "userid":data.userid,
                        "data":"busy"
                    }
                    socket.emit("phonestatus",payloadr);
                    socket.status=="online";
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
                    try{
                        clientsocket.emit("phonestatus",payloadc);
                        socket.emit("phonestatus",payloadr);

                        const statusinterval = setTimeout(() => {
                            ROOMS[roomid]["status"]="ringing";

                            if(ROOMS[roomid]["status"]=="ringing")
                            {
                                let payload = {
                                    "roomid":roomid,
                                    "userid":data.userid,
                                    "data":"phonenotattended"
                                }
                                socket.emit("phonestatus",payload);
                                socket.status = "online";
                                console.log("USER DO NOTHING");
                            }
                            else{
                                console.log("CURRENT STATUS",ROOMS[roomid]["status"])
                            }
                        }, 12000);
                        ROOMS[roomid]["statusinterval"] = statusinterval;
                    }catch(err)
                    {
                        let payloaderr = {
                            "roomid":roomid,
                            "userid":userid,
                            "userid":"offline"
                        }
                        console.log(err);
                        socket.status=="online";
                        socket.emit("phonestatus",payloaderr);
                    }
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
                socket.status=="online";
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
        ROOMS[data.roomid]["status"]=="attended";
        clearTimeout(ROOMS[data.roomid]["statusinterval"])
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
        // console.log("ICE RECEIVED")
        let clientsocket = CLIENT_ROOMS[data.userid];
        if(clientsocket)
        {
            clientsocket.emit("receiveice",data.icedata)
            // console.log("ICE SUCCESS");

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

                        socket.status = "online";
                        clientsocket.status = "online";
                    }
                    catch(err)
                    {
                        console.log(err);
                        let payload = {
                            "data":err
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
        else if(data.data=="phonedeclined")
        {
            console.log("USER HAS DECLINED YOUR CALL");
            if(ROOMS[data.roomid])
            {
                let clientsocket = CLIENT_ROOMS[data.userid];

                if(clientsocket)
                {
                    let payload = {
                        "roomid":data.roomid,
                        "userid":socket.userid,
                        "data":"phonedeclined"
                    }
                    try{
                        clientsocket.emit("phonestatus",payload)
                        clientsocket.status = "online";
                        clearTimeout(ROOMS[data.roomid]["statusinterval"])
                    }
                    catch(err)
                    {
                        console.log(err);
                        let payload = {
                            "data":err
                        }
                        clientsocket.emit("phonestatus",payload)

                        ROOMS[data.roomid]["status"]=="answered";

                        clearTimeout(ROOMS[data.roomid]["statusinterval"]);
                    }
                }
                else{
                    console.log("USER NOT FOUND")
                    socket.emit("phonestatus",{
                        "data":"error"
                    })
                }
            }
            else{
                console.log("ROOM NOT FOUND")
            }

        }
    })

});



