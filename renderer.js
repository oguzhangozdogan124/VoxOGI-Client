"use strict";

const STORAGE_KEY = "voxogi-client-v2-settings";
const SOCKET_PATH = "/s.io";
const MAX_CALL_USERS = 4;
const DEFAULT_SETTINGS = Object.freeze({
    serverUrl: "",
    token: "",
    nickname: "",
    microphoneId: "",
    speakerId: "",
});
const RTC_CONFIGURATION = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const elements = {
    settingsButton: document.getElementById("settings-button"),
    connectionLabel: document.getElementById("connection-label"),
    identityLabel: document.getElementById("identity-label"),
    messages: document.getElementById("messages"),
    messageForm: document.getElementById("message-form"),
    messageInput: document.getElementById("message-input"),
    sendButton: document.getElementById("send-button"),
    userCount: document.getElementById("user-count"),
    usersEmpty: document.getElementById("users-empty"),
    usersList: document.getElementById("users-list"),
    toastRegion: document.getElementById("toast-region"),
    remoteAudioContainer: document.getElementById("remote-audio-container"),
    settingsDialog: document.getElementById("settings-dialog"),
    settingsForm: document.getElementById("settings-form"),
    settingsClose: document.getElementById("settings-close"),
    settingsCancel: document.getElementById("settings-cancel"),
    settingsError: document.getElementById("settings-error"),
    serverUrlInput: document.getElementById("server-url-input"),
    tokenInput: document.getElementById("token-input"),
    nicknameInput: document.getElementById("nickname-input"),
    microphoneSelect: document.getElementById("microphone-select"),
    microphoneTestButton: document.getElementById("microphone-test-button"),
    microphoneMeter: document.getElementById("microphone-meter"),
    microphoneLevel: document.getElementById("microphone-level"),
    speakerSelect: document.getElementById("speaker-select"),
    speakerTestButton: document.getElementById("speaker-test-button"),
    screenPickerDialog: document.getElementById("screen-picker-dialog"),
    screenPickerClose: document.getElementById("screen-picker-close"),
    screenPickerCancel: document.getElementById("screen-picker-cancel"),
    screenSourceList: document.getElementById("screen-source-list"),
};

