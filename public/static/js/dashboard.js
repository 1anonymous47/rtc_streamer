

let userid = 0;
let friendslists = null;
let dc = null;
let usertype = 0;
let lastPong = Date.now();

let localuserid = 0;

let callerinterval = null;
let callersender = null;
let receierinterval = null;


let reconnetiontimeout = null;
let reconnectionstatus = false;


let callpopuptinterval = null;

let popuptime = 12000;

let openedpage = "";

let pc = null;
let ICE_LIST = [];
let roomid = null;
let userr = 0;


let charroomid = 0;
let chatuserr = 0;


let onCall = false;


function reconectingfuntion()
{
    if(reconnectionstatus==false)
    {
        createcall(userr);
        reconnectionstatus = true;
    }
    else
    {
        console.log("Already called");
    }
}

// let pc = new RTCPeerConnection({
//    iceServers: [
//       { urls: "stun:stun.l.google.com:19302" }
//    ]

// });
function createPeerConnection() {

    let connection = new RTCPeerConnection({
        iceServers: [
            {
                urls: "turn:91.185.189.19:23238?transport=udp",
                username: "testuser",
                credential: "testpassword"
            }
        ]
    });


    connection.onicecandidate = (event) => {
        if(event.candidate){

            let payload = {
                roomid: roomid,
                icedata:event.candidate,
                userid:userr
            };

            socket.emit("ice",payload);
        }
    };


    connection.ontrack = (event)=>{
        const remoteVideo = document.getElementById("remotevideo");

        if(remoteVideo){
            remoteVideo.srcObject = event.streams[0];
        }
    };


    connection.onconnectionstatechange = ()=>{

        console.log(
            "Connection:",
            connection.connectionState
        );

        if(connection.connectionState==="connected"){

            const callcontrols =
            document.getElementById("callcontrols");

            if(reconnectionstatus==true)
            {
                reconnectionstatus = false;
            }
            if(callcontrols){
                callcontrols.innerHTML =
                `
                <button onclick="endCall(${userr})">
                End Call
                </button>
                `;
            }
        }
    };
    if(usertype==1)
    {
        dc = connection.createDataChannel("heartbeat");
        dc.onopen = () => {
            console.log("Heartbeat channel ready");
            callersender = setInterval(() => {
                if (dc.readyState === "open")
                {
                    dc.send("ping");
                }
            }, 1000);
            callerinterval = setInterval(() => {
                const diff = Date.now() - lastPong;
                if (diff > 3000) {
                    console.log("Peer disconnected caller side");
                    reconnetiontimeout = reconnetiontimeout + 1;
                    if(reconnetiontimeout%4==0)
                    {
                        // reconectingfuntion();

                        openalertmodel(`Call closed successfully`)
                        endCall(userr);
                    }
                    // if(reconnetiontimeout==40)
                    // {
                    //     console.log("UNABLE TO RECONNECT , DISCONNECTED THE CALL")
                    //     endCall(userr);
                    // }
                }
            }, 1000);
        };
        dc.onmessage = (event) => {
            console.log(`${usertype}`,event.data)
            if (event.data === "pong") {
                lastPong = Date.now();
            }
        };
    }
    else
    {
        connection.ondatachannel = (event) => {
            dc = event.channel;
            console.log("DataChannel received");
            dc.onopen = () => {
                receierinterval = setInterval(() => {
                    const diff = Date.now() - lastPong;
                    if (diff > 3000) {
                        console.log("Peer disconnected receiver side");
                        reconnetiontimeout = reconnetiontimeout + 1;
                        if(reconnetiontimeout%4==0)
                        {
                            // reconectingfuntion();
                            openalertmodel(`Call closed successfully`)
                            endCall(userr);
                        }
                    }
                }, 1000);
            };
            dc.onmessage = (event) => {
                console.log(`${usertype}`,event.data)
                if (event.data === "ping") {
                    lastPong = Date.now();
                    dc.send("pong");
                    
                }
            };
        }
    }
    return connection;
}

function openalertmodel(text)
{
    document.getElementById("alerttext").innerHTML = text;

    document.getElementById("cusalert").style.display = "flex";
}

function closealtermodel()
{
    document.getElementById("cusalert").style.display = "none";
    document.getElementById("alerttext").innerHTML = ".......";
}


