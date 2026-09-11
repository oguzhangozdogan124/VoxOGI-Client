"use strict";

const STORAGE_KEY = "voxogi-client-v2-settings";
const SOCKET_PATH = "/s.io";
const MAX_CALL_USERS = 4;
<<<<<<< HEAD
const MAX_CHAT_LINES = 250;
const DEFAULT_SETTINGS = Object.freeze({
  serverUrl: "http://194.146.47.44:56964/vc",
  token: "",
  nickname: "",
  microphoneId: "",
  speakerId: "",
});
const RTC_CONFIGURATION = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
const SCREEN_QUALITY_PROFILES = Object.freeze({
  low: { maxBitrate: 450_000, maxFramerate: 12, scaleResolutionDownBy: 2 },
  medium: { maxBitrate: 1_200_000, maxFramerate: 20, scaleResolutionDownBy: 1.5 },
  high: { maxBitrate: 3_000_000, maxFramerate: 30, scaleResolutionDownBy: 1 },
});

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
=======
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
>>>>>>> origin/main
}

let settings = loadSettings();
let socket = null;

const state = {
<<<<<<< HEAD
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
  peerRecoveryTimers: new Map(),
  remoteAudio: new Map(),
  remoteScreens: new Map(),
  screenStages: new Map(),
  localScreenStream: null,
  screenShareStarting: false,
  screenPickerResolve: null,
  screenQualityTimer: null,
  screenQualityLevels: new Map(),
  mutedUsers: new Set(),
  speakingUsers: new Set(),
  audioMonitors: new Map(),
  audioHealthTimer: null,
  cuePlayers: new Map(),
  fallbackCueContext: null,
  pendingCue: null,
  lastChatCueAt: 0,
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
    names: rawCall.users.map(
      (userId, index) => rawCall.names?.[index] || userName(userId),
    ),
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
    const hue = window.crypto?.getRandomValues
      ? window.crypto.getRandomValues(values)[0] % 360
      : Math.floor(Math.random() * 360);
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
  const connected = [...state.peers.values()].filter(
    (peer) => peer.connectionState === "connected",
  ).length;
  const expected = Math.max(0, state.currentCall.users.length - 1);
  const status = [...elements.usersList.querySelectorAll(".voice-group-card")]
    .find((card) => card.dataset.callId === state.currentCall.id)
    ?.querySelector(".voice-group-status");
  if (!status) return;
  status.textContent =
    connected === expected && expected > 0
      ? "Audio connected"
      : `Audio ${connected}/${expected}`;
}

function activeScreenShare(call) {
  if (!call) return null;
  if (state.localScreenStream?.getVideoTracks().some((track) => track.readyState === "live")) {
    return { ownerId: socket?.id, stream: state.localScreenStream, local: true };
  }
  for (const userId of call.users) {
    const stream = state.remoteScreens.get(userId);
    if (stream?.getVideoTracks().some((track) => track.readyState === "live")) {
      return { ownerId: userId, stream, local: false };
    }
  }
  return null;
}

function isUserMuted(userId) {
  return userId === socket?.id ? state.microphoneMuted : state.mutedUsers.has(userId);
}

