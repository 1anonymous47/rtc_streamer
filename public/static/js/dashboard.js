let userid = 0;

let friendslists = null;

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


    return connection;
}

let pc = null;



let ICE_LIST = [];
let roomid = null;


let userr = 0;

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

    result = await result.json()

    window.alert(result.data)
    
    
}

async function getSearchuser(searchParam) {
    let searchlistdiv = document.getElementById("searchuserlist");

    let result = await fetch(`api/users/${localStorage.getItem("userId")}/${searchParam}`)

    result = await result.json()

    searchlistdiv.innerHTML = "<br>";

    result.data.forEach(user => {
        const userDiv = document.createElement("div");

        userDiv.innerHTML = `
            <span>${user.username})</span>
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
    else
    {
        payload.status = "blocked";
    }

    let response = await fetch("api/acceptrequesr",{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })

    console.log(response.json())
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
            <button onclick="acceptRequest(${user.id},2)">Block</button>
        `;

        friendrequestlistdiv.appendChild(userDiv);
    });
    friendrequestlistdiv=friendrequestlistdiv+"<br>";
}

function logout()
{
    localStorage.removeItem("userId")
    window.location.href="/"
}

function openUserPage(user) {

    if(pc && (pc.connectionState === "connected" ||pc.connectionState === "connecting"))
    {
        window.alert("YOU ARE ALREADY IN A CALL");
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

    let searchuserinputbar = document.getElementById("searchuser");

    searchuserinputbar.addEventListener("input",(event)=>{
        if(event.target.value.length>2)
        {
            getSearchuser(event.target.value);
        }
    })
    document.getElementById("userdetails").innerHTML = localStorage.getItem("username")
    friendrequestlist();
    friendslist();
})

const serverUrl = window.location.origin;
let socket = io(serverUrl, {
        auth: {
        userid: localStorage.getItem("userId"),
        username: localStorage.getItem("username")
    }
});

async function createcall(userid) {
    try{
        let stream = await navigator.mediaDevices.getUserMedia({ video: true ,audio: true});

        pc = createPeerConnection()
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
        document.getElementById(`user-card-id_${userid}`).click();

        let stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const localVideo = document.getElementById("localvideo");
        localVideo.srcObject = stream;

        pc = createPeerConnection();
        
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
   if(pc.remoteDescription)
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

// pc.onicecandidate = (event) => {
//    if (event.candidate) {
//         let payload = {
//             "roomid":roomid,
//             "icedata":event.candidate,
//             "userid":userr
//         }
//         console.log("Sending ICE")

//         socket.emit("ice",payload)
//     }
//     else
//     {
//         console.log("WTH")
//     }
// }

// pc.ontrack = (event) => {
//    const remoteVideo = document.getElementById("remotevideo");
//    remoteVideo.srcObject = event.streams[0];
// }


// pc.onconnectionstatechange = () => {
//     if (pc.connectionState === "connected") {
//         console.log("CONNECTED")

//         const callcontrols = document.getElementById("callcontrols");
//         callcontrols.innerHTML = `
//             <button style="background: var(--danger)" onclick="endCall(${userr})">End Call</button>
//         `;
//     }
//     else
//     {
//         console.log("SOME OTHER STATE : ",pc.connectionState)

//     }
// };



socket.on("phonestatus",async function(data) {
    if(data.data=="phoneringing")
    {
        console.log(data);
        console.log("Received ROOM ID for RECEIVER: ",data.roomid)
        roomid = data.roomid;

        const callmodelfiv = document.getElementById("callername");

        callmodelfiv.innerHTML = `${data.username} is calling you..`;

        userr = data.userid;

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

            pc = createPeerConnection();
        }
        document.getElementById(`user-card-id_${userr}`).click();
        userr = 0;
    }
    else if(data.data=="phonesuccess")
    {
        console.log("HANDSHAKE SUCCESS");
    }
    else if(data.data=="offline")
    {
        const result = friendslists.find(item => item.id === data.userid);
        window.alert(`${result.username} IS OFFLINE`)
    }
    else if(data.data == "busy")
    {
        const result = friendslists.find(item => item.id === data.userid);
        window.alert(`${result.username} IS BUSY`)
    }
    else
    {
        console.log("STATE : ",data);
    }
})
async function friendslist(params) {
    
    let result = await fetch(`api/friendslist/${localStorage.getItem("userId")}`)

    result = await result.json()

    friendslists = result.data;

    let videouserlist = document.getElementById("userslist");
    videouserlist.innerHTML = "<br>";
    result.data.forEach(user => {
        if (user.status === "accepted") {
            const card = document.createElement("div");
            card.className = `user-card`;
            card.id = `user-card-id_${user.id}`
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
}

socket.on("connect",()=>{
    console.log("Connected To Server");
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
})
function showPage(pageName) {

    let pages = document.querySelectorAll(".page");

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
  else{
    console.log("NO ATTENDED THE CALL")
  }
  document.getElementById("popup").style.display = "none";
}