function loadSettings() {
    try {
        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

let settings = loadSettings();
let socket = null;

const state = {
    connected: false,
    shouldJoin: Boolean(settings.nickname.trim()),
    joined: false,
    users: [],
    calls: new Map(),
    currentCall: null,
    pendingTarget: null,
    localStream: null,
    localStreamPromise: null,
    peers: new Map(),
    peerPromises: new Map(),
    makingOffers: new Set(),
    pendingCandidates: new Map(),
    remoteAudio: new Map(),
    remoteScreens: new Map(),
    remoteScreenTimers: new Map(),
    localScreenStream: null,
    screenShareStarting: false,
    screenPickerResolve: null,
    userColors: new Map(),
    microphoneMuted: false,
    microphoneTest: null,
};

function callKey(users) {
    return [...users].sort().join("::");
}

function normalizeCall(rawCall) {
    if (!Array.isArray(rawCall?.users) || rawCall.users.length < 2) return null;
    return {
        id: String(rawCall.id || callKey(rawCall.users)),
        users: [...rawCall.users],
        names: rawCall.users.map((userId, index) => rawCall.names?.[index] || userName(userId)),
        maxUsers: Number(rawCall.maxUsers) || MAX_CALL_USERS,
    };
}

function callForUser(userId) {
    return [...state.calls.values()].find((call) => call.users.includes(userId)) || null;
}

function userName(userId) {
    return state.users.find((user) => user.id === userId)?.name || "Unknown";
}

function colorForUser(userId) {
    const key = String(userId || "unknown");
    if (!state.userColors.has(key)) {
        const values = new Uint16Array(1);
        const hue = window.crypto?.getRandomValues ? window.crypto.getRandomValues(values)[0] % 360 : Math.floor(Math.random() * 360);
        state.userColors.set(key, `hsl(${hue} 68% 52%)`);
    }
    return state.userColors.get(key);
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = String(message);
    elements.toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 4200);
}

function setConnectionState(stateName, label) {
    elements.connectionLabel.dataset.state = stateName;
    elements.connectionLabel.textContent = label;
}

function updateRoomControls() {
    elements.messageInput.disabled = !state.joined;
    elements.sendButton.disabled = !state.joined;

    if (state.currentCall) {
        elements.identityLabel.textContent = `In a voice chat (${state.currentCall.users.length}/${MAX_CALL_USERS})`;
    } else if (state.joined) {
        elements.identityLabel.textContent = `Not in a call (${settings.nickname})`;
    } else if (settings.nickname.trim()) {
        elements.identityLabel.textContent = `Joining as ${settings.nickname}…`;
    } else {
        elements.identityLabel.textContent = "Set a nickname in Settings";
    }
}

function updateCallConnectionState() {
    if (!state.currentCall) return;
    const connected = [...state.peers.values()].filter((peer) => peer.connectionState === "connected").length;
    const expected = Math.max(0, state.currentCall.users.length - 1);
    const status = [...elements.usersList.querySelectorAll(".voice-group-card")].find((card) => card.dataset.callId === state.currentCall.id)?.querySelector(".voice-group-status");
    if (!status) return;
    status.textContent = connected === expected && expected > 0 ? "Audio connected" : `Audio ${connected}/${expected}`;
}

function activeScreenShare(call) {
    if (!call) return null;
    if (state.localScreenStream?.getVideoTracks().some((track) => track.readyState === "live")) {
        return { ownerId: socket?.id, stream: state.localScreenStream, local: true };
    }
    for (const userId of call.users) {
        const stream = state.remoteScreens.get(userId);
        if (stream?.getVideoTracks().some((track) => track.readyState === "live" && !track.muted)) {
            return { ownerId: userId, stream, local: false };
        }
    }
    return null;
}

function cardAction(user) {
    if (user.id === socket?.id) return { label: "You", disabled: true, className: "" };
    if (!state.joined) return { label: "Join chat first", disabled: true, className: "" };
    if (state.pendingTarget) return { label: "Connecting…", disabled: true, className: "" };

    const localCall = state.currentCall;
    const targetCall = callForUser(user.id);

    if (localCall?.users.includes(user.id)) {
        return { label: `Your call ${localCall.users.length}/${MAX_CALL_USERS}`, disabled: true, className: "in-call" };
    }
    if (localCall) {
        if (targetCall) return { label: "In another call", disabled: true, className: "other-call" };
        if (localCall.users.length >= MAX_CALL_USERS) return { label: "Your call is full", disabled: true, className: "other-call" };
        return { label: "Add to your call", disabled: false, className: "" };
    }
    if (targetCall) {
        if (targetCall.users.length >= MAX_CALL_USERS) return { label: "Call is full", disabled: true, className: "other-call" };
        return { label: `Join voice chat ${targetCall.users.length}/${MAX_CALL_USERS}`, disabled: false, className: "other-call" };
    }
    return { label: "Start voice chat", disabled: false, className: "" };
}

function renderUsers() {
    const fragment = document.createDocumentFragment();
    const renderedCalls = new Set();
    elements.usersList.style.setProperty("--user-count", String(Math.max(1, state.users.length)));
    for (const user of state.users) {
        const call = callForUser(user.id);
        if (call) {
            if (!renderedCalls.has(call.id)) {
                fragment.append(createVoiceGroupItem(call));
                renderedCalls.add(call.id);
            }
            continue;
        }

        const action = cardAction(user);
        const item = document.createElement("li");
        const button = document.createElement("button");
        const name = document.createElement("span");
        const actionLabel = document.createElement("span");

        button.type = "button";
        button.className = `user-card ${action.className}`.trim();
        button.disabled = action.disabled;
        button.style.setProperty("--user-color", colorForUser(user.id));
        name.className = "user-name";
        name.textContent = user.name;
        actionLabel.className = "user-action";
        actionLabel.textContent = action.label;

        if (!action.disabled) button.addEventListener("click", () => requestCall(user.id));
        button.append(name, actionLabel);
        item.append(button);
        fragment.append(item);
    }

    elements.usersList.replaceChildren(fragment);
    elements.userCount.textContent = String(state.users.length);
    elements.usersEmpty.hidden = state.users.length > 0;
    updateCallConnectionState();
}

function createVoiceGroupItem(call) {
    const item = document.createElement("li");
    const card = document.createElement("section");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const status = document.createElement("span");
    const members = document.createElement("div");
    const footer = document.createElement("div");
    const capacity = document.createElement("span");
    const actions = document.createElement("div");
    const localIsMember = call.users.includes(socket?.id);
    const canJoin = state.joined && !state.currentCall && call.users.length < call.maxUsers;
    const screenShare = activeScreenShare(call);

    item.className = "voice-group-item";
    item.style.setProperty("--group-size", String(call.users.length));
    card.className = `voice-group-card${screenShare ? " is-screen-sharing" : ""}`;
    card.dataset.callId = call.id;
    header.className = "voice-group-header";
    title.textContent = `Voice chat ${call.users.length}/${call.maxUsers}`;
    status.className = "voice-group-status";
    status.textContent = localIsMember ? "Connecting audio…" : state.currentCall ? "You are in another call" : call.users.length >= call.maxUsers ? "Call is full" : "Click a member to join";
    header.append(title, status);

    members.className = "voice-group-members";
    call.users.forEach((userId, index) => {
        const member = document.createElement("button");
        const name = document.createElement("span");
        const action = document.createElement("span");
        const liveName = userName(userId);
        const memberName = liveName === "Unknown" ? call.names[index] || liveName : liveName;

        member.type = "button";
        member.className = "voice-member";
        member.disabled = !canJoin;
        member.style.setProperty("--user-color", colorForUser(userId));
        name.className = "user-name";
        name.textContent = memberName;
        action.className = "user-action";
        action.textContent = userId === socket?.id ? "You" : localIsMember ? "In your call" : canJoin ? "Join" : "In voice chat";
        if (canJoin) member.addEventListener("click", () => requestCall(userId));
        member.append(name, action);
        members.append(member);
    });

    footer.className = "voice-group-footer";
    actions.className = "voice-group-actions";
    if (localIsMember) {
        const shareButton = document.createElement("button");
        const muteButton = document.createElement("button");
        const leaveButton = document.createElement("button");
        const localIsSharing = Boolean(screenShare?.local);
        shareButton.type = "button";
        shareButton.className = `voice-group-share${localIsSharing ? " is-sharing" : ""}`;
        shareButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7v2H7v2h10v-2h-3v-2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 14H3V5h18v12Z"/></svg>';
        shareButton.setAttribute("aria-label", localIsSharing ? "Stop sharing screen" : "Share screen");
        shareButton.title = localIsSharing ? "Stop sharing screen" : screenShare ? `${userName(screenShare.ownerId)} is sharing` : "Share screen";
        shareButton.disabled = Boolean(screenShare && !localIsSharing) || state.screenShareStarting;
        shareButton.addEventListener("click", () => {
            if (localIsSharing) stopScreenShare();
            else startScreenShare();
        });
        muteButton.type = "button";
        muteButton.className = `voice-group-mute${state.microphoneMuted ? " is-muted" : ""}`;
        muteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21H8v2h8v-2h-3v-3.28c3.28-.48 6-3.3 6-6.72h-1.7Z"/></svg>';
        muteButton.setAttribute("aria-label", state.microphoneMuted ? "Unmute microphone" : "Mute microphone");
        muteButton.title = state.microphoneMuted ? "Unmute microphone" : "Mute microphone";
        muteButton.setAttribute("aria-pressed", String(state.microphoneMuted));
        muteButton.addEventListener("click", toggleMicrophoneMute);
        leaveButton.type = "button";
        leaveButton.className = "voice-group-leave";
        leaveButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.58.9l-2.29 1.14c-.33.16-.72.1-.98-.16L.7 11.85c-.26-.26-.32-.67-.14-1C2.51 7.19 6.91 5 12 5s9.49 2.19 11.44 5.85c.18.33.12.74-.14 1l-2.85 2.85c-.26.26-.65.32-.98.16l-2.29-1.14a.996.996 0 0 1-.58-.9v-3.1A15.36 15.36 0 0 0 12 9Z"/></svg>';
        leaveButton.setAttribute("aria-label", "End call");
        leaveButton.title = "End call";
        leaveButton.addEventListener("click", leaveCall);
        actions.append(shareButton, muteButton, leaveButton);
        footer.append(actions);
    } else {
        capacity.textContent = `${call.maxUsers - call.users.length} seat${call.maxUsers - call.users.length === 1 ? "" : "s"} available`;
        footer.append(capacity);
    }

    if (screenShare) {
        const stage = document.createElement("div");
        const video = document.createElement("video");
        const sharingLabel = document.createElement("span");
        const fullscreenButton = document.createElement("button");
        stage.className = "screen-share-stage";
        video.className = "screen-share-video";
        video.autoplay = true;
        video.playsInline = true;
        video.muted = screenShare.local;
        video.srcObject = screenShare.stream;
        sharingLabel.className = "screen-share-owner";
        sharingLabel.textContent = `${userName(screenShare.ownerId)} is sharing`;
        fullscreenButton.type = "button";
        fullscreenButton.className = "screen-fullscreen-button";
        fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3Zm-2-4h2V7h3V5H5v5Zm12 7h-3v2h5v-5h-2v3Zm-3-12v2h3v3h2V5h-5Z"/></svg>';
        fullscreenButton.setAttribute("aria-label", "Show shared screen fullscreen");
        fullscreenButton.title = "Fullscreen";
        fullscreenButton.addEventListener("click", () => toggleCallFullscreen(card));
        stage.append(video, sharingLabel, fullscreenButton);
        card.append(header, stage, members, footer);
        video.play().catch(() => {});
    } else {
        card.append(header, members, footer);
    }
    item.append(card);
    return item;
}

function appendMessage(rawMessage) {
    const message = String(rawMessage ?? "").trim();
    if (!message) return;

    const line = document.createElement("div");
    const time = document.createElement("time");
    const sender = document.createElement("strong");
    const separatorIndex = message.indexOf(": ");
    const senderName = separatorIndex > 0 ? message.slice(0, separatorIndex) : "System";
    const text = separatorIndex > 0 ? message.slice(separatorIndex + 2) : message;

    line.className = "message";
    if (senderName === "System") line.classList.add("system");
    else {
        const senderId = state.users.find((user) => user.name === senderName)?.id;
        line.classList.add("chat");
        line.style.setProperty("--user-color", colorForUser(senderId || `name:${senderName}`));
    }
    time.dateTime = new Date().toISOString();
    time.textContent = `[${new Intl.DateTimeFormat([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date())}]`;
    sender.textContent = `${senderName}:`;
    line.append(time, sender, document.createTextNode(` ${text}`));
    elements.messages.append(line);
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

function clearCallsAndMedia() {
    stopScreenShare(false);
    state.calls.clear();
    state.currentCall = null;
    state.pendingTarget = null;
    state.microphoneMuted = false;
    cleanupAllPeers();
    state.remoteScreens.clear();
    stopLocalStream();
    updateRoomControls();
    renderUsers();
}

function connect() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
    }

    setConnectionState("connecting", "Connecting");
    socket = io(settings.serverUrl, {
        path: SOCKET_PATH,
        transports: ["websocket"],
        auth: settings.token ? { token: settings.token } : {},
        reconnection: true,
        reconnectionDelay: 900,
        reconnectionDelayMax: 5000,
        timeout: 10000,
    });

    socket.on("connect", () => {
        state.connected = true;
        setConnectionState("connected", "Connected");
        if (settings.nickname.trim()) {
            state.shouldJoin = true;
            sendJoin();
        } else {
            state.shouldJoin = false;
            openSettings(true).catch(() => {});
        }
    });
    socket.on("disconnect", () => {
        state.connected = false;
        state.joined = false;
        state.users = [];
        setConnectionState("offline", "Reconnecting");
        clearCallsAndMedia();
        updateRoomControls();
    });
    socket.on("connect_error", (error) => {
        state.connected = false;
        state.joined = false;
        setConnectionState("offline", "Connection failed");
        if (error?.message === "Unauthorized") {
            state.shouldJoin = false;
            showToast("The server rejected the access token.", "error");
            openSettings().catch(() => {});
        }
        updateRoomControls();
    });
    socket.on("users", (users) => {
        if (!state.shouldJoin) return;
        state.users = Array.isArray(users) ? users : [];
        renderUsers();
    });
    socket.on("message", (message) => {
        if (state.shouldJoin) appendMessage(message);
    });
    socket.on("message-error", (error) => showToast(error?.message || "Message not sent.", "error"));
    socket.on("call-error", (error) => {
        state.pendingTarget = null;
        if (!state.currentCall) stopLocalStream();
        showToast(error?.message || "Unable to start the voice chat.", "error");
        renderUsers();
    });
    socket.on("call-started", (call) => handleCallStarted(call));
    socket.on("call-ended", (payload) => handleCallEnded(payload));
    socket.on("offer", (payload) => handleOffer(payload));
    socket.on("answer", (payload) => handleAnswer(payload));
    socket.on("ice-candidate", (payload) => handleCandidate(payload));
}