function updateParticipantMediaState(userId) {
  for (const member of document.querySelectorAll(".voice-member")) {
    if (member.dataset.userId !== userId) continue;
    const speaking = state.speakingUsers.has(userId) && !isUserMuted(userId);
    member.classList.toggle("is-speaking", speaking);
    const speakingIndicator = member.querySelector(".speaking-indicator");
    const mutedIndicator = member.querySelector(".muted-indicator");
    if (speakingIndicator) speakingIndicator.hidden = !speaking;
    if (mutedIndicator) mutedIndicator.hidden = !isUserMuted(userId);
  }
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

  const fullscreenCard = document.fullscreenElement?.classList.contains("voice-group-card")
    ? document.fullscreenElement
    : null;
  if (fullscreenCard) {
    const replacement = [...fragment.querySelectorAll(".voice-group-card")]
      .find((card) => card.dataset.callId === fullscreenCard.dataset.callId);
    if (!replacement?.classList.contains("is-screen-sharing")) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    fullscreenCard.className = replacement.className;
    fullscreenCard.replaceChildren(...replacement.childNodes);
  } else {
    elements.usersList.replaceChildren(fragment);
  }
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
  status.textContent = localIsMember
    ? "Connecting audio…"
    : state.currentCall
      ? "You are in another call"
      : call.users.length >= call.maxUsers
        ? "Call is full"
        : "Click a member to join";
  header.append(title, status);

  members.className = "voice-group-members";
  call.users.forEach((userId, index) => {
    const member = document.createElement("button");
    const name = document.createElement("span");
    const action = document.createElement("span");
    const indicators = document.createElement("span");
    const speakingIndicator = document.createElement("span");
    const mutedIndicator = document.createElement("span");
    const liveName = userName(userId);
    const memberName = liveName === "Unknown" ? call.names[index] || liveName : liveName;

    member.type = "button";
    member.className = `voice-member${state.speakingUsers.has(userId) ? " is-speaking" : ""}`;
    member.dataset.userId = userId;
    member.disabled = !canJoin;
    member.style.setProperty("--user-color", colorForUser(userId));
    name.className = "user-name";
    name.textContent = memberName;
    action.className = "user-action";
    action.textContent = screenShare?.ownerId === userId
      ? "Sharing screen"
      : userId === socket?.id
        ? "You"
      : localIsMember
        ? "In your call"
        : canJoin
          ? "Join"
          : "In voice chat";
    indicators.className = "member-indicators";
    speakingIndicator.className = "speaking-indicator";
    speakingIndicator.title = "Speaking";
    speakingIndicator.setAttribute("aria-label", "Speaking");
    speakingIndicator.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h2v6H4V9Zm4-4h2v14H8V5Zm4 3h2v8h-2V8Zm4-5h2v18h-2V3Zm4 7h2v4h-2v-4Z"/></svg>';
    speakingIndicator.hidden = !state.speakingUsers.has(userId);
    mutedIndicator.className = "muted-indicator";
    mutedIndicator.title = "Microphone muted";
    mutedIndicator.setAttribute("aria-label", "Microphone muted");
    mutedIndicator.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m19 11-1.7 0c0 .74-.16 1.43-.44 2.05l1.28 1.28A6.7 6.7 0 0 0 19 11ZM4.27 3 3 4.27l6.01 6V11a3 3 0 0 0 4.72 2.45l1.66 1.66A5.58 5.58 0 0 1 12 16.1 5.1 5.1 0 0 1 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21H8v2h8v-2h-3v-3.28a7.2 7.2 0 0 0 3.6-1.31L19.73 19 21 17.73 4.27 3ZM15 10.73V5a3 3 0 0 0-5.84-.98L15 9.86v.87Z"/></svg>';
    mutedIndicator.hidden = !isUserMuted(userId);
    indicators.append(speakingIndicator, mutedIndicator);
    if (canJoin) member.addEventListener("click", () => requestCall(userId));
    member.append(indicators, name, action);
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
    shareButton.title = localIsSharing
      ? "Stop sharing screen"
      : screenShare
        ? "Screen sharing is already active"
        : "Share screen";
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
    const stage = getScreenShareStage(screenShare);
    card.append(header, stage, members, footer);
  } else {
    card.append(header, members, footer);
  }
  item.append(card);
  return item;
}

function showScreenFallback(stage) {
  const canvas = stage.querySelector(".screen-share-buffer");
  if (canvas?.width && canvas?.height) canvas.hidden = false;
}

function bindScreenStage(stage, screenShare) {
  const video = stage.querySelector(".screen-share-video");
  const canvas = stage.querySelector(".screen-share-buffer");
  const track = screenShare.stream.getVideoTracks()[0];
  if (!video || !canvas || !track) return;

  if (stage._track !== track) {
    if (stage._track) {
      stage._track.removeEventListener("mute", stage._onTrackMute);
      stage._track.removeEventListener("unmute", stage._onTrackUnmute);
    }
    stage._track = track;
    stage._onTrackMute = () => showScreenFallback(stage);
    stage._onTrackUnmute = () => video.play().catch(() => {});
    track.addEventListener("mute", stage._onTrackMute);
    track.addEventListener("unmute", stage._onTrackUnmute);
  }
  video.muted = screenShare.local;
  if (video.srcObject !== screenShare.stream) {
    showScreenFallback(stage);
    video.srcObject = screenShare.stream;
  }
  video.play().catch(() => {});

  if (!stage._snapshotTimer) {
    stage._lastVideoTime = -1;
    stage._snapshotTimer = window.setInterval(() => {
      const activeTrack = stage._track;
      if (!stage.isConnected && activeTrack?.readyState === "ended") {
        window.clearInterval(stage._snapshotTimer);
        stage._snapshotTimer = null;
        return;
      }
      if (
        activeTrack?.readyState !== "live" ||
        activeTrack.muted ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth ||
        video.currentTime === stage._lastVideoTime
      ) return;
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      canvas.getContext("2d", { alpha: false })?.drawImage(video, 0, 0);
      stage._lastVideoTime = video.currentTime;
      canvas.hidden = true;
    }, 350);
  }
}

function getScreenShareStage(screenShare) {
  let stage = state.screenStages.get(screenShare.ownerId);
  if (!stage) {
    stage = document.createElement("div");
    const video = document.createElement("video");
    const buffer = document.createElement("canvas");
    const fullscreenButton = document.createElement("button");
    stage.className = "screen-share-stage";
    stage.dataset.ownerId = screenShare.ownerId;
    video.className = "screen-share-video";
    video.autoplay = true;
    video.playsInline = true;
    buffer.className = "screen-share-buffer";
    buffer.hidden = true;
    fullscreenButton.type = "button";
    fullscreenButton.className = "screen-fullscreen-button";
    fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3Zm-2-4h2V7h3V5H5v5Zm12 7h-3v2h5v-5h-2v3Zm-3-12v2h3v3h2V5h-5Z"/></svg>';
    fullscreenButton.setAttribute("aria-label", "Show shared screen fullscreen");
    fullscreenButton.title = "Fullscreen";
    fullscreenButton.addEventListener("click", () => {
      const card = stage.closest(".voice-group-card");
      if (card) toggleCallFullscreen(card);
    });
    video.addEventListener("waiting", () => showScreenFallback(stage));
    video.addEventListener("stalled", () => showScreenFallback(stage));
    video.addEventListener("emptied", () => showScreenFallback(stage));
    stage.append(video, buffer, fullscreenButton);
    state.screenStages.set(screenShare.ownerId, stage);
  }
  bindScreenStage(stage, screenShare);
  return stage;
}

function destroyScreenStage(userId) {
  const stage = state.screenStages.get(userId);
  if (!stage) return;
  if (stage._snapshotTimer) window.clearInterval(stage._snapshotTimer);
  if (stage._track) {
    stage._track.removeEventListener("mute", stage._onTrackMute);
    stage._track.removeEventListener("unmute", stage._onTrackUnmute);
  }
  const video = stage.querySelector("video");
  if (video) video.srcObject = null;
  stage.remove();
  state.screenStages.delete(userId);
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
  while (elements.messages.childElementCount > MAX_CHAT_LINES) {
    elements.messages.firstElementChild?.remove();
  }
  elements.messages.scrollTop = elements.messages.scrollHeight;
  return { senderName, system: senderName === "System", text };
}

function clearCallsAndMedia() {
  stopScreenShare(false);
  state.calls.clear();
  state.currentCall = null;
  state.pendingTarget = null;
  state.microphoneMuted = false;
  state.mutedUsers.clear();
  state.speakingUsers.clear();
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
    if (!state.shouldJoin) return;
    const received = appendMessage(message);
    if (received && !received.system && received.senderName !== settings.nickname) {
      playChatCue();
    }
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
  socket.on("screen-share-state", ({ userId, active } = {}) => {
    if (!userId || active !== false) return;
    clearRemoteScreen(userId);
  });
  socket.on("media-state", ({ userId, microphoneMuted } = {}) => {
    if (!userId) return;
    if (microphoneMuted) state.mutedUsers.add(userId);
    else state.mutedUsers.delete(userId);
    if (microphoneMuted) setUserSpeaking(userId, false);
    updateParticipantMediaState(userId);
  });
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
  const audio = deviceId
    ? { deviceId: { exact: deviceId }, echoCancellation: true, noiseSuppression: true }
    : { echoCancellation: true, noiseSuppression: true };
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
  if (socket?.id) stopAudioMonitor(socket.id);
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
  if (state.microphoneMuted) {
    state.mutedUsers.add(socket.id);
    setUserSpeaking(socket.id, false);
  } else {
    state.mutedUsers.delete(socket.id);
  }
  socket?.emit("media-state", { microphoneMuted: state.microphoneMuted });
  updateParticipantMediaState(socket.id);
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
    track.contentHint = "detail";
    await track.applyConstraints({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 30 },
    }).catch(() => {});
    state.localScreenStream = stream;
    track.addEventListener("ended", () => stopScreenShare());
    socket?.emit("screen-share-state", { active: true });
    for (const peer of state.peers.values()) peer.addTrack(track, stream);
    renderUsers();
    await Promise.all([...state.peers.keys()].map((remoteId) => startOffer(remoteId)));
    startScreenQualityMonitor();
  } catch (error) {
    if (error.name !== "NotAllowedError") showToast(`Screen sharing failed: ${error.message}`, "error");
  } finally {
    state.screenShareStarting = false;
    renderUsers();
  }
}

