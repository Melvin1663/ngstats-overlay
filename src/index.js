const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const logger = require('electron-log')
const fs = require('fs');
const path = require('path');
const killPort = require('./resources/assets/scripts/killPort');
const detectVersion = require('./resources/assets/scripts/detectVersion');
const simplyVer = require('./resources/assets/scripts/versionSimplify');
const fetchPlayer = require('./resources/assets/scripts/fetchPlayer');
const userDataPath = app.getPath('userData');
const optsPath = path.join(userDataPath, 'options.json');
const authPath = path.join(userDataPath, 'minecraft');
const blackListPath = path.join(userDataPath, 'blacklist.txt');
const versionKeys = require('./resources/assets/jsondb/versionKeys.json');
const compareArray = require('./resources/assets/scripts/compareArray');
const parseTxt = require('./resources/assets/scripts/parseTxt');
const mcColors = require('./resources/assets/jsondb/mcColors.json');
const smufFunc = require('./resources/assets/scripts/smurf');
const pjson = require('../package.json');
const dialogKeys = {};
const defaultOptionsJSON = {
  region: "auto",
  ip: "play.nethergames.org",
  port: 19132,
  relayIp: "127.0.0.1",
  relayPort: 19131,
  // autoStart: false,
  autoMin: false,
  winOpacity: 100,
  winOnTop: false,
  apiKey: '',
  ignoreMouse: false
};

let options;
let blacklists;
let child;

console.error = logger.error
console.warn = logger.warn
console.info = logger.info
console.verbose = logger.verbose
console.debug = logger.debug
console.silly = logger.silly

logger.transports.file.resolvePathFn = () => userDataPath + `/logs/${(new Date().toLocaleDateString()).replaceAll('/', '_')}.log`;

logger.errorHandler.startCatching({
  showDialog: true,
  onError({ error, processType, versions }) {
    if (options.winOnTop) mainWindow.setAlwaysOnTop(false, 'screen-saver');

    dialog.showMessageBox({
      title: 'An error occurred',
      message: error.message,
      detail: error.stack,
      type: 'error',
      buttons: ['Ignore', 'Exit'],
    }).then((result) => {
      if (result.response === 0 && options?.winOnTop) mainWindow.setAlwaysOnTop(true, 'screen-saver');


      if (result.response === 1) app.quit();
    });
  }
})

if (!fs.existsSync(optsPath)) {
  fs.writeFileSync(optsPath, JSON.stringify(defaultOptionsJSON))
  options = defaultOptionsJSON;
} else options = JSON.parse(fs.readFileSync(optsPath).toString());

let blackListStartText = '# Enter a list of players you want to blacklist (highlights them in the table)\n# Separate the players with a new line\nExamplePlayer123\nExamplePlayer234';

if (!fs.existsSync(blackListPath)) {
  fs.writeFileSync(blackListPath, blackListStartText);
  blacklists = parseTxt(blackListStartText);
} else blacklists = parseTxt(fs.readFileSync(blackListPath).toString()).filter(e => !e.startsWith('#'));

if (require('electron-squirrel-startup')) app.quit();

let mainWindow;

fs.watchFile(blackListPath, { interval: 5000 }, (curr, prev) => {
  if (!fs.existsSync(blackListPath)) {
    fs.writeFileSync(blackListPath, blackListStartText);
    blacklists = parseTxt(blackListStartText);
  }

  blacklists = parseTxt(fs.readFileSync(blackListPath).toString()).filter(e => !e.startsWith('#'));
  mainWindow.webContents.send('onData', { title: 'blacklist.txt', data: blacklists });
})

const createWindow = () => {
  if (process.platform !== 'win32') return dialog.showMessageBox({
    title: 'Windows not found :(',
    type: 'error',
    message: 'Stats overlay for NetherGames is only supported on Windows.'
  }).then(() => {
    app.quit();
    mainWindow?.destroy();
  });

  mainWindow = new BrowserWindow({
    width: 700,
    height: 480,
    autoHideMenuBar: true,
    icon: path.join(__dirname, './resources/assets/icons/app.ico'),
    frame: false,
    resizable: false,
    transparent: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });

  mainWindow.setMenu(null);
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};
app.on('ready', createWindow);

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('minimize', (event, code) => mainWindow.minimize());

ipcMain.on('exit', (event, code) => app.quit());

const sendLogs = (...txt) => {
  mainWindow.webContents.send('onLog', ...txt);
}