function sendJoin() {
    if (!socket?.connected || !settings.nickname.trim()) return;
    state.joined = true;
    updateRoomControls();
    socket.emit("join", settings.nickname.trim(), (response) => {
        if (response?.ok === false) {
            state.shouldJoin = false;
            state.joined = false;
            showToast("Unable to join the chat.", "error");
        } else {
            state.shouldJoin = true;
            state.joined = true;
            settings.nickname = response?.name || settings.nickname.trim();
            saveSettings();
            elements.messageInput.focus();
        }
        updateRoomControls();
        renderUsers();
    });
}

async function getMicrophoneStream(deviceId = settings.microphoneId) {
    const audio = deviceId ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true };
    try {
        return await navigator.mediaDevices.getUserMedia({ audio });
    } catch (error) {
        if (!deviceId || error.name === "NotAllowedError") throw error;
        return navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true },
        });
    }
}

async function ensureLocalStream() {
    if (state.localStream?.getTracks().some((track) => track.readyState === "live")) {
        return state.localStream;
    }
    if (!state.localStreamPromise) {
        state.localStreamPromise = getMicrophoneStream()
            .then((stream) => {
                state.localStream = stream;
                stream.getAudioTracks().forEach((track) => {
                    track.enabled = !state.microphoneMuted;
                });
                return stream;
            })
            .finally(() => {
                state.localStreamPromise = null;
            });
    }
    return state.localStreamPromise;
}