function stopScreenShare(renegotiate = true) {
  const stream = state.localScreenStream;
  if (!stream) {
    if (renegotiate) socket?.emit("screen-share-state", { active: false });
    return;
  }
  state.localScreenStream = null;
  if (renegotiate) socket?.emit("screen-share-state", { active: false });
  stopScreenQualityMonitor();
  destroyScreenStage(socket?.id);
  const tracks = new Set(stream.getVideoTracks());
  for (const [remoteId, peer] of state.peers) {
    const videoSenders = peer.getSenders().filter((sender) => sender.track && tracks.has(sender.track));
    for (const sender of videoSenders) {
      sender.replaceTrack(null).catch(() => {});
      peer.removeTrack(sender);
    }
    if (renegotiate && peer.signalingState === "stable") startOffer(remoteId).catch(() => {});
  }
  stream.getTracks().forEach((track) => track.stop());
  if (renegotiate) renderUsers();
}

function screenQualityFromStats(stats) {
  let availableBitrate = Infinity;
  let roundTripTime = 0;
  let fractionLost = 0;
  let bandwidthLimited = false;
  for (const report of stats.values()) {
    if (report.type === "candidate-pair" && report.state === "succeeded" && report.availableOutgoingBitrate) {
      availableBitrate = Math.min(availableBitrate, report.availableOutgoingBitrate);
      roundTripTime = Math.max(roundTripTime, report.currentRoundTripTime || 0);
    }
    if (report.type === "remote-inbound-rtp" && report.kind === "video") {
      fractionLost = Math.max(fractionLost, report.fractionLost || 0);
      roundTripTime = Math.max(roundTripTime, report.roundTripTime || 0);
    }
    if (report.type === "outbound-rtp" && report.kind === "video") {
      bandwidthLimited ||= report.qualityLimitationReason === "bandwidth";
    }
  }
  const effectiveType = navigator.connection?.effectiveType || "";
  if (
    effectiveType.includes("2g") ||
    availableBitrate < 650_000 ||
    roundTripTime > .55 ||
    fractionLost > .08
  ) return "low";
  if (
    effectiveType === "3g" ||
    bandwidthLimited ||
    availableBitrate < 1_800_000 ||
    roundTripTime > .25 ||
    fractionLost > .03
  ) return "medium";
  return "high";
}

