// Colors LED Studio - programma Windows (Electron) con aggiornamenti automatici
const { app, BrowserWindow, Menu, session, ipcMain, dialog } = require('electron');
const path = require('path');

let win = null;
let updater = null;
let manualCheck = false;

// una sola copia del programma aperta
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1000, minHeight: 650,
    title: 'Colors LED Studio ' + app.getVersion(), backgroundColor: '#0b1622',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.maximize();
}

function send(ch, data) { if (win && !win.isDestroyed()) win.webContents.send(ch, data); }

function setupUpdater() {
  if (!app.isPackaged) return;            // in prova (AVVIA.bat) non cerca aggiornamenti
  try { updater = require('electron-updater').autoUpdater; } catch (e) { return; }
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;

  updater.on('update-available', async (info) => {
    send('upd', {state: 'available', version: info.version});
    const r = await dialog.showMessageBox(win, {
      type: 'info', buttons: ['Scarica e aggiorna', 'Più tardi'], defaultId: 0, cancelId: 1,
      title: 'Aggiornamento disponibile',
      message: `È disponibile Colors LED Studio ${info.version}`,
      detail: `Versione installata: ${app.getVersion()}\n\nIl download avviene in sottofondo, puoi continuare a lavorare.`
    });
    if (r.response === 0) updater.downloadUpdate();
  });
  updater.on('update-not-available', () => {
    send('upd', {state: 'none'});
    if (manualCheck) dialog.showMessageBox(win, {type: 'info', title: 'Aggiornamenti', message: 'Hai già l\'ultima versione (' + app.getVersion() + ').'});
    manualCheck = false;
  });
  updater.on('download-progress', (p) => { send('upd', {state: 'downloading', percent: Math.round(p.percent)}); if (win) win.setProgressBar(p.percent / 100); });
  updater.on('update-downloaded', async (info) => {
    if (win) win.setProgressBar(-1);
    send('upd', {state: 'ready', version: info.version});
    const r = await dialog.showMessageBox(win, {
      type: 'info', buttons: ['Riavvia e installa ora', 'Alla chiusura'], defaultId: 0, cancelId: 1,
      title: 'Aggiornamento pronto',
      message: `Colors LED Studio ${info.version} è pronto.`,
      detail: 'Salva il progetto se hai modifiche in corso. Se scegli "Alla chiusura" si installa quando chiudi il programma.'
    });
    if (r.response === 0) setImmediate(() => updater.quitAndInstall(false, true));
  });
  updater.on('error', (err) => {
    send('upd', {state: 'error'});
    if (manualCheck) dialog.showMessageBox(win, {type: 'warning', title: 'Aggiornamenti', message: 'Non riesco a controllare gli aggiornamenti.', detail: 'Controlla la connessione a internet.\n\n' + (err && err.message ? err.message.slice(0, 300) : '')});
    manualCheck = false;
  });
  setTimeout(() => updater.checkForUpdates().catch(() => {}), 4000);
}

ipcMain.handle('app-info', () => ({version: app.getVersion(), packaged: app.isPackaged}));
ipcMain.handle('check-updates', async () => {
  if (!updater) { return {ok: false, reason: app.isPackaged ? 'updater' : 'dev'}; }
  manualCheck = true;
  try { await updater.checkForUpdates(); return {ok: true}; } catch (e) { return {ok: false}; }
});

app.whenReady().then(() => {
  // permette di leggere l'elenco dei font installati in Windows
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(perm === 'local-fonts'));
  session.defaultSession.setPermissionCheckHandler((wc, perm) => perm === 'local-fonts');
  createWindow();
  setupUpdater();
});
app.on('window-all-closed', () => app.quit());
