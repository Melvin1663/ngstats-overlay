// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendSync: (event, arg) => ipcRenderer.sendSync(event, arg),
    minimize: (c) => ipcRenderer.send('minimize', c),
    exit: (c) => ipcRenderer.send('exit', c),
    onTop: (c) => ipcRenderer.send('onTop', c),
    ignoreMouse: (c) => ipcRenderer.send('ignoreMouse', c),
    onLog: (c) => ipcRenderer.on('onLog', c),
    sendLog: (...c) => ipcRenderer.send('sendLog', ...c),
    getData: (c) => ipcRenderer.send('getData', c),
    onData: (c) => ipcRenderer.on('onData', c),
    relay: (c) => ipcRenderer.send('relay', c),
    getConfirm: (c) => ipcRenderer.send('getConfirm', c),
    onConfirm: (c) => ipcRenderer.on('onConfirm', c),
    sendData: (c) => ipcRenderer.send('sendData', c),
    openBlacklist: (c) => ipcRenderer.send('openBlacklist', c),
    focusWin: (c) => ipcRenderer.send('focusWin', c),
    openPortalAPI: (c) => ipcRenderer.send('openPortalAPI', c)
})