async function updateScreenSenderQuality(remoteId, peer) {
  const sender = peer.getSenders().find((item) => item.track?.kind === "video");
  if (!sender) return;
  const quality = screenQualityFromStats(await peer.getStats(sender.track));
  if (state.screenQualityLevels.get(remoteId) === quality) return;
  const parameters = sender.getParameters();
  if (!parameters.encodings?.length) return;
  Object.assign(parameters.encodings[0], SCREEN_QUALITY_PROFILES[quality]);
  parameters.degradationPreference = "balanced";
  await sender.setParameters(parameters);
  state.screenQualityLevels.set(remoteId, quality);
}

async function updateScreenShareQuality() {
  if (!state.localScreenStream) return;
  await Promise.all([...state.peers].map(([remoteId, peer]) =>
    updateScreenSenderQuality(remoteId, peer).catch((error) =>
      console.warn("Unable to adapt screen quality:", error),
    ),
  ));
}

function startScreenQualityMonitor() {
  stopScreenQualityMonitor();
  updateScreenShareQuality();
  state.screenQualityTimer = window.setInterval(updateScreenShareQuality, 3500);
}

function stopScreenQualityMonitor() {
  if (state.screenQualityTimer) window.clearInterval(state.screenQualityTimer);
  state.screenQualityTimer = null;
  state.screenQualityLevels.clear();
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
  const removed = state.remoteScreens.delete(remoteId);
  const hadStage = state.screenStages.has(remoteId);
  destroyScreenStage(remoteId);
  if ((!removed && !hadStage) || !rerender) return;
  const fullscreenCall = document.fullscreenElement?.classList.contains("voice-group-card");
  if (fullscreenCall) {
    document.exitFullscreen().then(renderUsers, renderUsers);
  } else {
    renderUsers();
  }
}

