const { app, BrowserWindow } = require('electron');
let win;
function createWindow () {     
// Create the browser window.
win = new BrowserWindow({ width: 1920, height: 1080 });
// and load the index.html of the app.  
//rebember to change it into ur dirname
win.loadFile('./dist/viewer/index.html');
// Open the DevTools.
//commit it if u don't want to show develope tools
win.webContents.openDevTools();
// Emitted when the window is closed.
win.on('closed', () => {       
   win = null     
  })
};      
// This method will be called when Electron has finished   
// initialization and is ready to create browser windows.   
// Some APIs can only be used after this event occurs.   
app.on('ready', createWindow);
 
// Quit when all windows are closed.
app.on('window-all-closed', () => { 
 
// On macOS it is common for applications and their menu bar     
// to stay active until the user quits explicitly with Cmd + Q     
if (process.platform !== 'darwin') {       app.quit()     }   });      
app.on('activate', () => {     
// On macOS it's common to re-create a window in the app when the     
// dock icon is clicked and there are no other windows open.     
if (win === null) {       createWindow()     }   
});   