async function sendFriendRequest(receiverid) {
    let senderid = localStorage.getItem("userId");
    let result = await fetch("api/sendrequest",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            senderid: senderid,
            receiverid: receiverid
        })
    })

    result = await result.json();
    openalertmodel(`${result.data}`)

    document.getElementById("searchuser").value = "";
    document.getElementById("searchuserlist").innerHTML = "";


}

async function getSearchuser(searchParam) {
    let searchlistdiv = document.getElementById("searchuserlist");

    let result = await fetch(`api/users/${localStorage.getItem("userId")}/${searchParam}`)

    result = await result.json()

    searchlistdiv.innerHTML = "<br>";

    result.data.forEach(user => {
        const userDiv = document.createElement("div");

        userDiv.innerHTML = `
            <span>${user.username}</span>
            <button onclick="sendFriendRequest(${user.id})">Add to firend</button>
        `;

        searchlistdiv.appendChild(userDiv);
    });
    searchlistdiv=searchlistdiv+"<br>"
}

async function acceptRequest(userid,type) {
    let payload = {
        "senderid": userid,
        "receiverid": localStorage.getItem("userId"),
        "status": ""
    }
    if(type==1)
    {
        payload.status = "accepted";
    }
    else if(type==2)
    {
        payload.status = "rejected";
    }
    else if(type==3)
    {
        payload.status = "blocked";
    }
    else if(type==4)
    {
        payload.status = "unblocked";
    }
    else{
        console.log("INVALID STATUS")
    }

    let response = await fetch("api/acceptrequesr",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })

    let result = await response.json();

    console.log(result);

    openalertmodel(`${result.data}`)

    openconnectionpage(openedpage);


}

async function friendrequestlist()
{

    let friendrequestlistdiv = document.getElementById("friendrequestlist");
    let result = await fetch(`api/requestslist/${localStorage.getItem("userId")}`)

    result = await result.json()

    friendrequestlistdiv.innerHTML = "<br>";

    result.data.forEach(user => {
        if(user.status!="pending")
        {
            return;
        }
        const userDiv = document.createElement("div");

        userDiv.innerHTML = `
            <span>${user.username}</span>
            <button onclick="acceptRequest(${user.id},1)">Accept</button>
            <button onclick="acceptRequest(${user.id},2)">Reject</button>
            <button onclick="acceptRequest(${user.id},3)">Block</button>
        `;

        friendrequestlistdiv.appendChild(userDiv);
    });
    friendrequestlistdiv=friendrequestlistdiv+"<br>";
}

async function logout()
{
    localStorage.removeItem("userId")

    let result = await fetch("api/logout",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    })
    result = await result.json()
    if(result.code==0)
    {
        openalertmodel("LOGOUT SUCCESS");
        setTimeout(()=>{
            window.location.href="/"
        },1800)
    }
}

async function blockeduesr() {
    let friendrequestlistdiv = document.getElementById("blockedfirendsuserlist");

    let result = await fetch(`api/blockedlist/${localStorage.getItem("userId")}`)

    result = await result.json()

    friendrequestlistdiv.innerHTML = "<br>";

    result.data.forEach(user => {
        const userDiv = document.createElement("div");

        userDiv.innerHTML = `
            <span>${user.username}</span>
            <button onclick="acceptRequest(${user.id},4)">UnBlock</button>
        `;
        friendrequestlistdiv.appendChild(userDiv);
    });
    friendrequestlistdiv=friendrequestlistdiv+"<br>";
    // openconnectionpage("blockedfriends")
}