function stopLocalStream() {
    if (!state.localStream) return;
    state.localStream.getTracks().forEach((track) => track.stop());
    state.localStream = null;
}

function toggleMicrophoneMute() {
    if (!state.currentCall) return;
    state.microphoneMuted = !state.microphoneMuted;
    state.localStream?.getAudioTracks().forEach((track) => {
        track.enabled = !state.microphoneMuted;
    });
    document.querySelectorAll(".voice-group-mute").forEach((button) => {
        button.classList.toggle("is-muted", state.microphoneMuted);
        button.setAttribute("aria-label", state.microphoneMuted ? "Unmute microphone" : "Mute microphone");
        button.setAttribute("aria-pressed", String(state.microphoneMuted));
        button.title = state.microphoneMuted ? "Unmute microphone" : "Mute microphone";
    });
}

function finishScreenPicker(sourceId = null) {
    const resolve = state.screenPickerResolve;
    state.screenPickerResolve = null;
    if (elements.screenPickerDialog.open) elements.screenPickerDialog.close();
    if (resolve) resolve(sourceId);
}

async function chooseDesktopSource() {
    if (typeof window.voxogiDesktop?.listDesktopSources !== "function") {
        throw new Error("Desktop capture is unavailable.");
    }
    const selection = new Promise((resolve) => {
        state.screenPickerResolve = resolve;
    });
    elements.screenSourceList.textContent = "Loading screens and windows…";
    if (!elements.screenPickerDialog.open) elements.screenPickerDialog.showModal();
    let sources;
    try {
        sources = await window.voxogiDesktop.listDesktopSources();
    } catch (error) {
        finishScreenPicker();
        throw error;
    }
    if (!state.screenPickerResolve) return null;
    if (!Array.isArray(sources) || sources.length === 0) {
        finishScreenPicker();
        throw new Error("No screen or application window was found.");
    }

    const fragment = document.createDocumentFragment();
    for (const source of sources) {
        const button = document.createElement("button");
        const thumbnail = document.createElement("img");
        const name = document.createElement("span");
        button.type = "button";
        button.className = "screen-source";
        thumbnail.src = source.thumbnail;
        thumbnail.alt = "";
        name.textContent = source.name;
        button.append(thumbnail, name);
        button.addEventListener("click", () => finishScreenPicker(source.id));
        fragment.append(button);
    }
    elements.screenSourceList.replaceChildren(fragment);
    return selection;
}

