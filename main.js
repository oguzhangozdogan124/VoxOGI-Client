"use strict";

const path = require("node:path");
const { app, BrowserWindow, desktopCapturer, ipcMain, session } = require("electron");

const PARTITION = "persist:voxogi-client-v2";
let selectedDesktopSourceId = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 880,
    minHeight: 620,
    show: false,
    backgroundColor: "#0b1020",
    icon: path.join(__dirname, "chat_logo.png"),
    title: "VoxOGI",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      partition: PARTITION,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.loadFile("index.html");
}

app.whenReady().then(() => {
  const clientSession = session.fromPartition(PARTITION);

  ipcMain.handle("voxogi:list-desktop-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      icon: source.appIcon?.toDataURL() || "",
    }));
  });
  ipcMain.handle("voxogi:select-desktop-source", (_event, sourceId) => {
    selectedDesktopSourceId = String(sourceId || "");
    return Boolean(selectedDesktopSourceId);
  });

  clientSession.setDisplayMediaRequestHandler(async (_request, callback) => {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 0, height: 0 },
    });
    const source = sources.find((item) => item.id === selectedDesktopSourceId);
    selectedDesktopSourceId = null;
    callback(source ? { video: source } : {});
  });

  clientSession.setPermissionCheckHandler((_webContents, permission) =>
    permission === "media" || permission === "fullscreen",
  );
  clientSession.setPermissionRequestHandler(
    (_webContents, permission, callback) =>
      callback(permission === "media" || permission === "fullscreen"),
  );

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