ipcMain.on('relay', (event, msg) => {
  const startRelay = () => {
    console.info('Checking Minecraft version');
    let ver = detectVersion();
    console.info(ver);
    ver = ver.split(' ')[ver.split(' ').length - 1];

    if (!ver) {
      if (options.winOnTop) mainWindow.setAlwaysOnTop(false, 'screen-saver');

      return dialog.showMessageBox({
        title: 'Minecraft not found :(',
        type: 'error',
        message: 'You need Minecraft installed for NetherGames Stats Overlay to work.'
      }).then(() => {
        app.quit();
        mainWindow?.destroy();
      });
    }

    let supported = false;

    if (versionKeys[simplyVer(ver)]?.length) supported = true;
    if (parseInt(ver.split('.')[1]) > 16) supported = true;

    if (!supported) {
      if (options.winOnTop) mainWindow.setAlwaysOnTop(false, 'screen-saver');

      return dialog.showMessageBox({
        title: 'Minecraft version not supported :(',
        type: 'error',
        message: 'NG Stats overlay currently only supports the versions: 1.16.201+'
      }).then(() => {
        app.quit();
        mainWindow?.destroy();
      });
    }

    console.info('Checking port...');
    console.info(killPort(options.relayPort).trim());

    let vk = versionKeys[simplyVer(ver)] || `1.${ver.split('.')[1]}.${ver.split('.')[2][0]}0`;

    child = spawn(`node ./resources/assets/scripts/relay.js "${optsPath}" "${vk}" "${authPath}"`, { cwd: __dirname, shell: true });

    console.info('Child process spawned');

    child.stdout.on('data', (data) => {
      let json;

      try {
        json = JSON.parse(data.toString());
      } catch (e) { }

      if (json?.title?.length) mainWindow.webContents.send('onData', json);
      else console.info(data.toString().trim());
      sendLogs(data.toString().trim());
    });

    child.stderr.on('data', (data) => {
      sendLogs(data.toString());
      console.error(data.toString().trim());

      stopRelay();

      mainWindow.webContents.send('onData', 'relay_closed_we');
    });

    return child;
  }

  const stopRelay = () => {
    child.kill('SIGINT');

    child = undefined;

    console.info('Relay ended');
    console.info(killPort(options.relayPort).trim());
  }

  if (msg == 'start') {
    child = startRelay();
  } else if (msg == 'stop') {
    stopRelay();

    mainWindow.webContents.send('onData', 'relay_closed');
  } else if (msg == 'restart') {
    stopRelay();

    mainWindow.webContents.send('onData', 'relay_closed_rs');

    child = startRelay();
  }
})

ipcMain.on('getData', async (event, data) => {
  console.info(`Data Requested ${data}`);

  let res = { title: data }

  if (data == 'options.json') res.data = JSON.parse(fs.readFileSync(optsPath).toString());
  if (data == 'versionKeys.json') res.data = versionKeys;
  if (data.startsWith('ngPlayer_')) res.data = await fetchPlayer(JSON.parse(data.replace('ngPlayer_', '')), { withStats: true }, options.apiKey)
  if (data == 'blacklist.txt') res.data = blacklists;
  if (data == 'mcColors.json') res.data = mcColors;
  if (data == 'package.json') res.data = pjson;

  event.returnValue = res;
})

ipcMain.on('getConfirm', (event, data) => {
  console.info(`Request confirm ${data.id}`);

  if (!dialogKeys[data.id]) {
    if (options.winOnTop) mainWindow.setAlwaysOnTop(false, 'screen-saver');
    dialogKeys[data.id] = 1;
    return dialog.showMessageBox(data.data).then(result => {
      delete dialogKeys[data.id];
      mainWindow.webContents.send('onConfirm', { data: result, id: data.id });
      if (options.winOnTop) mainWindow.setAlwaysOnTop(true, 'screen-saver');
    })
  }
})

ipcMain.on('sendData', (event, data) => {
  console.info(`Sending data ${data.title}`);

  if (data.title == 'options.json') {
    fs.writeFileSync(optsPath, JSON.stringify(data.data));

    options = data.data;

    mainWindow.setIgnoreMouseEvents(data.data.ignoreMouse);
  }
})

ipcMain.on('onTop', (event, data) => {
  console.info(`Window on top ${data}`);

  mainWindow.setVisibleOnAllWorkspaces(data ? true : false, { visibleOnFullScreen: true });
  mainWindow.setAlwaysOnTop(data ? true : false, 'screen-saver');
})

ipcMain.on('ignoreMouse', (event, data) => {
  // console.info(`Window ignoreMouse ${data}`);

  if (data) mainWindow.setIgnoreMouseEvents(true, { forward: true });
  else mainWindow.setIgnoreMouseEvents(false);
})

ipcMain.on('compareArray', (event, data) => {
  event.returnValue = compareArray(data.before, data.after);
})

ipcMain.on('openBlacklist', (event, data) => {
  try {
    shell.openPath(blackListPath);
  } catch (e) {
    console.error(e);
  }
})

ipcMain.on('howSmurf', (event, data) => {
  event.returnValue = smufFunc(data);
})

ipcMain.on('focusWin', (event, data) => {
  if (data) mainWindow.focus();
})

ipcMain.on('sendLog', (event, data) => {
  console.info(data);
})

ipcMain.on('openPortalAPI', (event, data) => {
  try {
    shell.openExternal('https://portal.nethergames.org/auth/applications');
  } catch (e) {
    console.error(e);
  }
})