async function startScreenShare() {
    if (!state.currentCall || state.screenShareStarting || activeScreenShare(state.currentCall)) return;
    state.screenShareStarting = true;
    renderUsers();
    try {
        const sourceId = await chooseDesktopSource();
        if (!sourceId || !state.currentCall) return;
        await window.voxogiDesktop.selectDesktopSource(sourceId);
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: false,
            video: { frameRate: { ideal: 30, max: 30 } },
        });
        if (!state.currentCall) {
            stream.getTracks().forEach((track) => track.stop());
            return;
        }
        const track = stream.getVideoTracks()[0];
        if (!track) throw new Error("The selected source did not provide video.");
        state.localScreenStream = stream;
        track.addEventListener("ended", () => stopScreenShare());
        for (const peer of state.peers.values()) peer.addTrack(track, stream);
        renderUsers();
        await Promise.all([...state.peers.keys()].map((remoteId) => startOffer(remoteId)));
    } catch (error) {
        if (error.name !== "NotAllowedError") showToast(`Screen sharing failed: ${error.message}`, "error");
    } finally {
        state.screenShareStarting = false;
        renderUsers();
    }
}

function stopScreenShare(renegotiate = true) {
    const stream = state.localScreenStream;
    if (!stream) return;
    state.localScreenStream = null;
    const tracks = new Set(stream.getVideoTracks());
    for (const [remoteId, peer] of state.peers) {
        for (const sender of peer.getSenders()) {
            if (sender.track && tracks.has(sender.track)) peer.removeTrack(sender);
        }
        if (renegotiate && peer.signalingState === "stable") startOffer(remoteId).catch(() => {});
    }
    stream.getTracks().forEach((track) => track.stop());
    if (renegotiate) renderUsers();
}

async function toggleCallFullscreen(card) {
    try {
        if (document.fullscreenElement === card) await document.exitFullscreen();
        else await card.requestFullscreen();
    } catch (error) {
        showToast(`Fullscreen unavailable: ${error.message}`, "error");
    }
}

function clearRemoteScreen(remoteId, rerender = true) {
    const timer = state.remoteScreenTimers.get(remoteId);
    if (timer) window.clearTimeout(timer);
    state.remoteScreenTimers.delete(remoteId);
    const removed = state.remoteScreens.delete(remoteId);
    if (removed && rerender) renderUsers();
}

async function routeAudio(audio) {
    if (settings.speakerId && typeof audio.setSinkId === "function") {
        try {
            await audio.setSinkId(settings.speakerId);
        } catch (error) {
            console.warn("Unable to select speaker:", error);
        }
    }
}

async function playCallCue(type) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const destination = context.createMediaStreamDestination();
    const audio = document.createElement("audio");
    try {
        await context.resume();
        audio.srcObject = destination.stream;
        await routeAudio(audio);
        await audio.play();

        const now = context.currentTime;
        const startFrequency = type === "join" ? 390 : 570;
        const endFrequency = type === "join" ? 690 : 310;
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(startFrequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.28);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.11, now + 0.025);
        gain.gain.setValueAtTime(0.11, now + 0.19);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
        oscillator.connect(gain).connect(destination);
        oscillator.start(now);
        oscillator.stop(now + 0.38);
        oscillator.addEventListener("ended", () => {
            audio.pause();
            audio.srcObject = null;
            context.close().catch(() => {});
        });
    } catch (error) {
        audio.pause();
        audio.srcObject = null;
        context.close().catch(() => {});
        console.warn("Unable to play call sound:", error);
    }
}

function cleanupPeer(remoteId) {
    const peer = state.peers.get(remoteId);
    if (peer) peer.close();
    state.peers.delete(remoteId);
    state.peerPromises.delete(remoteId);
    state.makingOffers.delete(remoteId);
    state.pendingCandidates.delete(remoteId);

    const audio = state.remoteAudio.get(remoteId);
    if (audio) {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
    }
    state.remoteAudio.delete(remoteId);
    clearRemoteScreen(remoteId, false);
    updateCallConnectionState();
}

function cleanupAllPeers() {
    for (const remoteId of [...state.peers.keys()]) cleanupPeer(remoteId);
    state.peerPromises.clear();
    state.makingOffers.clear();
    state.pendingCandidates.clear();
    for (const timer of state.remoteScreenTimers.values()) window.clearTimeout(timer);
    state.remoteScreenTimers.clear();
    state.remoteScreens.clear();
}