async function openconnectionpage(pagename)
{
    let div = document.getElementById("connectionpage");
    div.innerHTML = "";
    let content = "";

    openedpage = pagename;

    if(pagename=="searchpage"){


        content = content + `<div class="card-wrapper">
                <h1>Search Friends</h1>
                <div class="search-box">
                    <label for="searchuser">Search Username</label>
                    <input id="searchuser" type="text" placeholder="Type a username to search...">
                </div>
                <div id="searchuserlist" class="list-container">
                </div>
            </div>`

        div.innerHTML = content;

        let searchuserinputbar = document.getElementById("searchuser");

        searchuserinputbar.addEventListener("input",(event)=>{
            if(event.target.value.length>2)
            {
                getSearchuser(event.target.value);
            }
        })

    }
    else if(pagename=="requestspage"){

        content = content + `
        <div class="card-wrapper">
            <h1>Received Requests</h1>
            <div id="friendrequestlist" class="list-container"></div>
            </div>
        </div>
        `
        div.innerHTML = content;
        friendrequestlist();
        console.log("HERE")
    }
    else if(pagename=="blockedfriends"){

        content = content + `
        <div class="card-wrapper">
            <h1>Blocked Friends</h1>
            <div id="blockedfirendsuserlist" class="list-container">
            </div>
        </div>`

        div.innerHTML = content;
        console.log("BLOCKEED USER PAGE")
        blockeduesr();
    }
    else if(pagename=="friendslistpage")
    {
        content = content + `
        <div class="card-wrapper">
            <h1>Friends</h1>
            <div id="friendslist" class="list-container">
            </div>
        </div>`
        div.innerHTML = content;

        let result = await fetch(`api/friendslist/${localStorage.getItem("userId")}`)

        result = await result.json()

        friendslists = result.data;
        let videouserlist = document.getElementById("friendslist");
        videouserlist.innerHTML = "<br>";
        result.data.forEach(user => {
            if (user.status === "accepted") {
                const card = document.createElement("div");
                card.className = `user-card`;
                card.innerHTML = `
                <span>${user.username}</span>
                    <button onclick="acceptRequest(${user.id},3)">Block</button>
                `;
                videouserlist.appendChild(card);
            }
        });
    }
}
function openUserPage(user) {

    if(pc && (pc.connectionState === "connected" ||pc.connectionState === "connecting"))
    {

        openalertmodel("You are already in a call")
        return;
    }
    document.getElementById("chatArea").innerHTML = `
        <div class="call-container">
            <div class="call-header">
                <h2>${user.username}</h2>
            </div>
            <div class="video-container">
                <video id="remotevideo" autoplay playsinline></video>
                <video id="localvideo" autoplay muted playsinline></video>
            </div>
            <div class="call-controls" id="callcontrols">
                <button onclick="createcall(${user.id})">Call</button>
            </div>
        </div>
    `;
}

function endCall(userid)
{
    let payload = {
        "roomid":roomid,
        "userid":userid,
        "data":"endcall"
    }
    socket.emit("phonestatus", payload);

    
}

document.addEventListener("DOMContentLoaded",()=>{
    console.log("FIle Initiated");

    // let searchuserinputbar = document.getElementById("searchuser");

    // searchuserinputbar.addEventListener("input",(event)=>{
    //     if(event.target.value.length>2)
    //     {
    //         getSearchuser(event.target.value);
    //     }
    // })
    document.getElementById("userdetails1").innerHTML = localStorage.getItem("username")
    document.getElementById("userdetails2").innerHTML = localStorage.getItem("username")

    localuserid = localStorage.getItem("userId")
    // friendrequestlist();
    friendslist();

    // openalertmodel("Page loaded successfully");
})

const serverUrl = window.location.origin;
let socket = io(serverUrl, {
        auth: {
        userid: localStorage.getItem("userId"),
        username: localStorage.getItem("username")
    }
});

async function createcall (userid) {
    try{
        let stream = await navigator.mediaDevices.getUserMedia({ video: true ,audio: true});
        usertype = 1;
        pc = createPeerConnection(usertype);
        stream.getTracks().forEach(async track => {
            await pc.addTrack(track, stream);
        });
        let localoffer = await pc.createOffer();
        await pc.setLocalDescription(localoffer);
        const localVideo = document.getElementById("localvideo");
        localVideo.srcObject = stream;
        let data = {
            "userid":userid,
            "sdp":localoffer,
            "usertype":"userc"
        }
        userr = userid;
        socket.emit("offer", data);
    }
    catch(err)
    {
        console.log("CREATE CALL ERR : ",err)
    }
}

async function joincall(userid) {
    try{
        document.getElementById(`video-user-card-id_${userid}`).click();

        let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const localVideo = document.getElementById("localvideo");
        localVideo.srcObject = stream;

        usertype = 2;

        pc = createPeerConnection(usertype);
        
        stream.getTracks().forEach(async track => {
            await pc.addTrack(track, stream);
        });

        let payload = {
            "roomid":roomid,
            "usertype":"userr",
            "userid":userid
        }
        socket.emit("needoffer",payload);
    }
    catch(err)
    {
        console.log("JOIN CALL ERROR : ",err);
    }
}