async function routeAudio(audio) {
  if (settings.speakerId && typeof audio.setSinkId === "function") {
    try {
      await audio.setSinkId(settings.speakerId);
    } catch (error) {
      console.warn("Unable to select speaker:", error);
      await audio.setSinkId("default").catch(() => {});
    }
  }
}

function createToneWavUrl(startFrequency, endFrequency, duration, volume) {
  const sampleRate = 44_100;
  const sampleCount = Math.ceil(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  const writeText = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  let phase = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const progress = index / Math.max(1, sampleCount - 1);
    const frequency = startFrequency + (endFrequency - startFrequency) * progress;
    phase += 2 * Math.PI * frequency / sampleRate;
    const attack = Math.min(1, time / .018);
    const release = Math.min(1, (duration - time) / .065);
    const envelope = Math.max(0, attack * release);
    view.setInt16(44 + index * 2, Math.round(Math.sin(phase) * envelope * volume * 32767), true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function cueConfiguration(type) {
  if (type === "join") return { start: 390, end: 690, duration: .36, volume: .48 };
  if (type === "leave") return { start: 570, end: 310, duration: .36, volume: .48 };
  return { start: 720, end: 980, duration: .18, volume: .42 };
}

function cuePlayer(type) {
  if (state.cuePlayers.has(type)) return state.cuePlayers.get(type);
  const cue = cueConfiguration(type);
  const url = createToneWavUrl(cue.start, cue.end, cue.duration, cue.volume);
  const audio = document.createElement("audio");
  audio.preload = "auto";
  audio.autoplay = false;
  audio.muted = false;
  audio.volume = 1;
  audio.src = url;
  elements.remoteAudioContainer.append(audio);
  const ready = new Promise((resolve) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      resolve();
      return;
    }
    const finish = () => resolve();
    audio.addEventListener("canplaythrough", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    window.setTimeout(finish, 1200);
  });
  audio.load();
  const player = { audio, ready, url };
  state.cuePlayers.set(type, player);
  return player;
}

async function playFallbackCue(type) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("No fallback audio engine is available.");
  if (!state.fallbackCueContext || state.fallbackCueContext.state === "closed") {
    state.fallbackCueContext = new AudioContextClass();
  }
  const context = state.fallbackCueContext;
  await context.resume();
  const cue = cueConfiguration(type);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(cue.start, now);
  oscillator.frequency.exponentialRampToValueAtTime(cue.end, now + cue.duration * .75);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(cue.volume, now + .018);
  gain.gain.exponentialRampToValueAtTime(.0001, now + cue.duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + cue.duration + .02);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
}

async function playCue(type) {
  const player = cuePlayer(type);
  try {
    await routeAudio(player.audio);
    await player.ready;
    player.audio.pause();
    player.audio.currentTime = 0;
    await player.audio.play();
    state.pendingCue = null;
  } catch (error) {
    console.warn(`Unable to play ${type} notification:`, error);
    try {
      await playFallbackCue(type);
      state.pendingCue = null;
    } catch (fallbackError) {
      state.pendingCue = type;
      console.warn(`Unable to play ${type} fallback notification:`, fallbackError);
    }
  }
}

function playCallCue(type) {
  playCue(type).catch(() => {});
}

function playChatCue() {
  const now = performance.now();
  if (now - state.lastChatCueAt < 250) return;
  state.lastChatCueAt = now;
  playCue("message").catch(() => {});
}

function stopCueOutput() {
  for (const { audio, url } of state.cuePlayers.values()) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.remove();
    URL.revokeObjectURL(url);
  }
  state.cuePlayers.clear();
  if (state.fallbackCueContext) state.fallbackCueContext.close().catch(() => {});
  state.fallbackCueContext = null;
  state.pendingCue = null;
}