async function ensurePeer(remoteId) {
    if (state.peers.has(remoteId)) return state.peers.get(remoteId);
    if (state.peerPromises.has(remoteId)) return state.peerPromises.get(remoteId);

    const promise = (async () => {
        const stream = await ensureLocalStream();
        if (!state.currentCall?.users.includes(remoteId)) {
            if (!state.currentCall) stopLocalStream();
            const error = new Error("Voice chat ended before audio connected.");
            error.name = "AbortError";
            throw error;
        }
        const peer = new RTCPeerConnection(RTC_CONFIGURATION);
        state.peers.set(remoteId, peer);
        stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
        if (state.localScreenStream) {
            state.localScreenStream.getVideoTracks().forEach((track) => {
                if (track.readyState === "live") peer.addTrack(track, state.localScreenStream);
            });
        }

        peer.addEventListener("icecandidate", ({ candidate }) => {
            if (candidate && socket?.connected) {
                socket.emit("ice-candidate", { target: remoteId, candidate });
            }
        });
        peer.addEventListener("track", async ({ track, streams }) => {
            if (track.kind === "video") {
                const remoteStream = streams[0] || new MediaStream([track]);
                clearRemoteScreen(remoteId, false);
                state.remoteScreens.set(remoteId, remoteStream);
                track.addEventListener("ended", () => clearRemoteScreen(remoteId));
                track.addEventListener("mute", () => {
                    const timer = window.setTimeout(() => {
                        if (track.muted) clearRemoteScreen(remoteId);
                    }, 900);
                    state.remoteScreenTimers.set(remoteId, timer);
                });
                track.addEventListener("unmute", () => {
                    const timer = state.remoteScreenTimers.get(remoteId);
                    if (timer) window.clearTimeout(timer);
                    state.remoteScreenTimers.delete(remoteId);
                    state.remoteScreens.set(remoteId, remoteStream);
                    renderUsers();
                });
                renderUsers();
                return;
            }
            let audio = state.remoteAudio.get(remoteId);
            if (!audio) {
                audio = document.createElement("audio");
                audio.autoplay = true;
                elements.remoteAudioContainer.append(audio);
                state.remoteAudio.set(remoteId, audio);
            }
            audio.srcObject = new MediaStream([track]);
            await routeAudio(audio);
            await audio.play().catch(() => {});
        });
        peer.addEventListener("connectionstatechange", () => {
            updateCallConnectionState();
            if (peer.connectionState === "failed") {
                showToast(`Audio connection to ${userName(remoteId)} failed.`, "error");
            }
        });
        return peer;
    })().finally(() => state.peerPromises.delete(remoteId));

    state.peerPromises.set(remoteId, promise);
    return promise;
}

async function flushCandidates(remoteId, peer) {
    const candidates = state.pendingCandidates.get(remoteId) || [];
    for (const candidate of candidates) await peer.addIceCandidate(candidate);
    state.pendingCandidates.delete(remoteId);
}

async function startOffer(remoteId) {
    if (state.makingOffers.has(remoteId)) return;
    state.makingOffers.add(remoteId);
    try {
        const peer = await ensurePeer(remoteId);
        if (peer.signalingState !== "stable") return;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", { target: remoteId, offer: peer.localDescription });
    } finally {
        state.makingOffers.delete(remoteId);
    }
}

async function syncGroupPeers(call) {
    const remoteIds = new Set(call.users.filter((userId) => userId !== socket.id));
    for (const remoteId of [...state.peers.keys()]) {
        if (!remoteIds.has(remoteId)) cleanupPeer(remoteId);
    }
    await ensureLocalStream();
    await Promise.all([...remoteIds].filter((remoteId) => socket.id.localeCompare(remoteId) < 0).map((remoteId) => startOffer(remoteId)));
    updateCallConnectionState();
}

async function handleCallStarted(rawCall) {
    if (!state.shouldJoin) return;
    const call = normalizeCall(rawCall);
    if (!call) return;

    const previous = state.calls.get(call.id);
    const previousCurrent = state.currentCall;
    state.calls.set(call.id, call);
    state.pendingTarget = null;

    if (previous?.users.includes(socket.id) && !call.users.includes(socket.id)) {
        stopScreenShare(false);
        state.currentCall = null;
        state.microphoneMuted = false;
        cleanupAllPeers();
        stopLocalStream();
        playCallCue("leave");
    }

    if (call.users.includes(socket.id)) {
        state.currentCall = call;
        const joinedCall = previousCurrent?.id !== call.id;
        const memberDelta = previousCurrent?.id === call.id ? call.users.length - previousCurrent.users.length : 0;
        if (joinedCall || memberDelta > 0) playCallCue("join");
        else if (memberDelta < 0) playCallCue("leave");
        updateRoomControls();
        renderUsers();
        try {
            await syncGroupPeers(call);
        } catch (error) {
            if (error.name === "AbortError") return;
            showToast(`Unable to start audio: ${error.message}`, "error");
            socket.emit("leave-call");
        }
    }

    updateRoomControls();
    renderUsers();
}