socket.on("receiveoffer", async function(data){
    console.log("Received Offer is",data["sdp"])
    if(!pc)
    {
        return;
    }
    await pc.setRemoteDescription(data["sdp"])

    for (const icedata of ICE_LIST) {
        await pc.addIceCandidate(icedata)
    }
    let answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    let payload = {
        "roomid":roomid,
        "sdp":answer,
        "userid":userr
    }
    console.log(payload);
    socket.emit("answer",payload);
    console.log("Sender ICE list")
})

socket.on("receiveanswer",async function(data) {
    console.log(data);
    await pc.setRemoteDescription(data["answer"]);
    for (const icedata of ICE_LIST) {
        await pc.addIceCandidate(icedata)
    }

});

socket.on("receiveice",async function receiveice(data) {
   console.log("Received ICE")
   if(pc && pc.remoteDescription)
   {
        for (const icedata of ICE_LIST) {
            await pc.addIceCandidate(icedata)
        }

        console.log("Adding imediatly")
        await pc.addIceCandidate(data)
   }
   else
   {
      ICE_LIST.push(data)
      console.log("RECEIVED ICE")
   }
})

socket.on("phonestatus",async function(data) {
    if(data.data=="phoneringing")
    {
        console.log(data);
        console.log("Received ROOM ID for RECEIVER: ",data.roomid)
        roomid = data.roomid;

        const callmodelfiv = document.getElementById("callername");

        callmodelfiv.innerHTML = `${data.username} is calling you..`;

        userr = data.userid;

        callpopuptinterval = setTimeout(() => {
            openalertmodel("Call Ended");
            document.getElementById("popup").style.display = "none";

        }, popuptime);

        openPopup();

    }
    else if(data.data=="calling")
    {
        console.log("Received ROOM ID for CALLER  : ",data.roomid)
        roomid = data.roomid;
    }
    else if(data.data=="endcall")
    {
        console.log("END CALL");
        if(pc)
        {
            pc.close();

            pc = createPeerConnection(usertype);
        }
        if(userr)
        {
            document.getElementById(`video-user-card-id_${userr}`).click();
        }
        clearInterval(callerinterval);
        clearInterval(receierinterval);
        clearInterval(callersender);
        userr = 0;
    }
    else if(data.data=="phonedeclined")
    {
        // console.log(data);

        const result = friendslists.find(item => item.id === Number(data.userid));

        // console.log(friendslists)

        openalertmodel(`${result.username} declined you call`)


        if(reconnectionstatus==true)
        {
            endCall(userr);
            reconnectionstatus=false;
        }
    }
    else if(data.data=="offline")
    {
        const result = friendslists.find(item => item.id === data.userid);
        if(reconnectionstatus==true)
        {
            endCall(userr);
            reconnectionstatus=false;

        }
        
        clearInterval(callerinterval);
        clearInterval(receierinterval);
        clearInterval(callersender);


        openalertmodel(`${result.username} is offline`)

    }
    else if(data.data == "busy")
    {
        const result = friendslists.find(item => item.id === data.userid);


        openalertmodel(`${result.username} is busy`)
    }
    else if(data.data == "phonenotattended")
    {
        const result = friendslists.find(item => item.id === data.userid);



        openalertmodel(`${result.username} doesn't pick your call`)
    }
    else
    {
        console.log("STATE : ",data);
    }
})

let pendingmessages = {};

async function sendMessage(userid) {

    let tempid = crypto.randomUUID();

    let msg_paylaod = {
        "roomid":charroomid,
        "senderid": localuserid,
        "receiverid":chatuserr,
        "message":document.getElementById("messageTxt").value,
        "tempmessageid":tempid
    };

    let messagediv = document.getElementById("messagelist")

    messagediv.innerHTML = messagediv.innerHTML + `

    <div class="message send">
        <div class="message-text" id="msgid_${tempid}">
        ${document.getElementById("messageTxt").value}
        </div>
        <div class="message-time">
            ${formatLocalTime()}
        </div>
    </div>
    `
    document.getElementById("messageTxt").value = "";

    const list = document.getElementById("messagelist");
    list.scrollTop = list.scrollHeight;

    pendingmessages[tempid]={"status":"-1"}

    socket.emit("sendprivatemessage",msg_paylaod)
}

