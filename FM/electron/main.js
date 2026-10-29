const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');

let backendProcess;
let frontendProcess;

function resolveDatabaseUrl(isPackaged) {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const dataDir = isPackaged
    ? path.join(process.env.APPDATA || path.join(process.env.USERPROFILE || __dirname, 'AppData', 'Roaming'), 'Flooring Junction', 'data')
    : path.join(__dirname, '..', 'frontend', 'Backened', 'data');

  const dbPath = path.join(dataDir, 'flooring_junction.db');
  return pathToFileURL(dbPath).href;
}

function startProcess(command, args, cwd, label) {
  const proc = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      PORT: label === 'backend' ? '5000' : '3000',
      APP_PORT: '5000',
      DATABASE_URL: resolveDatabaseUrl(!!app.isPackaged),
      NEXT_PUBLIC_API_URL: 'http://localhost:5000/api',
    },
    stdio: 'inherit',
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
  });

  return proc;
}

function startServices() {
  const isPackaged = !!app.isPackaged;
  const appRoot = isPackaged ? process.resourcesPath : path.join(__dirname, '..');

  const backendDir = isPackaged
    ? path.join(appRoot, 'app-backend')
    : path.join(appRoot, 'frontend', 'Backened');

  const frontendDir = isPackaged
    ? path.join(appRoot, 'app-frontend')
    : path.join(appRoot, 'frontend', 'frontend');

  const backendEntry = path.join(backendDir, 'server.js');
  const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');

  if (!require('fs').existsSync(backendEntry)) {
    console.error('Backend entry missing:', backendEntry);
    return;
  }

  if (!require('fs').existsSync(nextBin)) {
    console.error('Frontend next binary missing:', nextBin);
    return;
  }

  backendProcess = startProcess(process.execPath, [backendEntry], backendDir, 'backend');
  frontendProcess = startProcess(process.execPath, [nextBin, 'start', '-p', '3000'], frontendDir, 'frontend');
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 980,
    minWidth: 1100,
    minHeight: 760,
    title: 'Flooring Junction',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const startURL = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  win.loadURL(startURL);

  if (process.env.ELECTRON_DEBUG === 'true') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  startServices();
  createWindow();
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