function handleCallEnded({ id, users } = {}) {
    const callId = id ? String(id) : callKey(users || []);
    const endedCall = state.calls.get(callId);
    state.calls.delete(callId);
    if (state.currentCall?.id === callId || endedCall?.users.includes(socket?.id)) {
        playCallCue("leave");
        state.currentCall = null;
        state.microphoneMuted = false;
        stopScreenShare(false);
        cleanupAllPeers();
        stopLocalStream();
    }
    updateRoomControls();
    renderUsers();
}

async function handleOffer({ from, offer } = {}) {
    if (!from || !offer || !state.currentCall?.users.includes(from)) return;
    try {
        const peer = await ensurePeer(from);
        await peer.setRemoteDescription(offer);
        await flushCandidates(from, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { target: from, answer: peer.localDescription });
    } catch (error) {
        showToast(`Unable to connect to ${userName(from)}: ${error.message}`, "error");
    }
}

async function handleAnswer({ from, answer } = {}) {
    const peer = state.peers.get(from);
    if (!peer || !answer) return;
    try {
        await peer.setRemoteDescription(answer);
        await flushCandidates(from, peer);
    } catch (error) {
        showToast(`Unable to complete audio with ${userName(from)}: ${error.message}`, "error");
    }
}

async function handleCandidate({ from, candidate } = {}) {
    if (!from || !candidate) return;
    const peer = state.peers.get(from);
    if (peer?.remoteDescription) {
        await peer.addIceCandidate(candidate).catch((error) => console.warn("Unable to add ICE candidate:", error));
        return;
    }
    const candidates = state.pendingCandidates.get(from) || [];
    candidates.push(candidate);
    state.pendingCandidates.set(from, candidates);
}

async function requestCall(targetId) {
    if (!state.joined || state.pendingTarget) return;
    state.pendingTarget = targetId;
    renderUsers();
    try {
        await ensureLocalStream();
        if (!state.joined || state.pendingTarget !== targetId) {
            if (!state.currentCall) stopLocalStream();
            return;
        }
        socket.emit("call-request", targetId, (response) => {
            if (response?.ok === false) {
                state.pendingTarget = null;
                if (!state.currentCall) stopLocalStream();
                showToast(response.message || "Unable to connect to that person.", "error");
                renderUsers();
            }
        });
    } catch (error) {
        state.pendingTarget = null;
        showToast(`Microphone unavailable: ${error.message}`, "error");
        renderUsers();
    }
}

function leaveCall() {
    if (!state.currentCall) return;
    const callId = state.currentCall.id;
    playCallCue("leave");
    state.calls.delete(callId);
    state.currentCall = null;
    state.microphoneMuted = false;
    stopScreenShare(false);
    cleanupAllPeers();
    stopLocalStream();
    socket?.emit("leave-call");
    updateRoomControls();
    renderUsers();
}

function addDeviceOptions(select, devices, selectedId, fallbackName) {
    const fragment = document.createDocumentFragment();
    if (devices.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = `No ${fallbackName.toLowerCase()} found`;
        fragment.append(option);
    } else {
        devices.forEach((device, index) => {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `${fallbackName} ${index + 1}`;
            option.selected = device.deviceId === selectedId;
            fragment.append(option);
        });
    }
    select.replaceChildren(fragment);
}

async function refreshDevices() {
    const currentMicrophone = elements.microphoneSelect.value || settings.microphoneId;
    const currentSpeaker = elements.speakerSelect.value || settings.speakerId;
    const devices = await navigator.mediaDevices.enumerateDevices();
    addDeviceOptions(
        elements.microphoneSelect,
        devices.filter((device) => device.kind === "audioinput"),
        currentMicrophone,
        "Microphone",
    );
    addDeviceOptions(
        elements.speakerSelect,
        devices.filter((device) => device.kind === "audiooutput"),
        currentSpeaker,
        "Speaker",
    );
}

function setSettingsError(message = "") {
    elements.settingsError.hidden = !message;
    elements.settingsError.textContent = message;
}

async function openSettings(requireNickname = false) {
    stopMicrophoneTest();
    setSettingsError(requireNickname ? "Choose a nickname, then save." : "");
    elements.serverUrlInput.value = settings.serverUrl;
    elements.tokenInput.value = settings.token;
    elements.nicknameInput.value = settings.nickname;
    await refreshDevices().catch((error) => setSettingsError(`Unable to list devices: ${error.message}`));
    if (!elements.settingsDialog.open) elements.settingsDialog.showModal();
    if (requireNickname) elements.nicknameInput.focus();
}

function closeSettings() {
    stopMicrophoneTest();
    if (elements.settingsDialog.open) elements.settingsDialog.close();
}

function stopMicrophoneTest() {
    const test = state.microphoneTest;
    if (test) {
        cancelAnimationFrame(test.animationFrame);
        test.source.disconnect();
        test.stream.getTracks().forEach((track) => track.stop());
        test.context.close().catch(() => {});
    }
    state.microphoneTest = null;
    elements.microphoneMeter.style.width = "0%";
    elements.microphoneLevel.textContent = "0%";
    elements.microphoneTestButton.textContent = "Test Microphone";
}

