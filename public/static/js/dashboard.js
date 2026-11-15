/**
 * NEXUS // QUANTUM COMMS CONSOLE
 * High-Performance Futuristic WebRTC & Signaling Client Engine
 * 100% Backend Protocol Compatible
 */

// =============================================================================
// GLOBAL APPLICATION STATE
// =============================================================================
const AppState = {
    userId: localStorage.getItem("userId") || 0,
    username: localStorage.getItem("username") || "Operative",
    currentScreen: "dashboard",
    currentNetworkTab: "friendslistpage",
    
    // Friends & Directory Caches
    friendsList: [],
    requestsList: [],
    blockedList: [],
    
    // Active Call State
    callStatus: "idle", // 'idle' | 'calling' | 'ringing' | 'connected'
    activeRoomId: null,
    activePeer: null, // { id, username }
    isVoiceOnly: false,
    callStartTime: null,
    callTimerInterval: null,
    
    // WebRTC Objects
    pc: null,
    localStream: null,
    remoteStream: null,
    dataChannel: null,
    iceQueue: [],
    isCaller: false,
    
    // Heartbeat & Latency Telemetry
    heartbeatInterval: null,
    pingSenderInterval: null,
    lastPongTimestamp: Date.now(),
    currentLatencyMs: 0,
    
    // Call Ringing Timers
    ringingTimeout: null,
    countdownInterval: null,
    
    // Hardware Preview Self-Test
    previewStream: null,
    
    // Chat State
    activeChatRoomId: 0,
    activeChatPeer: null,
    lastMessageId: 0,
    
    // Web Audio Sound Engine
    audioEnabled: false,
    audioCtx: null,
    ringtoneOscillators: []
};

// =============================================================================
// WEB AUDIO SYNTHESIZER (Sci-Fi Futuristic Audio Effects)
// =============================================================================
function getAudioContext() {
    if (!AppState.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            AppState.audioCtx = new AudioContextClass();
        }
    }
    if (AppState.audioCtx && AppState.audioCtx.state === 'suspended') {
        AppState.audioCtx.resume();
    }
    return AppState.audioCtx;
}

function playCyberChirp(freq1 = 540, freq2 = 880, type = 'sine', duration = 0.08) {
    if (!AppState.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq1, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq2, ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playCallConnectedChime() {
    if (!AppState.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
            gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.07);
            osc.stop(ctx.currentTime + i * 0.07 + 0.22);
        });
    } catch (e) {}
}

function playCallTerminatedChime() {
    if (!AppState.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        [600, 420, 280].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.07, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.18);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.2);
        });
    } catch (e) {}
}

function startIncomingRingtone() {
    stopIncomingRingtone();
    if (!AppState.audioEnabled) return;
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        const ringLoop = () => {
            if (AppState.callStatus !== "ringing") return;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sine';
            osc2.type = 'triangle';
            osc1.frequency.setValueAtTime(440, ctx.currentTime);
            osc2.frequency.setValueAtTime(880, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);
        };
        
        ringLoop();
        const intervalId = setInterval(() => {
            if (AppState.callStatus === "ringing") {
                ringLoop();
            } else {
                clearInterval(intervalId);
            }
        }, 1500);
        AppState.ringtoneOscillators.push(intervalId);
    } catch (e) {}
}

function stopIncomingRingtone() {
    AppState.ringtoneOscillators.forEach(id => clearInterval(id));
    AppState.ringtoneOscillators = [];
}

function toggleAudioEngine() {
    AppState.audioEnabled = !AppState.audioEnabled;
    const btn = document.getElementById("sfxToggleBtn");
    if (!btn) return;
    if (AppState.audioEnabled) {
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
        showToast("Audio SFX Engine: ACTIVATED", "info");
        playCyberChirp(600, 950);
    } else {
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
        showToast("Audio SFX Engine: MUTED", "info");
    }
}

// =============================================================================
// SOCKET.IO SIGNALING CONNECTION
// =============================================================================
const serverUrl = window.location.origin;
const socket = io(serverUrl, {
    auth: {
        userid: AppState.userId,
        username: AppState.username
    }
});

socket.on("connect", () => {
    console.log("[Signaling] Socket linked with server:", socket.id);
    const diagSocket = document.getElementById("diagSocketStatus");
    if (diagSocket) diagSocket.innerText = "ONLINE (P2P READY)";
});

socket.on("disconnect", (reason) => {
    console.warn("[Signaling] Socket disconnected:", reason);
    const diagSocket = document.getElementById("diagSocketStatus");
    if (diagSocket) diagSocket.innerText = "DISCONNECTED";
});

// =============================================================================
// WEBRTC PEER CONNECTION FACTORY
// =============================================================================
function createPeerConnection(isCallerSide = false) {
    if (AppState.pc) {
        try { AppState.pc.close(); } catch (e) {}
    }
    AppState.iceQueue = [];
    AppState.isCaller = isCallerSide;

    const config = {
        iceServers: [
            {
                urls: "turn:91.185.189.19:23238?transport=udp",
                username: "testuser",
                credential: "testpassword"
            },
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    };

    const pc = new RTCPeerConnection(config);
    AppState.pc = pc;

    // ICE Candidate Emission
    pc.onicecandidate = (event) => {
        if (event.candidate && AppState.activePeer) {
            const payload = {
                roomid: AppState.activeRoomId,
                icedata: event.candidate,
                userid: AppState.activePeer.id
            };
            socket.emit("ice", payload);
        }
    };

    // Remote Track Handler
    pc.ontrack = (event) => {
        console.log("[WebRTC] Remote track received:", event.track.kind);
        AppState.remoteStream = event.streams[0];
        
        // Attach to main stage remote video
        const remoteVideo = document.getElementById("remotevideo");
        if (remoteVideo) {
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.play().catch(e => console.warn("Remote play err:", e));
        }

        // Also attach to floating mini PiP video
        const pipVideo = document.getElementById("pipRemoteVideo");
        if (pipVideo) {
            pipVideo.srcObject = event.streams[0];
            pipVideo.play().catch(e => console.warn("PiP play err:", e));
        }
    };

    // Connection State Change & Heartbeat Monitoring
    pc.onconnectionstatechange = () => {
        console.log("[WebRTC] Connection state:", pc.connectionState);
        const latencyBadge = document.getElementById("callLatencyBadge");
        
        if (pc.connectionState === "connected") {
            AppState.callStatus = "connected";
            playCallConnectedChime();
            startCallTimer();
            updateCallScreenUI();
            
            if (latencyBadge) {
                latencyBadge.innerText = "ESTABLISHED • SECURE";
                latencyBadge.style.color = "var(--green)";
            }
            
            showToast(`Transmission Connected: ${AppState.activePeer?.username || 'Peer'}`, "success");
        } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
            if (AppState.callStatus === "connected") {
                showToast("Transmission link dropped", "warning");
                handleCallCleanup();
            }
        }
    };

    // Heartbeat DataChannel
    if (isCallerSide) {
        AppState.dataChannel = pc.createDataChannel("heartbeat");
        setupDataChannel(AppState.dataChannel);
    } else {
        pc.ondatachannel = (event) => {
            AppState.dataChannel = event.channel;
            setupDataChannel(AppState.dataChannel);
        };
    }

    return pc;
}