function setUserSpeaking(userId, speaking) {
  const next = speaking && !isUserMuted(userId);
  const previous = state.speakingUsers.has(userId);
  if (next === previous) return;
  if (next) state.speakingUsers.add(userId);
  else state.speakingUsers.delete(userId);
  updateParticipantMediaState(userId);
}

function stopAudioMonitor(userId) {
  const monitor = state.audioMonitors.get(userId);
  if (!monitor) return;
  cancelAnimationFrame(monitor.animationFrame);
  monitor.source.disconnect();
  monitor.analyser.disconnect();
  monitor.silentGain.disconnect();
  monitor.context.close().catch(() => {});
  state.audioMonitors.delete(userId);
  setUserSpeaking(userId, false);
}

function resumeAudioProcessing() {
  for (const monitor of state.audioMonitors.values()) {
    if (monitor.context.state === "suspended") monitor.context.resume().catch(() => {});
  }
  if (state.fallbackCueContext?.state === "suspended") {
    state.fallbackCueContext.resume().catch(() => {});
  }
  if (state.pendingCue) playCue(state.pendingCue).catch(() => {});
}

function startAudioMonitor(userId, track) {
  stopAudioMonitor(userId);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || !track) return;
  const context = new AudioContextClass();
  const analyser = context.createAnalyser();
  const silentGain = context.createGain();
  const source = context.createMediaStreamSource(new MediaStream([track]));
  const samples = new Float32Array(1024);
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = .58;
  silentGain.gain.value = 0;
  source.connect(analyser);
  analyser.connect(silentGain).connect(context.destination);
  const monitor = {
    context,
    analyser,
    silentGain,
    source,
    animationFrame: 0,
    noiseFloor: .0025,
    quietFrames: 20,
    speechFrames: 0,
  };
  state.audioMonitors.set(userId, monitor);
  context.resume().catch(() => {});
  const update = () => {
    if (state.audioMonitors.get(userId) !== monitor) return;
    analyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const sample of samples) sum += sample * sample;
    const rms = Math.sqrt(sum / samples.length);
    const threshold = Math.max(.005, Math.min(.025, monitor.noiseFloor * 2.35));
    const loud = rms > threshold && !isUserMuted(userId) && track.enabled && !track.muted;
    if (!loud && rms < threshold * 1.15) {
      monitor.noiseFloor = monitor.noiseFloor * .985 + Math.max(.0005, rms) * .015;
    }
    monitor.speechFrames = loud ? Math.min(4, monitor.speechFrames + 1) : Math.max(0, monitor.speechFrames - 1);
    monitor.quietFrames = loud ? 0 : monitor.quietFrames + 1;
    setUserSpeaking(userId, monitor.speechFrames >= 2 || (state.speakingUsers.has(userId) && monitor.quietFrames < 14));
    monitor.animationFrame = requestAnimationFrame(update);
  };
  update();
  track.addEventListener("ended", () => stopAudioMonitor(userId), { once: true });
}

function cleanupPeer(remoteId) {
  clearPeerRecovery(remoteId);
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
  stopAudioMonitor(remoteId);
  clearRemoteScreen(remoteId, false);
  updateCallConnectionState();
}

function clearPeerRecovery(remoteId) {
  const timer = state.peerRecoveryTimers.get(remoteId);
  if (timer) window.clearTimeout(timer);
  state.peerRecoveryTimers.delete(remoteId);
}