async function toggleMicrophoneTest() {
    if (state.microphoneTest) {
        stopMicrophoneTest();
        return;
    }
    setSettingsError();
    let context = null;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        context = new AudioContextClass();
        await context.resume();
        const stream = await getMicrophoneStream(elements.microphoneSelect.value);
        const analyser = context.createAnalyser();
        const source = context.createMediaStreamSource(stream);
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.82;
        source.connect(analyser);
        const data = new Float32Array(analyser.fftSize);
        const test = { stream, context, source, animationFrame: 0 };
        state.microphoneTest = test;
        elements.microphoneTestButton.textContent = "Stop Test";
        const update = () => {
            if (state.microphoneTest !== test) return;
            analyser.getFloatTimeDomainData(data);
            let sumSquares = 0;
            for (const sample of data) sumSquares += sample * sample;
            const rms = Math.sqrt(sumSquares / data.length);
            const level = Math.round(Math.min(100, Math.max(0, (rms - 0.004) * 750)));
            elements.microphoneMeter.style.width = `${level}%`;
            elements.microphoneLevel.textContent = `${level}%`;
            test.animationFrame = requestAnimationFrame(update);
        };
        update();
        await refreshDevices();
    } catch (error) {
        if (!state.microphoneTest) context?.close().catch(() => {});
        stopMicrophoneTest();
        setSettingsError(`Microphone test failed: ${error.message}`);
    }
}

async function testSpeaker() {
    setSettingsError();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const destination = context.createMediaStreamDestination();
    const audio = document.createElement("audio");
    try {
        await context.resume();
        oscillator.frequency.value = 560;
        gain.gain.value = 0.12;
        oscillator.connect(gain).connect(destination);
        audio.srcObject = destination.stream;
        if (elements.speakerSelect.value && typeof audio.setSinkId === "function") {
            await audio.setSinkId(elements.speakerSelect.value);
        }
        await audio.play();
        oscillator.start();
        oscillator.stop(context.currentTime + 0.55);
        oscillator.addEventListener("ended", () => {
            audio.pause();
            audio.srcObject = null;
            context.close().catch(() => {});
        });
    } catch (error) {
        context.close().catch(() => {});
        setSettingsError(`Speaker test failed: ${error.message}`);
    }
}

function normalizeServerUrl(value) {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Use an HTTP or HTTPS URL.");
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "");
}

function saveSettingsForm(event) {
    event.preventDefault();
    setSettingsError();
    try {
        const next = {
            serverUrl: normalizeServerUrl(elements.serverUrlInput.value),
            token: elements.tokenInput.value,
            nickname: elements.nicknameInput.value.trim(),
            microphoneId: elements.microphoneSelect.value,
            speakerId: elements.speakerSelect.value,
        };
        if (!next.nickname) throw new Error("Nickname is required.");
        const reconnect = next.serverUrl !== settings.serverUrl || next.token !== settings.token;
        const rename = next.nickname !== settings.nickname;
        settings = next;
        state.shouldJoin = true;
        saveSettings();
        closeSettings();
        updateRoomControls();
        for (const audio of state.remoteAudio.values()) routeAudio(audio);
        if (reconnect) {
            state.joined = false;
            state.users = [];
            clearCallsAndMedia();
            connect();
        } else if (socket?.connected && (rename || !state.joined)) {
            sendJoin();
        }
    } catch (error) {
        setSettingsError(error.message);
    }
}

elements.settingsButton.addEventListener("click", () => openSettings());
elements.settingsClose.addEventListener("click", closeSettings);
elements.settingsCancel.addEventListener("click", closeSettings);
elements.settingsDialog.addEventListener("close", stopMicrophoneTest);
elements.settingsForm.addEventListener("submit", saveSettingsForm);
elements.microphoneTestButton.addEventListener("click", toggleMicrophoneTest);
elements.speakerTestButton.addEventListener("click", testSpeaker);
elements.screenPickerClose.addEventListener("click", () => finishScreenPicker());
elements.screenPickerCancel.addEventListener("click", () => finishScreenPicker());
elements.screenPickerDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    finishScreenPicker();
});
document.addEventListener("fullscreenchange", () => {
    document.querySelectorAll(".screen-fullscreen-button").forEach((button) => {
        const fullscreen = Boolean(document.fullscreenElement);
        button.setAttribute("aria-label", fullscreen ? "Exit fullscreen" : "Show shared screen fullscreen");
        button.title = fullscreen ? "Exit fullscreen" : "Fullscreen";
    });
});
elements.messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = elements.messageInput.value.trim();
    if (!text || !state.joined || !socket?.connected) return;
    socket.emit("message", { text });
    elements.messageInput.value = "";
    elements.messageInput.focus();
});
navigator.mediaDevices?.addEventListener("devicechange", () => {
    if (elements.settingsDialog.open) refreshDevices().catch(() => {});
});
window.addEventListener("beforeunload", () => {
    stopMicrophoneTest();
    cleanupAllPeers();
    stopScreenShare(false);
    stopLocalStream();
    if (state.joined && socket?.connected) socket.emit("leave");
    socket?.disconnect();
});

updateRoomControls();
renderUsers();
connect();
