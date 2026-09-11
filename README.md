# VoxOGI Client 2.3.4

Electron client for the single VoxOGI chat room and private voice groups.

## How VoxOGI works

1. Set a nickname once; the app then joins the single shared room automatically.
2. Everyone in the room appears in the Users panel.
3. Click an available person to start a voice chat.
4. While you are in a voice chat, click another available person to add them.
5. If you are not in a voice chat, click a member of an existing group to join it.

A voice chat supports **2–4 people**. A full group and a person in another group
cannot be selected. Audio uses a WebRTC mesh, so each participant connects to
the other participants directly.

People in the same voice chat are displayed inside one merged group box. The
microphone and red hang-up icons are inside that box. Joining and leaving play short local sound
cues through the selected speaker. User colors are randomly assigned and kept
entirely by each client; the server does not store or transmit colors.
The microphone icon disables only the local microphone track without
disconnecting the voice chat and shows a slash while muted.
The Users grid always fills the available panel: a small number of cards expand
to use the full area, then divide into progressively smaller equal cards as
more people join.
Each person owns one equal grid unit. A merged voice group spans one unit per
participant, so a two-person call beside one available user uses a clean 2/3 +
1/3 layout instead of pushing the available user onto another row.
Usernames use container-responsive sizing: they are substantially larger in
wide cards and scale down smoothly as each additional person narrows the card.

Desktop sharing is video-only. While a screen is shared, the video occupies
the main area and the participant plates move into a compact column on the
right. The sharer's own plate says `Sharing screen`; there is no separate
overlay covering the video. Participant plates also show live speaking and
muted-microphone indicators.

Speaking detection uses an active silent Web Audio processing path, an adaptive
noise floor, and a short hold time so normal speech reliably lights the green
plate outline and animated waveform without reacting constantly to background
noise. Suspended analyser contexts resume after user interaction or when the
window becomes visible again.

Screen quality adapts to the WebRTC connection. The client adjusts bitrate,
frame rate, and downscaling from connection statistics, while retaining the
last decoded frame during short stalls so the layout does not collapse or
flash black. Fullscreen keeps the participant plates and call controls visible.
Participant plates become compact 50-pixel rows during sharing so the shared
screen receives nearly all available space.

Stopping a share is announced explicitly through the server as well as WebRTC
renegotiation, so receivers remove a stale video stage immediately. Voice-call
start/end and incoming text messages use distinct reusable WAV notifications;
ordinary room joins and leaves are silent. Electron autoplay, speaker-selection
permission, media readiness, default-device routing, and a Web Audio fallback
improve notification compatibility across Windows computers. Remote audio is
checked periodically and ICE is restarted automatically after a stalled or
failed peer connection.

## Connection

```text
Server:    http://""/vc
Namespace: /vc
Path:      /s.io
```

The server must be upgraded to VoxOGI Server 2.1.1 for group calls, remote
mute-state indicators, and immediate screen-share stop notifications. Earlier
servers cannot provide all of these state updates.

## Run the client

```bash
npm install
npm start
```

## Validate

```bash
npm run check
```

## Build the Windows installer

Run on Windows:

```powershell
npm install
npm run dist
```

The installer is created at:

```text
dist/VoxOGI-Setup-2.3.4.exe
```

If electron-builder reports a symbolic-link privilege error, enable Windows
Developer Mode or run the terminal as Administrator, clear
`%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`, and build again.

## Audio devices

Settings includes microphone selection, a live microphone level meter, speaker
selection, and a speaker test tone. Changing the selected speaker reroutes all
active remote audio elements.

## Network note

The client uses Google's public STUN service. Some restricted or symmetric-NAT
networks require a TURN server; TURN credentials can be added to
`RTC_CONFIGURATION` in `renderer.js`.