socket.on("messagestatus",(data)=>{

    if(data.type=="msg_ack")
    {
        console.log("MSG ACKNOLEDMEND")
        let div = document.getElementById(`msgid_${data.tempid}`)
        div.id = `msgid_${data.lastmsgid}`;

        div.classList.remove('seen')
        div.classList.remove('received')
        div.classList.remove('send')

        div.classList.add(data.status)
    }
    else{
        console.log("UPDATING MSG STATUS")

        let div = document.getElementById(`msgid_${data.lastmsgid}`)

        div.classList.remove('seen')
        div.classList.remove('received')
        div.classList.remove('send')

        div.classList.add(data.status)
    }
    // let div = document.getElementById("")
})

socket.on("receiveprivatemessage",(data)=>{


    let messagediv = document.getElementById("messagelist")

    if(!messagediv)
    {
        const result = friendslists.find(item => item.id === Number(data.senderid));

        console.log("NO MESSAGE DIV FOUND");
        window.alert(`RECEIVED MESSAGE FROM ${result.username}`)
        return;
    }
    if(data.senderid!=chatuserr)
    {
        const result = friendslists.find(item => item.id === Number(data.senderid));

        console.log("ITS NOT THE USER")
        window.alert(`RECEIVED MESSAGE FROM ${result.username}`)

        return;
    }

    let content = messagediv.innerHTML;

    let tempdata = data.data;


    if(tempdata.user_id==localuserid)
    {
        content = content +`
        <div class="message send">
            <div class="message-text" id="msgid_${data.lastmsgid}">
                ${tempdata.message}
            </div>
            <div class="message-time">
                ${formatLocalTime()}
                
            </div>
        </div>`;
    }else{
        content = content + `
        <div class="message received" id="msgid_${data.lastmsgid}">
            <div class="message-text">
                ${tempdata.message}
            </div>
            <div class="message-time">
                ${formatLocalTime()}
            </div>
        </div>`;
    }
    
    messagediv.innerHTML = content;

    const list = document.getElementById("messagelist");
    list.scrollTop = list.scrollHeight;


    console.log("HERE IT COMES",data);

    socket.emit("messagestatus",{
        "lastmsgid":data.lastmsgid,
        "senderid":data.senderid,
        "status":"seen"
    })




})

let messageid = 0;

function formatTime(timestamp)
{
    const date = new Date(timestamp);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}



function rendermessagedata(messagelist)
{
    let messagediv = document.getElementById("messagelist")

    let notseenid = [];

    let oldHeight = messagediv.scrollHeight;
    let oldScroll = messagediv.scrollTop;

    let content = messagediv.innerHTML;

    if(messagelist.length>0)
    {
        messageid = messagelist[messagelist.length-1].id;
    }

    for (const msg of messagelist) {

        if(msg.message_status!="seen")
        {
            notseenid.push(msg.id)
        }
        if(msg.user_id==localuserid)
        {
            content = `
            <div class="message send">
                <div class="message-text ${msg.message_status}">
                    ${msg.message}
                </div>
                <div class="message-time">
                    ${formatTime(msg.created_at)}
                </div>
            </div>` + content;
        }else{
            content = `
            <div class="message received">
                <div class="message-text">
                    ${msg.message}
                </div>
                <div class="message-time">
                    ${formatTime(msg.created_at)}
                </div>
            </div>` + content;
        }
    }

    
    messagediv.innerHTML = content;
    messagediv.scrollTop = messagediv.scrollHeight - oldHeight + oldScroll;

    for (const id of notseenid) {
        socket.emit("messagestatus",{
            "senderid":chatuserr,
            "lastmsgid":id,
            "status":"seen"
        })
    }


}

async function loadoldmessages(roomid) {


    let response = await fetch(`api/getmessage/${roomid}/${messageid}`)

    let result = await response.json();

    // console.log(result.data[result.data.length-1].id)

    // messageid = result.data[result.data.length-1].id;
    if(result.data.length<=0)
    {
        console.log("NO NEW MESSAGES");
        return;
    }
    // if(result.data[result.data.length-1].id==messageid)
    // {
    //     console.log("NO NEW MESSAGES");
    //     return;
    // }
    rendermessagedata(result.data);


}