function setupDataChannel(channel) {
    if (!channel) return;
    
    channel.onopen = () => {
        console.log("[DataChannel] Heartbeat channel online");
        AppState.lastPongTimestamp = Date.now();
        
        // Periodic ping
        AppState.pingSenderInterval = setInterval(() => {
            if (channel.readyState === "open") {
                channel.send(JSON.stringify({ type: "ping", sentAt: Date.now() }));
            }
        }, 1000);

        // Disconnection monitor
        AppState.heartbeatInterval = setInterval(() => {
            const diff = Date.now() - AppState.lastPongTimestamp;
            if (diff > 4500 && AppState.callStatus === "connected") {
                console.warn("[DataChannel] Peer heartbeat timeout");
                showToast("Peer connection lost: Heartbeat timeout", "error");
                triggerHangup();
            }
        }, 1200);
    };

    channel.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === "ping") {
                AppState.lastPongTimestamp = Date.now();
                if (channel.readyState === "open") {
                    channel.send(JSON.stringify({ type: "pong", sentAt: msg.sentAt }));
                }
            } else if (msg.type === "pong") {
                AppState.lastPongTimestamp = Date.now();
                const latency = Date.now() - msg.sentAt;
                AppState.currentLatencyMs = latency;
                
                const latencyBadge = document.getElementById("callLatencyBadge");
                if (latencyBadge) {
                    latencyBadge.innerText = `P2P ${latency}ms • STABLE`;
                }
            }
        } catch (e) {
            // Raw text fallback
            if (event.data === "ping") {
                AppState.lastPongTimestamp = Date.now();
                channel.send("pong");
            } else if (event.data === "pong") {
                AppState.lastPongTimestamp = Date.now();
            }
        }
    };

    channel.onclose = () => {
        clearInterval(AppState.pingSenderInterval);
        clearInterval(AppState.heartbeatInterval);
    };
}

// =============================================================================
// CALL LIFECYCLE: INITIATION, ANSWERING, TEARDOWN
// =============================================================================

/**
 * Validate and Initiate Outgoing Video Call
 */
