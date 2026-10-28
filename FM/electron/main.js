const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backendProcess;
let frontendProcess;

function startProcess(command, args, cwd, label) {
  const proc = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      PORT: label === 'backend' ? '5000' : '3000',
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
  const appRoot = path.join(__dirname, '..');
  const backendDir = path.join(appRoot, 'frontend', 'Backened');
  const frontendDir = path.join(appRoot, 'frontend', 'frontend');

  backendProcess = startProcess(process.execPath, [path.join(backendDir, 'server.js')], backendDir, 'backend');

  const nextBin = path.join(frontendDir, 'node_modules', 'next', 'dist', 'bin', 'next');
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