async function getapimessage(roomid,before) {

    let response = await fetch(`api/getmessage/${roomid}/${before}`)

    let result = await response.json();

    rendermessagedata(result.data);

    const list = document.getElementById("messagelist");
    list.scrollTop = list.scrollHeight;

    list.addEventListener("scroll", () => {

        if (list.scrollTop ===0) {
            console.log("Near top");
            loadoldmessages(roomid);
        }

    });



}

function formatLocalTime() {
    return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function openUserPagechat(userdetails) {

    charroomid = 0;
    chatuserr = 0;

    let response = await fetch(`api/getroomid/${userdetails.id}/${localuserid}`)

    let result = await response.json()
    charroomid = result.data[0].room_id;

    chatuserr = userdetails.id;

    document.getElementById("chatAreatext").innerHTML = `
        <div class="call-container">
            <div class="call-header">
                <h2>${userdetails.username}</h2>
            </div>
            <div id="messagelist">
            </div>

        </div>
        <div class="text-controls">
            <input type="text" id="messageTxt">
            <button onclick="sendMessage(${userdetails.id})">Send</button>
        </div>
    `;

    const input = document.getElementById("messageTxt");

    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            sendMessage(2);
        }
    });

    getapimessage(charroomid,0)
}
async function friendslist() {
    
    let result = await fetch(`api/friendslist/${localStorage.getItem("userId")}`)

    result = await result.json()

    friendslists = result.data;

    let videouserlist = document.getElementById("userslistvideo");
    let chatuserlist = document.getElementById("userslisttext");

    videouserlist.innerHTML = "<br>";
    result.data.forEach(user => {
        if (user.status === "accepted") {
            const card = document.createElement("div");
            card.className = `user-card`;
            card.id = `video-user-card-id_${user.id}`
            card.innerHTML = `
                <h3>${user.username}</h3>
            `;
            card.addEventListener("click", () => {
                openUserPage(user);
            });
            videouserlist.appendChild(card);
        }
    });

    videouserlist=videouserlist+"<br>";

    chatuserlist.innerHTML = "<br>";
    result.data.forEach(user => {
        if (user.status === "accepted") {
            const card = document.createElement("div");
            card.className = `user-card`;
            card.id = `chat-user-card-id_${user.id}`
            card.innerHTML = `
                <h3>${user.username}</h3>
            `;
            card.addEventListener("click", () => {
                openUserPagechat(user);
            });
            chatuserlist.appendChild(card);
        }
    });
    chatuserlist=chatuserlist+"<br>";


}

socket.on("connect",()=>{
    console.log("Connected To Server");
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
})
function showPage(pageName) {

    let pages = document.querySelectorAll(".page");

    if(pageName=="requests"){
        // friendrequestlist();
        console.log("NOTHING")
    }
    else if(pageName=="videochat"){
        friendslist();
    }
    else if(pageName=="search"){

        document.getElementById("searchuser").value = "";
        document.getElementById("searchuserlist").innerHTML = "";
    }
    else if(pageName=="textchat")
    {
        if(pc && (pc.connectionState === "connected" ||pc.connectionState === "connecting"))
        {
            openalertmodel("You are already in a call")
            return;
        }
    }
    else{
        console.log("CLICKED SOME OTHER PAGE : ",pageName)
    }

    pages.forEach(page => {
        page.classList.remove("active");
    });


    document.getElementById(pageName)
            .classList.add("active");
}

function openPopup() {
  document.getElementById("popup").style.display = "flex";
}
function sendResponse(answer) {
  console.log(answer); 
  if(answer=="Yes")
  {
    joincall(userr);
  }
  else if(answer=="No"){
    console.log("NO ATTENDED THE CALL")
    let payload = {
        "roomid":roomid,
        "userid":userr,
        "data":"phonedeclined"
    }
    try{
        socket.emit("phonestatus",payload)
    }
    catch(err)
    {
        console.log("ERROR SENDING PHONE STATUS")
    }
  }
  document.getElementById("popup").style.display = "none";
  clearTimeout(callpopuptinterval);
}