async function initiateCall(targetUser) {
    playCyberChirp(400, 800);

    // VALIDATION: Check if already in an active call!
    if (AppState.callStatus === "connected" || AppState.callStatus === "calling") {
        const confirmed = await Swal.fire({
            title: 'Call in Progress',
            html: `You are currently in a call with <b>${AppState.activePeer?.username || 'another contact'}</b>.<br><br>End current call to call <b>${targetUser.username}</b>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'End Call & Call New',
            cancelButtonText: 'Keep Current Call',
            background: '#111827',
            color: '#f9fafb',
            customClass: { popup: 'swal-custom-popup' }
        });

        if (!confirmed.isConfirmed) {
            return;
        }

        // Terminate existing call first
        triggerHangup(false);
    }

    try {
        AppState.activePeer = targetUser;
        AppState.isVoiceOnly = false;
        AppState.callStatus = "calling";

        // Display Outgoing Dialing Modal
        openOutgoingModal(targetUser.username);

        // Acquire local video + audio stream
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });
        } catch (mediaErr) {
            console.warn("High-definition camera unavailable, attempting standard video stream:", mediaErr);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        }
        
        AppState.localStream = stream;

        // Render full call stage for caller
        renderActiveCallStage(targetUser);

        // Attach local preview video
        const localVideo = document.getElementById("localvideo");
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        // Create RTCPeerConnection
        const pc = createPeerConnection(true);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Create WebRTC Offer
        const localOffer = await pc.createOffer();
        await pc.setLocalDescription(localOffer);

        // Emit offer to server
        const offerPayload = {
            userid: targetUser.id,
            sdp: localOffer,
            usertype: "userc"
        };
        socket.emit("offer", offerPayload);

        showToast(`Calling ${targetUser.username}...`, "info");
    } catch (err) {
        console.error("[Call Init Err]", err);
        closeOutgoingModal();
        handleCallCleanup();
        showToast("Unable to access microphone or camera", "error");
    }
}

/**
 * Handle Incoming Call Signal from Server
 */
function handleIncomingCallSignal(data) {
    console.log("[Signaling] Incoming Call from:", data.username, "Room:", data.roomid);
    
    // VALIDATION: If already busy on another call, backend handles status, but if reached here:
    if (AppState.callStatus === "connected") {
        // Emit busy status
        return;
    }

    AppState.activeRoomId = data.roomid;
    AppState.activePeer = {
        id: data.userid,
        username: data.username
    };
    AppState.callStatus = "ringing";

    // Play synthesized incoming ringtone
    startIncomingRingtone();

    // Open Incoming Holographic Modal
    openIncomingModal(data.username);
}

/**
 * Receiver Accepts Incoming Call
 */
async function acceptIncomingCall() {
    stopIncomingRingtone();
    closeIncomingModal();
    playCyberChirp(600, 1000);

    if (!AppState.activePeer) return;

    try {
        AppState.isVoiceOnly = false;
        AppState.callStatus = "connected";

        // Render Call Stage UI
        switchMainScreen("videochat");
        renderActiveCallStage(AppState.activePeer);

        // Acquire receiver local stream (video + audio)
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }
            });
        } catch (e) {
            console.warn("High-definition camera unavailable, attempting standard video stream:", e);
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        }
        
        AppState.localStream = stream;

        const localVideo = document.getElementById("localvideo");
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        // Create PeerConnection for receiver
        const pc = createPeerConnection(false);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Request offer from server
        const needOfferPayload = {
            roomid: AppState.activeRoomId,
            usertype: "userr",
            userid: AppState.activePeer.id
        };
        socket.emit("needoffer", needOfferPayload);

    } catch (err) {
        console.error("[Accept Call Error]", err);
        handleCallCleanup();
        showToast("Could not access microphone/camera", "error");
    }
}

/**
 * Receiver Declines Incoming Call
 */
function declineIncomingCall() {
    stopIncomingRingtone();
    closeIncomingModal();
    playCyberChirp(400, 200);

    if (AppState.activePeer && AppState.activeRoomId) {
        const payload = {
            roomid: AppState.activeRoomId,
            userid: AppState.activePeer.id,
            data: "phonedeclined"
        };
        socket.emit("phonestatus", payload);
    }

    handleCallCleanup();
    showToast("Call declined", "info");
}

/**
 * Cancel Outgoing Call Before Answer
 */
function cancelOutgoingCall() {
    closeOutgoingModal();
    triggerHangup(true);
}

/**
 * Terminate Call / Hang Up
 */
function triggerHangup(emitStatus = true) {
    playCallTerminatedChime();

    if (emitStatus && AppState.activePeer && AppState.activeRoomId) {
        const payload = {
            roomid: AppState.activeRoomId,
            userid: AppState.activePeer.id,
            data: "endcall"
        };
        socket.emit("phonestatus", payload);
    }

    handleCallCleanup();
    showToast("Call ended", "info");
}

/**
 * Teardown and Reset All Call Resources
 */
function handleCallCleanup() {
    stopIncomingRingtone();
    closeIncomingModal();
    closeOutgoingModal();

    // Stop duration timer
    clearInterval(AppState.callTimerInterval);
    AppState.callTimerInterval = null;
    AppState.callStartTime = null;

    // Stop local media tracks
    if (AppState.localStream) {
        AppState.localStream.getTracks().forEach(track => track.stop());
        AppState.localStream = null;
    }
    AppState.remoteStream = null;

    // Close WebRTC peer connection
    if (AppState.pc) {
        try { AppState.pc.close(); } catch (e) {}
        AppState.pc = null;
    }

    // Clear heartbeat intervals
    clearInterval(AppState.pingSenderInterval);
    clearInterval(AppState.heartbeatInterval);

    // Reset state
    AppState.callStatus = "idle";
    AppState.activeRoomId = null;
    AppState.activePeer = null;
    AppState.iceQueue = [];

    // Hide banners and floating PiP widget
    hideActiveCallBanner();
    hideFloatingPiPWidget();

    // Remove in-call indicator classes
    const videoChatSection = document.getElementById("videochat");
    if (videoChatSection) {
        videoChatSection.classList.remove("in-call");
    }
    const mainViewport = document.querySelector(".main-content-viewport");
    if (mainViewport) {
        mainViewport.classList.remove("in-call-active");
    }

    // Reset Call Stage to standby idle state if on call screen
    if (AppState.currentScreen === "videochat") {
        resetCallStageToIdle();
    }

    // Hide call dot in navbar
    const navDot = document.getElementById("callIndicatorDot");
    if (navDot) navDot.style.display = "none";
}

// =============================================================================
// SOCKET.IO CALL SIGNALING EVENT LISTENERS
// =============================================================================

// 1. phonestatus event
socket.on("phonestatus", (data) => {
    console.log("[Signaling] phonestatus:", data);

    if (data.data === "phoneringing") {
        handleIncomingCallSignal(data);
    } 
    else if (data.data === "calling") {
        AppState.activeRoomId = data.roomid;
        const outStatus = document.getElementById("outgoingStatusText");
        if (outStatus) outStatus.innerText = "Ringing...";
    } 
    else if (data.data === "endcall") {
        showToast("Call ended", "info");
        handleCallCleanup();
    } 
    else if (data.data === "phonedeclined") {
        closeOutgoingModal();
        showToast("User declined the call", "warning");
        handleCallCleanup();
    } 
    else if (data.data === "offline") {
        closeOutgoingModal();
        showToast("User is currently offline", "error");
        handleCallCleanup();
    } 
    else if (data.data === "busy") {
        closeOutgoingModal();
        showToast("User is currently busy on another call", "warning");
        handleCallCleanup();
    } 
    else if (data.data === "phonenotattended") {
        closeOutgoingModal();
        showToast("No answer", "warning");
        handleCallCleanup();
    }
});

// 2. receiveoffer event
socket.on("receiveoffer", async (data) => {
    console.log("[WebRTC] Received Remote Offer SDP");
    if (!AppState.pc) return;

    try {
        await AppState.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        // Drain any queued ICE candidates
        for (const candidate of AppState.iceQueue) {
            await AppState.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        AppState.iceQueue = [];

        // Create Answer
        const answer = await AppState.pc.createAnswer();
        await AppState.pc.setLocalDescription(answer);

        const answerPayload = {
            roomid: AppState.activeRoomId,
            sdp: answer,
            userid: AppState.activePeer.id
        };
        socket.emit("answer", answerPayload);
    } catch (e) {
        console.error("Error setting remote offer:", e);
    }
});

// 3. receiveanswer event
socket.on("receiveanswer", async (data) => {
    console.log("[WebRTC] Received Remote Answer SDP");
    closeOutgoingModal();

    if (!AppState.pc) return;

    try {
        await AppState.pc.setRemoteDescription(new RTCSessionDescription(data.answer));

        // Drain queued ICE
        for (const candidate of AppState.iceQueue) {
            await AppState.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        AppState.iceQueue = [];
    } catch (e) {
        console.error("Error setting remote answer:", e);
    }
});

// 4. receiveice event
socket.on("receiveice", async (candidateData) => {
    if (AppState.pc && AppState.pc.remoteDescription) {
        try {
            await AppState.pc.addIceCandidate(new RTCIceCandidate(candidateData));
        } catch (e) {
            console.error("Error adding remote ICE:", e);
        }
    } else {
        AppState.iceQueue.push(candidateData);
    }
});

// =============================================================================
// SCREEN MOVEMENT & VALIDATION ENGINE
// =============================================================================

/**
 * Switch Main Screen Tabs with Seamless Call Preservation
 */
function switchMainScreen(screenName) {
    playCyberChirp(600, 850, 'sine', 0.05);

    // Update active nav button
    document.querySelectorAll(".nav-dock .nav-item").forEach(btn => btn.classList.remove("active"));
    const activeNavBtn = document.getElementById(`nav-${screenName}`);
    if (activeNavBtn) activeNavBtn.classList.add("active");

    // Hide all viewports
    document.querySelectorAll(".page-view").forEach(page => page.classList.remove("active"));
    
    // Show selected viewport
    const targetPage = document.getElementById(screenName);
    if (targetPage) targetPage.classList.add("active");

    AppState.currentScreen = screenName;

    // REFRESH DATA AS NEEDED
    if (screenName === "dashboard") {
        refreshDashboardCounters();
    } else if (screenName === "friends") {
        openconnectionpage(AppState.currentNetworkTab);
    } else if (screenName === "videochat") {
        loadCallRoster();
    } else if (screenName === "textchat") {
        loadChatRoster();
    }

    // VALIDATION & UI ADAPTATION FOR ACTIVE CALL WHILE MOVING SCREENS:
    updateCallScreenUI();
}

/**
 * Dynamically toggles Full Call Stage vs Persistent Banner & Floating PiP Widget
 */
function updateCallScreenUI() {
    const isCallActive = (AppState.callStatus === "connected" || AppState.callStatus === "calling");
    const navDot = document.getElementById("callIndicatorDot");

    if (isCallActive) {
        if (navDot) navDot.style.display = "block";

        if (AppState.currentScreen === "videochat") {
            // User is ON Comms Stage: Hide mini widget & top banner, show full stage
            hideFloatingPiPWidget();
            hideActiveCallBanner();

            // Re-render / re-attach video to full call stage elements
            if (AppState.activePeer) {
                renderActiveCallStage(AppState.activePeer);
                
                // Re-bind streams
                const remoteVideo = document.getElementById("remotevideo");
                if (remoteVideo && AppState.remoteStream) {
                    remoteVideo.srcObject = AppState.remoteStream;
                }
                const localVideo = document.getElementById("localvideo");
                if (localVideo && AppState.localStream) {
                    localVideo.srcObject = AppState.localStream;
                }
            }
        } else {
            // User NAVIGATED AWAY: Show Top Banner & Floating PiP Widget!
            showActiveCallBanner();
            showFloatingPiPWidget();
        }
    } else {
        if (navDot) navDot.style.display = "none";
        hideFloatingPiPWidget();
        hideActiveCallBanner();
    }
}

function showActiveCallBanner() {
    const banner = document.getElementById("activeCallBanner");
    const peerNameEl = document.getElementById("bannerPeerName");
    const typeBadge = document.getElementById("bannerCallType");

    if (banner && AppState.activePeer) {
        peerNameEl.innerText = AppState.activePeer.username;
        typeBadge.innerText = "VIDEO";
        banner.style.display = "flex";
    }
}

function hideActiveCallBanner() {
    const banner = document.getElementById("activeCallBanner");
    if (banner) banner.style.display = "none";
}

function showFloatingPiPWidget() {
    const pipWidget = document.getElementById("floatingCallWidget");
    const pipTitle = document.getElementById("pipUserName");
    const pipVideo = document.getElementById("pipRemoteVideo");

    if (pipWidget && AppState.activePeer) {
        pipTitle.innerText = AppState.activePeer.username;
        
        if (pipVideo) {
            pipVideo.style.display = "block";
            if (AppState.remoteStream) {
                pipVideo.srcObject = AppState.remoteStream;
            }
        }
        
        pipWidget.style.display = "block";
    }
}

function hideFloatingPiPWidget() {
    const pipWidget = document.getElementById("floatingCallWidget");
    if (pipWidget) pipWidget.style.display = "none";
}

function returnToActiveCall() {
    playCyberChirp(600, 900);
    switchMainScreen("videochat");
}

// Call Duration Counter
function startCallTimer() {
    clearInterval(AppState.callTimerInterval);
    AppState.callStartTime = Date.now();

    AppState.callTimerInterval = setInterval(() => {
        const elapsedSec = Math.floor((Date.now() - AppState.callStartTime) / 1000);
        const mins = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
        const secs = String(elapsedSec % 60).padStart(2, "0");
        const timeStr = `${mins}:${secs}`;

        // Update all active timer elements
        const hudTimer = document.getElementById("callDurationTimer");
        if (hudTimer) hudTimer.innerText = timeStr;

        const bannerTimer = document.getElementById("bannerCallTimer");
        if (bannerTimer) bannerTimer.innerText = timeStr;

        const pipTimer = document.getElementById("pipTimer");
        if (pipTimer) pipTimer.innerText = timeStr;
    }, 1000);
}

// In-Call Track Toggles (Mic & Camera)
function toggleAudioMute() {
    playCyberChirp(800, 600, 'sine', 0.04);
    if (!AppState.localStream) return;
    
    const audioTrack = AppState.localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const isMuted = !audioTrack.enabled;
        
        // Update dock button
        const dockMicBtn = document.getElementById("dockMicBtn");
        if (dockMicBtn) {
            dockMicBtn.classList.toggle("active-off", isMuted);
        }
        // Update PiP button
        const pipMicBtn = document.getElementById("pipMicBtn");
        if (pipMicBtn) {
            pipMicBtn.classList.toggle("active-off", isMuted);
        }

        showToast(isMuted ? "Microphone muted" : "Microphone unmuted", "info");
    }
}

function toggleVideoMute() {
    playCyberChirp(800, 600, 'sine', 0.04);
    if (!AppState.localStream) return;
    
    const videoTrack = AppState.localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const isCamOff = !videoTrack.enabled;
        
        const dockCamBtn = document.getElementById("dockCamBtn");
        if (dockCamBtn) dockCamBtn.classList.toggle("active-off", isCamOff);

        const pipCamBtn = document.getElementById("pipCamBtn");
        if (pipCamBtn) pipCamBtn.classList.toggle("active-off", isCamOff);

        showToast(isCamOff ? "Camera turned off" : "Camera turned on", "info");
    }
}

function toggleFullscreenCall() {
    const stage = document.getElementById("chatArea");
    if (!document.fullscreenElement) {
        stage.requestFullscreen().catch(err => console.warn(err));
    } else {
        document.exitFullscreen();
    }
}

// =============================================================================
// CALL STAGE RENDERING
// =============================================================================

function renderActiveCallStage(peerUser) {
    const stageArea = document.getElementById("chatArea");
    if (!stageArea) return;

    const videoChatSection = document.getElementById("videochat");
    if (videoChatSection) {
        videoChatSection.classList.add("in-call");
    }
    const mainViewport = document.querySelector(".main-content-viewport");
    if (mainViewport) {
        mainViewport.classList.add("in-call-active");
    }

    stageArea.innerHTML = `
        <div class="active-call-arena">
            <!-- Header Telemetry Bar -->
            <div class="arena-header-bar">
                <div class="arena-user-profile">
                    <div class="arena-avatar">${peerUser.username.charAt(0).toUpperCase()}</div>
                    <div class="arena-info">
                        <h2 class="arena-user-name">${peerUser.username}</h2>
                        <span class="arena-status-sub">Direct Call</span>
                    </div>
                </div>

                <div class="arena-telemetry-cluster">
                    <span class="telemetry-chip" id="callDurationTimer">00:00</span>
                    <span class="telemetry-chip" id="callLatencyBadge">Connecting...</span>
                    <span class="telemetry-chip">WebRTC Direct</span>
                </div>
            </div>

            <!-- Video Stream Surfaces -->
            <div class="video-stream-stage">
                <video id="remotevideo" autoplay playsinline></video>
                <video id="localvideo" autoplay muted playsinline></video>
            </div>

            <!-- Floating Controls Dock -->
            <div class="call-floating-dock" id="callcontrols">
                <button class="hud-call-btn" id="dockMicBtn" onclick="toggleAudioMute()" title="Toggle Microphone">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </button>
                <button class="hud-call-btn" id="dockCamBtn" onclick="toggleVideoMute()" title="Toggle Camera">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </button>
                <button class="hud-call-btn" onclick="switchMainScreen('dashboard')" title="Minimize Call">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                </button>
                <button class="hud-call-btn" onclick="toggleFullscreenCall()" title="Toggle Fullscreen">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                </button>
                <button class="hud-call-btn terminate-btn" onclick="triggerHangup()" title="End Call">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-6-6 19.8 19.8 0 0 1-3.12-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg>
                </button>
            </div>
        </div>
    `;
}

function resetCallStageToIdle() {
    const videoChatSection = document.getElementById("videochat");
    if (videoChatSection) {
        videoChatSection.classList.remove("in-call");
    }
    const mainViewport = document.querySelector(".main-content-viewport");
    if (mainViewport) {
        mainViewport.classList.remove("in-call-active");
    }

    const stageArea = document.getElementById("chatArea");
    if (!stageArea) return;

    stageArea.innerHTML = `
        <div class="stage-idle-state" id="stageIdleState">
            <div class="standby-scanner">
                <div class="scanner-rings"></div>
                <div class="scanner-hud-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </div>
            </div>
            <h3 class="standby-title">Ready for Video Calls</h3>
            <p class="standby-desc">Select a contact from the left list to start a video call.</p>
            
            <div class="device-self-check-card">
                <div class="check-title">Hardware Self-Test</div>
                <div class="check-controls">
                    <button class="preview-test-btn" id="previewCamBtn" onclick="toggleLocalPreview()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        <span>Test Camera & Mic</span>
                    </button>
                </div>
                <div id="previewVideoContainer" class="preview-video-box" style="display:none;">
                    <video id="selfTestVideo" autoplay muted playsinline></video>
                </div>
            </div>
        </div>
    `;
}

// Hardware Preview Toggle
async function toggleLocalPreview() {
    const container = document.getElementById("previewVideoContainer");
    const video = document.getElementById("selfTestVideo");
    const btn = document.getElementById("previewCamBtn");

    if (AppState.previewStream) {
        AppState.previewStream.getTracks().forEach(t => t.stop());
        AppState.previewStream = null;
        if (container) container.style.display = "none";
        if (btn) btn.innerHTML = `<span>TEST HARDWARE FEED</span>`;
    } else {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            AppState.previewStream = stream;
            if (video) video.srcObject = stream;
            if (container) container.style.display = "block";
            if (btn) btn.innerHTML = `<span>STOP HARDWARE PREVIEW</span>`;
            showToast("Hardware feed initialized", "success");
        } catch (e) {
            showToast("Cannot access camera/microphone", "error");
        }
    }
}

// =============================================================================
// MODAL DIALOGS (INCOMING & OUTGOING)
// =============================================================================
function openIncomingModal(callerName) {
    const modal = document.getElementById("incomingCallModal");
    const nameEl = document.getElementById("incomingCallerName");
    const avatarEl = document.getElementById("incomingCallerAvatar");
    const fillEl = document.getElementById("incomingCountdownFill");

    if (nameEl) nameEl.innerText = callerName;
    if (avatarEl) avatarEl.innerText = callerName.charAt(0).toUpperCase();

    // Reset and start 12s countdown animation
    if (fillEl) {
        fillEl.style.width = "100%";
        clearInterval(AppState.countdownInterval);
        let timeLeft = 12;
        AppState.countdownInterval = setInterval(() => {
            timeLeft--;
            fillEl.style.width = `${(timeLeft / 12) * 100}%`;
            if (timeLeft <= 0) {
                clearInterval(AppState.countdownInterval);
                closeIncomingModal();
            }
        }, 1000);
    }

    if (modal) modal.style.display = "flex";
}

function closeIncomingModal() {
    const modal = document.getElementById("incomingCallModal");
    if (modal) modal.style.display = "none";
    clearInterval(AppState.countdownInterval);
}

function openOutgoingModal(targetName) {
    const modal = document.getElementById("outgoingCallModal");
    const nameEl = document.getElementById("outgoingTargetName");
    const statusEl = document.getElementById("outgoingStatusText");

    if (nameEl) nameEl.innerText = targetName;
    if (statusEl) statusEl.innerText = "Connecting...";
    if (modal) modal.style.display = "flex";
}

function closeOutgoingModal() {
    const modal = document.getElementById("outgoingCallModal");
    if (modal) modal.style.display = "none";
}

// Compatibility handler
function openPopup() {
    openIncomingModal(AppState.activePeer?.username || "Contact");
}

// =============================================================================
// COMMS NETWORK (FRIENDS, SEARCH, REQUESTS, BLOCKED)
// =============================================================================

async function openconnectionpage(pageName) {
    playCyberChirp(700, 900, 'sine', 0.04);
    AppState.currentNetworkTab = pageName;

    // Update active sub-nav styling
    document.querySelectorAll(".sub-nav-card").forEach(c => c.classList.remove("active"));
    const activeSub = document.getElementById(`btn-${pageName}`);
    if (activeSub) activeSub.classList.add("active");

    const container = document.getElementById("connectionpage");
    if (!container) return;

    if (pageName === "friendslistpage") {
        container.innerHTML = `
            <div class="network-section-card">
                <h3 class="network-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    My Contacts
                </h3>
                <div id="friendsListContainer" class="user-entity-list">
                    <p style="color:var(--text-muted)">Loading contacts...</p>
                </div>
            </div>
        `;
        await renderFriendsListPage();

    } else if (pageName === "searchpage") {
        container.innerHTML = `
            <div class="network-section-card">
                <h3 class="network-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    Find Users
                </h3>
                <div class="network-search-box">
                    <span class="search-input-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                    <input type="text" id="networkSearchInput" class="network-search-input" placeholder="Type username to search..." oninput="handleUserSearchInput(this.value)">
                </div>
                <div id="searchUserResults" class="user-entity-list">
                    <p style="color:var(--text-muted)">Enter at least 2 characters to search.</p>
                </div>
            </div>
        `;

    } else if (pageName === "requestspage") {
        container.innerHTML = `
            <div class="network-section-card">
                <h3 class="network-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path></svg>
                    Friend Requests
                </h3>
                <div id="incomingRequestsContainer" class="user-entity-list">
                    <p style="color:var(--text-muted)">Loading requests...</p>
                </div>
            </div>
        `;
        await renderRequestsPage();

    } else if (pageName === "blockedfriends") {
        container.innerHTML = `
            <div class="network-section-card">
                <h3 class="network-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    Blocked Users
                </h3>
                <div id="blockedUsersContainer" class="user-entity-list">
                    <p style="color:var(--text-muted)">Loading blocked users...</p>
                </div>
            </div>
        `;
        await renderBlockedPage();
    }
}

// 1. Render Friends List
async function renderFriendsListPage() {
    const container = document.getElementById("friendsListContainer");
    if (!container) return;

    try {
        const res = await fetch(`api/friendslist/${AppState.userId}`);
        const result = await res.json();
        AppState.friendsList = result.data || [];

        if (AppState.friendsList.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1;">No contacts yet. Use 'Find Users' to search and connect.</p>`;
            return;
        }

        container.innerHTML = "";
        AppState.friendsList.forEach(user => {
            if (user.status !== "accepted") return;
            const card = document.createElement("div");
            card.className = "user-entity-card";
            card.innerHTML = `
                <div class="entity-avatar-name">
                    <div class="entity-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <span class="entity-username">${user.username}</span>
                </div>
                <div class="entity-actions">
                    <button class="action-btn-pill video" onclick="initiateCall({ id: ${user.id}, username: '${user.username}' })" title="Start Video Call">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        <span>Call</span>
                    </button>
                    <button class="action-btn-pill chat" onclick="openChatFromNetwork({ id: ${user.id}, username: '${user.username}' })" title="Send Message">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    </button>
                    <button class="action-btn-pill danger" onclick="acceptRequest(${user.id}, 3)" title="Block User">
                        <span>Block</span>
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="color:var(--red);">Error loading contacts.</p>`;
    }
}

// 2. Debounced User Search
let searchDebounceTimer = null;
function handleUserSearchInput(query) {
    clearTimeout(searchDebounceTimer);
    const resultsContainer = document.getElementById("searchUserResults");
    if (!resultsContainer) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
        resultsContainer.innerHTML = `<p style="color:var(--text-muted)">Enter at least 2 characters to search.</p>`;
        return;
    }

    resultsContainer.innerHTML = `<p style="color:var(--cyan)">Searching for "${trimmed}"...</p>`;
    searchDebounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`api/users/${AppState.userId}/${trimmed}`);
            const result = await res.json();
            const users = result.data || [];

            if (users.length === 0) {
                resultsContainer.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1;">No users matching "${trimmed}" found.</p>`;
                return;
            }

            resultsContainer.innerHTML = "";
            users.forEach(u => {
                const card = document.createElement("div");
                card.className = "user-entity-card";
                card.innerHTML = `
                    <div class="entity-avatar-name">
                        <div class="entity-avatar">${u.username.charAt(0).toUpperCase()}</div>
                        <span class="entity-username">${u.username}</span>
                    </div>
                    <div class="entity-actions">
                        <button class="action-btn-pill primary" onclick="sendFriendRequest(${u.id}, this)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            <span>Add Friend</span>
                        </button>
                    </div>
                `;
                resultsContainer.appendChild(card);
            });
        } catch (err) {
            resultsContainer.innerHTML = `<p style="color:var(--red)">Failed to search directory.</p>`;
        }
    }, 300);
}

