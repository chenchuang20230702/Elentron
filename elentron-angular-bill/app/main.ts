import {app, BrowserWindow, screen } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
let win: BrowserWindow | null = null;
let showWin: BrowserWindow | null = null;

const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    // autoHideMenuBar:true,
    show:false,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve),
      contextIsolation: false,
    },
  });
  showWin = new BrowserWindow({
    width: 500,
    height: 400,
    transparent:true,
    frame:false
  });
  if (serve) {
    //浏览器环境
    const debug = require('electron-debug');
    debug();
    require('electron-reloader')(module);
    showWin.loadFile(path.join(__dirname, 'launch.html'));
    win.loadURL('http://localhost:4200');
  } else {
    // electron 环境Path when running electron executable
    //加载启动页面
    showWin.loadFile(path.join(__dirname, 'launch.html'));
    //加载主页面
    let pathIndex = './index.html';
    if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
       // Path when running electron in local folder
      pathIndex = '../dist/index.html';
    }

    const url = new URL(path.join('file:', __dirname, pathIndex));
    win.loadURL(url.href);
  }
  win.once('ready-to-show',()=>{
    showWin?.destroy();
    setTimeout(() => {
      win?.show();
      showWin = null;
    }, 100);
  });
  // Emitted when the window is closed.
  win.on('closed', () => {
    console.log('收到---')
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win?.destroy();
    win = null;
    app.quit();
  });
  return win;
}

try {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
