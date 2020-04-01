// Main JS script for web browser

// Security (super important!)
// ESLint will warn about any use of eval(), even this one
// eslint-disable-next-line
global.eval = function () {
  throw new Error(`Sorry, this app does not support window.eval().`)
}

// We obviously need electron, duh
const electron = require('electron')
// DEBUG: Reload app when files are changed
try {
	require('electron-reloader')(module);
} catch (err) {}
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Module to create webviews.
const WebView = electron.WebView
// Module to access filesystem paths.
const path = require('path')
// Module to support titlebar menus.
const Menu = electron.Menu
// Module for context menus.
require('electron-context-menu')({
	showInspectElement: false
});
// Module to support dialogs.
const dialog = electron.dialog
// Module to handle errors.
const unhandled = require('electron-unhandled')
unhandled()
// Module for the about window.
const openAboutWindow = require('electron-about-window').default;
// Get version number
const version = app.getVersion()
const copyright = `Copyright (c) ${new Date().getFullYear()} Nitin Seshadri`
// Get icon paths
const iconPath = path.join(__dirname, '/res/icon/icon.png')
// Handle multiple instances
const shouldQuit = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})
if (shouldQuit) {
  app.quit()
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 1024, height: 640, minWidth: 640, minHeight: 480, icon: iconPath })
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
  app.quit()
})
app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
    if (process.platform === 'darwin') {
      app.dock.show()
    }
  }
})
// Title bar menus.
let template = [{
  label: 'Edit',
  submenu: [{
    role: 'undo'
  }, {
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    role: 'cut'
  }, {
    role: 'copy'
  }, {
    role: 'paste'
  }, {
    role: 'pasteandmatchstyle'
  }, {
    role: 'delete'
  }, {
    role: 'selectall'
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Toggle Developer Tools',
    accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
	visible: false,
    click (item, focusedWindow) {
      if (focusedWindow) focusedWindow.webContents.toggleDevTools()
    }
  }, {
    role: 'resetzoom'
  }, {
    role: 'zoomin',
    accelerator: 'CmdOrCtrl+='
  }, {
    role: 'zoomout'
  }, {
    type: 'separator'
  }, {
    role: 'togglefullscreen'
  }]
}, {
  role: 'window',
  submenu: [{
    role: 'minimize'
  }, {
    role: 'close'
  }]
}, {
  role: 'help',
  submenu: []
}]

function addUpdateMenuItems(items, position) {
  if (process.mas) return
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }]
  items.splice.apply(items, [position, 0].concat(updateItems))
}

function findReopenMenuItem() {
  const menu = Menu.getApplicationMenu()
  if (!menu) return
  let reopenMenuItem
  menu.items.forEach(function(item) {
    if (item.submenu) {
      item.submenu.items.forEach(function(item) {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item
        }
      })
    }
  })
  return reopenMenuItem
}
if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [{
      role: 'about',
	  click: () => openAboutWindow({icon_path: iconPath,copyright:copyright,package_json_dir:__dirname})
    }, {
      type: 'separator'
    }, {
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      role: 'hide'
    }, {
      role: 'hideothers'
    }, {
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      role: 'quit'
    }]
  })
  // Edit menu.
  template[1].submenu.push({
    type: 'separator'
  }, {
    label: 'Speech',
    submenu: [{
      role: 'startspeaking'
    }, {
      role: 'stopspeaking'
    }]
  })
  // Window menu.
  template[3].submenu = [{
    role: 'close'
  }, {
    role: 'minimize'
  }, {
    role: 'zoom'
  }, {
    type: 'separator'
  }, {
    role: 'front'
  }]
  addUpdateMenuItems(template[0].submenu, 1)
}
if (process.platform === 'win32') {
  template.unshift({
    label: 'File',
    submenu: [{
	  role: 'about',
	  click: () => openAboutWindow({icon_path: iconPath,copyright:copyright,package_json_dir:__dirname})
    }, {
      type: 'separator'
    }, {
      role: 'quit',
	  accelerator: 'CmdOrCtrl+Q'
    }]
  })
  const helpMenu = template[template.length - 1].submenu
  addUpdateMenuItems(helpMenu, 0)
}
app.on('ready', function() {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})