// Send Friend Request
async function sendFriendRequest(receiverId, btnElement) {
    if (btnElement) {
        btnElement.disabled = true;
        btnElement.innerText = "Sending...";
    }

    try {
        const res = await fetch("api/sendrequest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senderid: AppState.userId,
                receiverid: receiverId
            })
        });
        const result = await res.json();
        showToast(result.data || "Friend request sent", "success");
        if (btnElement) btnElement.innerText = "Sent ✓";
    } catch (e) {
        showToast("Failed to send request", "error");
        if (btnElement) {
            btnElement.disabled = false;
            btnElement.innerText = "Add Friend";
        }
    }
}

// 3. Render Requests Page
async function renderRequestsPage() {
    const container = document.getElementById("incomingRequestsContainer");
    if (!container) return;

    try {
        const res = await fetch(`api/requestslist/${AppState.userId}`);
        const result = await res.json();
        const pending = (result.data || []).filter(u => u.status === "pending");

        // Update badge
        const badge = document.getElementById("signalPendingBadge");
        if (badge) {
            if (pending.length > 0) {
                badge.innerText = pending.length;
                badge.style.display = "block";
            } else {
                badge.style.display = "none";
            }
        }

        if (pending.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1;">No friend requests pending.</p>`;
            return;
        }

        container.innerHTML = "";
        pending.forEach(u => {
            const card = document.createElement("div");
            card.className = "user-entity-card";
            card.innerHTML = `
                <div class="entity-avatar-name">
                    <div class="entity-avatar">${u.username.charAt(0).toUpperCase()}</div>
                    <span class="entity-username">${u.username}</span>
                </div>
                <div class="entity-actions">
                    <button class="action-btn-pill success" onclick="acceptRequest(${u.id}, 1)">Accept</button>
                    <button class="action-btn-pill chat" onclick="acceptRequest(${u.id}, 2)">Reject</button>
                    <button class="action-btn-pill danger" onclick="acceptRequest(${u.id}, 3)">Block</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="color:var(--red);">Error loading requests.</p>`;
    }
}

// 4. Render Blocked Page
async function renderBlockedPage() {
    const container = document.getElementById("blockedUsersContainer");
    if (!container) return;

    try {
        const res = await fetch(`api/blockedlist/${AppState.userId}`);
        const result = await res.json();
        const blocked = result.data || [];

        if (blocked.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); grid-column:1/-1;">No blocked users.</p>`;
            return;
        }

        container.innerHTML = "";
        blocked.forEach(u => {
            const card = document.createElement("div");
            card.className = "user-entity-card";
            card.innerHTML = `
                <div class="entity-avatar-name">
                    <div class="entity-avatar">${u.username.charAt(0).toUpperCase()}</div>
                    <span class="entity-username">${u.username}</span>
                </div>
                <div class="entity-actions">
                    <button class="action-btn-pill primary" onclick="acceptRequest(${u.id}, 4)">Unblock</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = `<p style="color:var(--red);">Error loading blocked users.</p>`;
    }
}

// Request Action Handler
async function acceptRequest(userId, type) {
    const payload = {
        senderid: userId,
        receiverid: AppState.userId,
        status: ""
    };

    if (type === 1) payload.status = "accepted";
    else if (type === 2) payload.status = "rejected";
    else if (type === 3) payload.status = "blocked";
    else if (type === 4) payload.status = "unblocked";

    try {
        const res = await fetch("api/acceptrequesr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        showToast(result.data || "Action completed", "info");

        // Reload current tab
        openconnectionpage(AppState.currentNetworkTab);
        refreshDashboardCounters();
    } catch (e) {
        showToast("Action failed", "error");
    }
}

// =============================================================================
// ROSTER LOADERS FOR COMMS STAGE & DATA RELAY
// =============================================================================

async function loadCallRoster() {
    const listEl = document.getElementById("userslistvideo");
    const countBadge = document.getElementById("rosterCountBadge");
    if (!listEl) return;

    try {
        const res = await fetch(`api/friendslist/${AppState.userId}`);
        const result = await res.json();
        AppState.friendsList = result.data || [];
        const accepted = AppState.friendsList.filter(u => u.status === "accepted");

        if (countBadge) countBadge.innerText = `${accepted.length} Online`;

        if (accepted.length === 0) {
            listEl.innerHTML = `<div class="empty-roster-placeholder">No contacts available to call.</div>`;
            return;
        }

        listEl.innerHTML = "";
        accepted.forEach(user => {
            const item = document.createElement("div");
            item.className = "roster-user-item";
            item.id = `video-user-card-id_${user.id}`;
            item.innerHTML = `
                <div class="roster-user-meta">
                    <span class="roster-status-dot"></span>
                    <span class="roster-user-name">${user.username}</span>
                </div>
                <div class="roster-quick-call-btns">
                    <button class="roster-quick-btn" onclick="event.stopPropagation(); initiateCall({ id: ${user.id}, username: '${user.username}' });" title="Start Video Call">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                    </button>
                </div>
            `;
            item.addEventListener("click", () => {
                document.querySelectorAll(".roster-user-item").forEach(el => el.classList.remove("active"));
                item.classList.add("active");
                openUserPage(user);
            });
            listEl.appendChild(item);
        });
    } catch (e) {
        listEl.innerHTML = `<div class="empty-roster-placeholder">Failed to load contacts.</div>`;
    }
}

function openUserPage(user) {
    if (AppState.callStatus === "connected" || AppState.callStatus === "calling") {
        showToast("You are already in an active call", "warning");
        return;
    }

    const stageArea = document.getElementById("chatArea");
    if (!stageArea) return;

    stageArea.innerHTML = `
        <div class="active-call-arena">
            <div class="arena-header-bar">
                <div class="arena-user-profile">
                    <div class="arena-avatar">${user.username.charAt(0).toUpperCase()}</div>
                    <div class="arena-info">
                        <h2 class="arena-user-name">${user.username}</h2>
                        <span class="arena-status-sub">Contact Selected</span>
                    </div>
                </div>
            </div>

            <div class="video-stream-stage">
                <div class="stage-idle-state">
                    <div class="standby-scanner">
                        <div class="scanner-rings"></div>
                        <div class="scanner-hud-icon">
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        </div>
                    </div>
                    <h3 class="standby-title">Start a Video Call with ${user.username}</h3>
                    <p class="standby-desc">Direct WebRTC peer-to-peer encrypted video call.</p>
                    <div style="display:flex; gap:14px; margin-top:10px;">
                        <button class="hero-action-btn primary" onclick="initiateCall({ id: ${user.id}, username: '${user.username}' })">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                            <span>Start Video Call</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // On mobile devices, smoothly scroll down to the stage area
    if (window.innerWidth <= 768) {
        stageArea.scrollIntoView({ behavior: 'smooth' });
    }
}

// Filter Rosters
function filterCallRoster(val) {
    const query = val.toLowerCase();
    document.querySelectorAll("#userslistvideo .roster-user-item").forEach(item => {
        const name = item.querySelector(".roster-user-name")?.innerText.toLowerCase() || "";
        item.style.display = name.includes(query) ? "flex" : "none";
    });
}

function filterChatRoster(val) {
    const query = val.toLowerCase();
    document.querySelectorAll("#userslisttext .roster-user-item").forEach(item => {
        const name = item.querySelector(".roster-user-name")?.innerText.toLowerCase() || "";
        item.style.display = name.includes(query) ? "flex" : "none";
    });
}

// =============================================================================
// DATA RELAY (TEXT CHAT ENGINE)
// =============================================================================

async function loadChatRoster() {
    const listEl = document.getElementById("userslisttext");
    if (!listEl) return;

    try {
        const res = await fetch(`api/friendslist/${AppState.userId}`);
        const result = await res.json();
        const accepted = (result.data || []).filter(u => u.status === "accepted");

        if (accepted.length === 0) {
            listEl.innerHTML = `<div class="empty-roster-placeholder">No contacts to message.</div>`;
            return;
        }

        listEl.innerHTML = "";
        accepted.forEach(user => {
            const item = document.createElement("div");
            item.className = "roster-user-item";
            item.id = `chat-user-card-id_${user.id}`;
            item.innerHTML = `
                <div class="roster-user-meta">
                    <span class="roster-status-dot"></span>
                    <span class="roster-user-name">${user.username}</span>
                </div>
            `;
            item.addEventListener("click", () => {
                document.querySelectorAll("#userslisttext .roster-user-item").forEach(el => el.classList.remove("active"));
                item.classList.add("active");
                openUserPagechat(user);
            });
            listEl.appendChild(item);
        });
    } catch (e) {
        listEl.innerHTML = `<div class="empty-roster-placeholder">Failed to load conversations.</div>`;
    }
}

function openChatFromNetwork(user) {
    switchMainScreen("textchat");
    setTimeout(() => {
        openUserPagechat(user);
    }, 200);
}

async function openUserPagechat(userdetails) {
    AppState.activeChatPeer = userdetails;
    AppState.activeChatRoomId = 0;
    AppState.lastMessageId = 0;

    const chatArea = document.getElementById("chatAreatext");
    if (!chatArea) return;

    chatArea.innerHTML = `
        <div class="active-chat-wrapper">
            <!-- Chat Header -->
            <div class="chat-header-bar">
                <div class="chat-contact-info">
                    <div class="chat-avatar-disc">${userdetails.username.charAt(0).toUpperCase()}</div>
                    <div>
                        <h3 class="chat-contact-name">${userdetails.username}</h3>
                        <span style="font-size:0.75rem; color:var(--cyan);">Direct Message</span>
                    </div>
                </div>
                <div class="chat-header-actions">
                    <button class="chat-action-call-btn video" onclick="initiateCall({ id: ${userdetails.id}, username: '${userdetails.username}' })" title="Start Video Call">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                        <span>Video Call</span>
                    </button>
                </div>
            </div>

            <!-- Messages Stream -->
            <div id="messagelist">
                <p style="color:var(--text-muted); text-align:center; padding:20px;">Loading messages...</p>
            </div>

            <!-- Chat Input Dock -->
            <div class="chat-input-dock">
                <input type="text" id="messageTxt" class="chat-input-field" placeholder="Type a message to ${userdetails.username}..." autocomplete="off">
                <button class="chat-send-btn" onclick="sendMessage(${userdetails.id})">
                    <span>Send</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
    `;

    const input = document.getElementById("messageTxt");
    if (input) {
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage(userdetails.id);
            }
        });
        input.focus();
    }

    try {
        const roomRes = await fetch(`api/getroomid/${userdetails.id}/${AppState.userId}`);
        const roomData = await roomRes.json();
        
        if (roomData.data && roomData.data.length > 0) {
            AppState.activeChatRoomId = roomData.data[0].room_id;
            await loadMessages(AppState.activeChatRoomId, 0);
        } else {
            const list = document.getElementById("messagelist");
            if (list) list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Start a conversation with ${userdetails.username}!</p>`;
        }
    } catch (e) {
        console.error("Error loading chat room:", e);
    }
}

async function loadMessages(roomId, beforeId = 0) {
    try {
        const res = await fetch(`api/getmessage/${roomId}/${beforeId}`);
        const result = await res.json();
        const messages = result.data || [];
        renderMessagesData(messages);

        const list = document.getElementById("messagelist");
        if (list && beforeId === 0) {
            list.scrollTop = list.scrollHeight;
            list.addEventListener("scroll", () => {
                if (list.scrollTop === 0 && AppState.lastMessageId > 0) {
                    loadOldMessages(roomId);
                }
            });
        }
    } catch (e) {
        console.error("Error loading messages:", e);
    }
}

function renderMessagesData(messageList) {
    const listDiv = document.getElementById("messagelist");
    if (!listDiv) return;

    if (AppState.lastMessageId === 0) {
        listDiv.innerHTML = "";
    }

    const oldHeight = listDiv.scrollHeight;
    const oldScroll = listDiv.scrollTop;

    if (messageList.length > 0) {
        AppState.lastMessageId = messageList[messageList.length - 1].id;
    }

    let unseenIds = [];

    // Render in chronological order
    const sorted = [...messageList].sort((a, b) => a.id - b.id);

    sorted.forEach(msg => {
        if (msg.message_status !== "seen" && msg.user_id !== Number(AppState.userId)) {
            unseenIds.push(msg.id);
        }

        const isMe = (msg.user_id === Number(AppState.userId));
        const packet = document.createElement("div");
        packet.className = `message-packet ${isMe ? 'send' : 'received'}`;
        packet.innerHTML = `
            <div class="message-packet-text" id="msgid_${msg.id}">
                ${escapeHtml(msg.message)}
            </div>
            <div class="message-packet-footer">
                <span class="message-packet-time">${formatTimestamp(msg.created_at)}</span>
                ${isMe ? `<span class="msg-status-receipt ${msg.message_status}">✓</span>` : ''}
            </div>
        `;
        listDiv.appendChild(packet);
    });

    listDiv.scrollTop = listDiv.scrollHeight - oldHeight + oldScroll;

    // Acknowledge unseen messages to sender
    unseenIds.forEach(id => {
        socket.emit("messagestatus", {
            senderid: AppState.activeChatPeer?.id,
            lastmsgid: id,
            status: "seen"
        });
    });
}

async function loadOldMessages(roomId) {
    if (!AppState.lastMessageId) return;
    try {
        const res = await fetch(`api/getmessage/${roomId}/${AppState.lastMessageId}`);
        const result = await res.json();
        if (result.data && result.data.length > 0) {
            renderMessagesData(result.data);
        }
    } catch (e) {}
}

async function sendMessage(receiverId) {
    const input = document.getElementById("messageTxt");
    if (!input) return;

    const messageText = input.value.trim();
    if (!messageText) return;

    playCyberChirp(900, 1100, 'sine', 0.03);

    const tempId = crypto.randomUUID();
    const payload = {
        roomid: AppState.activeChatRoomId,
        senderid: AppState.userId,
        receiverid: AppState.activeChatPeer?.id || receiverId,
        message: messageText,
        tempmessageid: tempId
    };

    const listDiv = document.getElementById("messagelist");
    if (listDiv) {
        const packet = document.createElement("div");
        packet.className = "message-packet send";
        packet.innerHTML = `
            <div class="message-packet-text" id="msgid_${tempId}">
                ${escapeHtml(messageText)}
            </div>
            <div class="message-packet-footer">
                <span class="message-packet-time">${formatTimestamp(new Date())}</span>
                <span class="msg-status-receipt sent">✓</span>
            </div>
        `;
        listDiv.appendChild(packet);
        listDiv.scrollTop = listDiv.scrollHeight;
    }

    input.value = "";
    input.focus();

    socket.emit("sendprivatemessage", payload);
}

// Receive private message
socket.on("receiveprivatemessage", (data) => {
    playCyberChirp(700, 1000, 'sine', 0.05);

    const isCurrentChat = (AppState.activeChatPeer && AppState.activeChatPeer.id === Number(data.senderid));

    if (!isCurrentChat) {
        const sender = AppState.friendsList.find(f => f.id === Number(data.senderid));
        const senderName = sender ? sender.username : "An operative";
        showToast(`💬 Signal from ${senderName}`, "info");
        return;
    }

    const listDiv = document.getElementById("messagelist");
    if (listDiv) {
        const packet = document.createElement("div");
        packet.className = "message-packet received";
        packet.id = `msgid_${data.lastmsgid}`;
        packet.innerHTML = `
            <div class="message-packet-text">
                ${escapeHtml(data.data.message)}
            </div>
            <div class="message-packet-footer">
                <span class="message-packet-time">${formatTimestamp(new Date())}</span>
            </div>
        `;
        listDiv.appendChild(packet);
        listDiv.scrollTop = listDiv.scrollHeight;

        socket.emit("messagestatus", {
            lastmsgid: data.lastmsgid,
            senderid: data.senderid,
            status: "seen"
        });
    }
});

// Message status acknowledgments
socket.on("messagestatus", (data) => {
    if (data.type === "msg_ack") {
        const el = document.getElementById(`msgid_${data.tempid}`);
        if (el) {
            el.id = `msgid_${data.lastmsgid}`;
            const receipt = el.parentElement.querySelector(".msg-status-receipt");
            if (receipt) {
                receipt.className = `msg-status-receipt ${data.status}`;
            }
        }
    } else {
        const el = document.getElementById(`msgid_${data.lastmsgid}`);
        if (el) {
            const receipt = el.parentElement.querySelector(".msg-status-receipt");
            if (receipt) {
                receipt.className = `msg-status-receipt ${data.status}`;
            }
        }
    }
});

// =============================================================================
// DASHBOARD COUNTERS & DIAGNOSTICS REFRESH
// =============================================================================
async function refreshDashboardCounters() {
    try {
        const [friendsRes, requestsRes] = await Promise.all([
            fetch(`api/friendslist/${AppState.userId}`),
            fetch(`api/requestslist/${AppState.userId}`)
        ]);

        const friends = await friendsRes.json();
        const requests = await requestsRes.json();

        const acceptedFriends = (friends.data || []).filter(u => u.status === "accepted");
        const pendingRequests = (requests.data || []).filter(u => u.status === "pending");

        const friendsEl = document.getElementById("statsFriendsCount");
        if (friendsEl) friendsEl.innerText = acceptedFriends.length;

        const reqsEl = document.getElementById("statsRequestsCount");
        if (reqsEl) reqsEl.innerText = pendingRequests.length;

        const signalBadge = document.getElementById("signalPendingBadge");
        if (signalBadge) {
            if (pendingRequests.length > 0) {
                signalBadge.innerText = pendingRequests.length;
                signalBadge.style.display = "block";
            } else {
                signalBadge.style.display = "none";
            }
        }

        // Hardware test checks
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const videoInputs = devices.filter(d => d.kind === "videoinput").length;
                const audioInputs = devices.filter(d => d.kind === "audioinput").length;
                const devEl = document.getElementById("diagMediaDevices");
                if (devEl) {
                    devEl.innerText = `READY (${audioInputs} MIC / ${videoInputs} CAM)`;
                }
            });
        }
    } catch (e) {}
}

// =============================================================================
// LOGOUT ENGINE WITH ACTIVE CALL VALIDATION
// =============================================================================
async function confirmLogout() {
    playCyberChirp(500, 300);

    // VALIDATION: If in an active call, prompt warning!
    if (AppState.callStatus === "connected" || AppState.callStatus === "calling") {
        const confirmResult = await Swal.fire({
            title: 'Call in Progress',
            text: 'Signing out will end your current call. Proceed?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6366f1',
            confirmButtonText: 'End Call & Sign Out',
            cancelButtonText: 'Stay in Call',
            background: '#111827',
            color: '#f9fafb',
            customClass: { popup: 'swal-custom-popup' }
        });

        if (!confirmResult.isConfirmed) return;
        triggerHangup(true);
    }

    try {
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        const res = await fetch("api/logout", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });
        const result = await res.json();
        if (result.code === "0" || result.code === 0) {
            showToast("Signed out successfully", "info");
            setTimeout(() => {
                window.location.href = "/";
            }, 500);
        } else {
            window.location.href = "/";
        }
    } catch (e) {
        window.location.href = "/";
    }
}

// Compatibility wrapper for old logout calls
function logout() {
    confirmLogout();
}

// =============================================================================
// DRAGGABLE FLOATING PIP CALL WIDGET
// =============================================================================
(function initDraggablePiP() {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    window.addEventListener("DOMContentLoaded", () => {
        const pipWidget = document.getElementById("floatingCallWidget");
        const dragHandle = document.getElementById("pipDragHandle");
        if (!pipWidget || !dragHandle) return;

        dragHandle.addEventListener("mousedown", (e) => {
            if (e.target.closest("button")) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = pipWidget.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            
            pipWidget.style.bottom = "auto";
            pipWidget.style.right = "auto";
            pipWidget.style.left = `${initialLeft}px`;
            pipWidget.style.top = `${initialTop}px`;
        });

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            pipWidget.style.left = `${Math.max(10, Math.min(window.innerWidth - 300, initialLeft + dx))}px`;
            pipWidget.style.top = `${Math.max(10, Math.min(window.innerHeight - 240, initialTop + dy))}px`;
        });

        window.addEventListener("mouseup", () => {
            isDragging = false;
        });
    });
})();

// =============================================================================
// UTILITIES: TOASTS, DATES, STRING FORMATTING
// =============================================================================
function showToast(text, type = "info") {
    const bgColors = {
        info: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        error: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
    };

    Toastify({
        text: text,
        duration: 3500,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: bgColors[type] || bgColors.info,
            color: '#ffffff',
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            fontSize: "13.5px",
            fontWeight: "500",
            fontFamily: "Inter, -apple-system, sans-serif",
            padding: "10px 18px"
        }
    }).showToast();
}

function openalertmodel(text) {
    showToast(text, "info");
}

function formatTimestamp(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

// Background Canvas Particle Grid Animation
(function initBackgroundCanvas() {
    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(Math.floor((width * height) / 16000), 65);

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.4 + 0.15
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Cyber Grid Lines
        ctx.strokeStyle = "rgba(0, 240, 255, 0.025)";
        ctx.lineWidth = 1;
        const grid = 65;
        for (let x = 0; x < width; x += grid) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += grid) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Particle Mesh
        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];
            p1.x += p1.vx;
            p1.y += p1.vy;

            if (p1.x < 0) p1.x = width;
            if (p1.x > width) p1.x = 0;
            if (p1.y < 0) p1.y = height;
            if (p1.y > height) p1.y = 0;

            ctx.fillStyle = `rgba(0, 240, 255, ${p1.alpha})`;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 * (1 - dist / 100)})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
})();

// =============================================================================
// DOM CONTENT LOADED INITIALIZER
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("[NEXUS] UI Engine Initialized");

    // Populate Topbar User Identity
    const user1 = document.getElementById("userdetails1");
    if (user1) user1.innerText = AppState.username;

    const user2 = document.getElementById("userdetails2");
    if (user2) user2.innerText = AppState.username;

    const idBadge = document.getElementById("userdetailsIdBadge");
    if (idBadge) idBadge.innerText = `ID: #${AppState.userId}`;

    const avatarLetter = document.getElementById("userAvatarLetter");
    if (avatarLetter) avatarLetter.innerText = AppState.username.charAt(0).toUpperCase();

    // Initial Dashboard data fetch
    refreshDashboardCounters();

    // Check WebRTC browser support
    const diagWebrtc = document.getElementById("diagWebrtcStatus");
    if (diagWebrtc) {
        if (window.RTCPeerConnection) {
            diagWebrtc.innerText = "SUPPORTED (ACTIVE)";
            diagWebrtc.style.color = "var(--green)";
        } else {
            diagWebrtc.innerText = "UNSUPPORTED";
            diagWebrtc.style.color = "var(--red)";
        }
    }
});

// Legacy showPage compatibility
function showPage(pageName) {
    switchMainScreen(pageName);
}