function schedulePeerRecovery(remoteId, urgent = false, force = false) {
  if (state.peerRecoveryTimers.has(remoteId) || !state.currentCall?.users.includes(remoteId)) return;
  const primary = socket?.id?.localeCompare(remoteId) < 0;
  const delay = urgent ? (primary ? 500 : 2200) : (primary ? 2200 : 4500);
  const timer = window.setTimeout(async () => {
    state.peerRecoveryTimers.delete(remoteId);
    if (!state.currentCall?.users.includes(remoteId)) return;
    const peer = state.peers.get(remoteId);
    if (peer?.connectionState === "connected" && !force) return;
    if (peer?.connectionState === "connected" && force) {
      const audio = state.remoteAudio.get(remoteId);
      const tracks = audio?.srcObject?.getAudioTracks?.() || [];
      if (tracks.some((track) => track.readyState === "live" && !track.muted)) return;
    }
    try {
      if (!peer || peer.connectionState === "failed" || peer.connectionState === "closed") {
        cleanupPeer(remoteId);
        await startOffer(remoteId);
      } else {
        peer.restartIce();
        await startOffer(remoteId, { iceRestart: true });
      }
    } catch (error) {
      console.warn(`Unable to recover audio with ${remoteId}:`, error);
    }
    const current = state.peers.get(remoteId);
    if (current && current.connectionState !== "connected") schedulePeerRecovery(remoteId, true);
  }, delay);
  state.peerRecoveryTimers.set(remoteId, timer);
}

function ensureRemoteAudioPlayback() {
  for (const [remoteId, audio] of state.remoteAudio) {
    const tracks = audio.srcObject?.getAudioTracks?.() || [];
    if (tracks.some((track) => track.readyState === "live")) {
      if (audio.paused) audio.play().catch(() => {});
      if (tracks.every((track) => track.muted)) schedulePeerRecovery(remoteId, false, true);
    } else if (state.currentCall?.users.includes(remoteId)) {
      schedulePeerRecovery(remoteId, true);
    }
  }
}

