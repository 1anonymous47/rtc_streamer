let pc = new RTCPeerConnection({
   iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
   ]
});

// let pc = new RTCPeerConnection();
var socket = io();
let side = 1;


let ICE_LIST = [];


async function createcall()
{
   side = 1;
   let stream = await navigator.mediaDevices.getUserMedia({ video: true });
   let track = stream.getVideoTracks()[0];
   await pc.addTrack(track, stream);
   let localoffer = await pc.createOffer();

   await pc.setLocalDescription(localoffer);

   const localVideo = document.getElementById("localvideo");
   localVideo.srcObject = stream;

   let data = {
      "roomid":234,
      "sdp":localoffer
   }

   socket.emit("createoffer", data);

}

async function joincall() {

   side = 0;

   let roomid = document.getElementById("roomid");
   // console.log("room id is",roomid)
   // if(roomid=="")
   // {
   //    console.log("Enter VALID room ID")
   //    return;
   // }
   let stream = await navigator.mediaDevices.getUserMedia({ video: true });
   let track = stream.getVideoTracks()[0];

   const localVideo = document.getElementById("localvideo");
   localVideo.srcObject = stream;


   await pc.addTrack(track, stream);

   let payload = {
      "roomid":234
   }
   socket.emit("getoffer",payload);

}

socket.on("receiveanswer",async function(data) {
   await pc.setRemoteDescription(data["answer"]);
   console.log("Receiver ICE list")
   for (const icedata of ICE_LIST) {
      
      await pc.addIceCandidate(icedata)
   }
});

socket.on("receiveoffer", async function(data){

   // console.log("Received Offer is",data["sdp"])

   await pc.setRemoteDescription(data["sdp"])

   let answer = await pc.createAnswer();
   await pc.setLocalDescription(answer);

   let payload = {
      "roomid":234,
      "sdp":answer
   }
   socket.emit("createanswer",payload);
   console.log("Sender ICE list")
   for (const icedata of ICE_LIST) {
      
      await pc.addIceCandidate(icedata);
   }
})

pc.onicecandidate = (event) => {
   // console.log("Creating ICE")
   if (event.candidate) {
      let payload = {
         "roomid":234,
         "side":side,
         "icedata":event.candidate
      }
      socket.emit("shareice",payload)
    }
}

socket.on("receiveice",async function receiveice(data) {
   console.log("Received ICE")
   if(pc.remoteDescription)
   {
      console.log("Adding imediatly")
      await pc.addIceCandidate(data)
   }
   else
   {
      ICE_LIST.push(data)
   }
   
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
   let payload = {
      "roomid":234,
      "side":side
   }

   

})

pc.ontrack = (event) => {
   console.log("her")
   const remoteVideo = document.getElementById("remotevide");
   remoteVideo.srcObject = event.streams[0];
}

