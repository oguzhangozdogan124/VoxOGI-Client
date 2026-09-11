"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("voxogiDesktop", {
  listDesktopSources: () => ipcRenderer.invoke("voxogi:list-desktop-sources"),
  selectDesktopSource: (sourceId) => ipcRenderer.invoke("voxogi:select-desktop-source", sourceId),
  versions: Object.freeze({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  }),
});