function cleanupAllPeers() {
  for (const remoteId of [...state.peers.keys()]) cleanupPeer(remoteId);
  state.peerPromises.clear();
  state.makingOffers.clear();
  state.pendingCandidates.clear();
  for (const userId of [...state.audioMonitors.keys()]) stopAudioMonitor(userId);
  state.remoteScreens.clear();
  for (const userId of [...state.screenStages.keys()]) destroyScreenStage(userId);
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
      updateScreenSenderQuality(remoteId, peer).catch(() => {});
    }

    peer.addEventListener("icecandidate", ({ candidate }) => {
      if (candidate && socket?.connected) {
        socket.emit("ice-candidate", { target: remoteId, candidate });
      }
    });
    peer.addEventListener("track", async ({ track, streams }) => {
      if (track.kind === "video") {
        const remoteStream = streams[0] || new MediaStream([track]);
        const hadScreen = state.remoteScreens.has(remoteId);
        state.remoteScreens.set(remoteId, remoteStream);
        track.addEventListener("ended", () => {
          const currentTrack = state.remoteScreens.get(remoteId)?.getVideoTracks()[0];
          if (currentTrack === track) clearRemoteScreen(remoteId);
        });
        if (hadScreen && state.screenStages.has(remoteId)) {
          bindScreenStage(state.screenStages.get(remoteId), {
            ownerId: remoteId,
            stream: remoteStream,
            local: false,
          });
        } else {
          renderUsers();
        }
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
      audio.playsInline = true;
      startAudioMonitor(remoteId, track);
      await routeAudio(audio);
      await audio.play().catch(() => {});
      track.addEventListener("mute", () => schedulePeerRecovery(remoteId, false, true));
      track.addEventListener("unmute", () => {
        clearPeerRecovery(remoteId);
        audio.play().catch(() => {});
      });
    });
    peer.addEventListener("connectionstatechange", () => {
      updateCallConnectionState();
      if (peer.connectionState === "connected") {
        clearPeerRecovery(remoteId);
        state.remoteAudio.get(remoteId)?.play().catch(() => {});
      } else if (peer.connectionState === "disconnected") {
        schedulePeerRecovery(remoteId);
      } else if (peer.connectionState === "failed") {
        schedulePeerRecovery(remoteId, true);
      }
    });
    peer.addEventListener("iceconnectionstatechange", () => {
      if (["connected", "completed"].includes(peer.iceConnectionState)) clearPeerRecovery(remoteId);
      else if (peer.iceConnectionState === "disconnected") schedulePeerRecovery(remoteId);
      else if (peer.iceConnectionState === "failed") schedulePeerRecovery(remoteId, true);
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

async function startOffer(remoteId, { iceRestart = false } = {}) {
  if (state.makingOffers.has(remoteId)) return;
  state.makingOffers.add(remoteId);
  try {
    const peer = await ensurePeer(remoteId);
    if (peer.signalingState !== "stable") return;
    const offer = await peer.createOffer(iceRestart ? { iceRestart: true } : undefined);
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
  const stream = await ensureLocalStream();
  startAudioMonitor(socket.id, stream.getAudioTracks()[0]);
  await Promise.all(
    [...remoteIds]
      .filter((remoteId) => socket.id.localeCompare(remoteId) < 0)
      .map((remoteId) => startOffer(remoteId)),
  );
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
    state.mutedUsers.clear();
    state.speakingUsers.clear();
    cleanupAllPeers();
    stopLocalStream();
    playCallCue("leave");
  }

  if (call.users.includes(socket.id)) {
    state.currentCall = call;
    const joinedCall = previousCurrent?.id !== call.id;
    const memberDelta = previousCurrent?.id === call.id
      ? call.users.length - previousCurrent.users.length
      : 0;
    if (joinedCall || memberDelta > 0) playCallCue("join");
    else if (memberDelta < 0) playCallCue("leave");
    updateRoomControls();
    renderUsers();
    socket.emit("media-state", { microphoneMuted: state.microphoneMuted });
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
    state.mutedUsers.clear();
    state.speakingUsers.clear();
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
    await peer.addIceCandidate(candidate).catch((error) =>
      console.warn("Unable to add ICE candidate:", error),
    );
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
  state.mutedUsers.clear();
  state.speakingUsers.clear();
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
  addDeviceOptions(elements.microphoneSelect, devices.filter((device) => device.kind === "audioinput"), currentMicrophone, "Microphone");
  addDeviceOptions(elements.speakerSelect, devices.filter((device) => device.kind === "audiooutput"), currentSpeaker, "Speaker");
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
    analyser.smoothingTimeConstant = .82;
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
      const level = Math.round(Math.min(100, Math.max(0, (rms - .004) * 750)));
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
    gain.gain.value = .12;
    oscillator.connect(gain).connect(destination);
    audio.srcObject = destination.stream;
    if (elements.speakerSelect.value && typeof audio.setSinkId === "function") {
      await audio.setSinkId(elements.speakerSelect.value);
    }
    await audio.play();
    oscillator.start();
    oscillator.stop(context.currentTime + .55);
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
=======
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
>>>>>>> origin/main
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
<<<<<<< HEAD
  event.preventDefault();
  finishScreenPicker();
});
document.addEventListener("fullscreenchange", () => {
  document.querySelectorAll(".screen-fullscreen-button").forEach((button) => {
    const fullscreen = Boolean(document.fullscreenElement);
    button.setAttribute("aria-label", fullscreen ? "Exit fullscreen" : "Show shared screen fullscreen");
    button.title = fullscreen ? "Exit fullscreen" : "Fullscreen";
  });
  if (!document.fullscreenElement) renderUsers();
});
document.addEventListener("pointerdown", resumeAudioProcessing, true);
document.addEventListener("keydown", resumeAudioProcessing, true);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeAudioProcessing();
});
state.audioHealthTimer = window.setInterval(ensureRemoteAudioPlayback, 4000);
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
  if (state.audioHealthTimer) window.clearInterval(state.audioHealthTimer);
  stopCueOutput();
  stopMicrophoneTest();
  cleanupAllPeers();
  stopScreenShare(false);
  stopLocalStream();
  if (state.joined && socket?.connected) socket.emit("leave");
  socket?.disconnect();
=======
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
>>>>>>> origin/main
});

updateRoomControls();
renderUsers();
connect();
