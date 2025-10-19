const { app, Tray, Menu, BrowserWindow, Notification, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('node:path');
const { exec, execSync } = require('child_process');
const { readFileSync } = require('node:fs');
const { get } = require('node:http');
const { MicaBrowserWindow } = require('mica-electron');

const commands = [
    "open ",
    "open *",
    "startwithwait ",
    "startwithoutwait ",
    "close",
    "GetShowMessageState",
    "SetShowMessageState ",
    "showmessage ",
    "getfile ",
    "loadpage",
    "loadpage ",
    "setfile ",
    "showDevTool",
    "exit"
];

let mainWindow;
global.quitsign=0;

Array.prototype.toString = function () {
    return this.join('');
}

function isProgramRunning(programName) {
    const isWindows = process.platform === 'win32';
    const command = isWindows
        ? `tasklist /FI "IMAGENAME eq ${programName}"`
        : `pgrep -x ${programName}`;

    try {
        const stdout = execSync(command).toString();
        return isWindows
            ? stdout.toLowerCase().includes(programName.toLowerCase())
            : stdout.trim() !== '';
    } catch (error) {
        console.error(`Error checking program: ${error}`);
        return false;
    }
}

function runcmdwithwindow(command) {
    return new Promise((resolve) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Run Error: ${error.message}`);
                resolve(`Run Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Runtime Error: ${stderr}`);
                resolve(`Runtime Error: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
}

function getdirpath() {
    try {
        const GXCCpath = fs.readFileSync("C:\\GXCC\\path.txt", 'utf8');
        return GXCCpath.slice(0, -8); // 去掉最后8个字符
    } catch (err) {
        console.error(err);
        return '';
    }
}

function getConfigData() {
    const filepath = path.join(getdirpath(), ".\\Config\\Configs.GXc");
    const datafromfile = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(datafromfile);
}

function getProgramName(){
    const config=getConfigData();
    if(config['ProgramName']!=undefined) return config['ProgramName'];
    else return 'Program';
}

function getExtensionPath(id, file) {
    return path.join(getdirpath(), `Extensions\\${id}\\${file}`);
}

function getpagepath() {
    try {
        const jsonfromfile = getConfigData();
        const id = jsonfromfile['UIid'];
        if(id.toString()=='undefined'){
            console.error('No installed page.');
            return "./index.html";
        }
        const path = getExtensionPath(id, "./index.html");
        console.log(path);
        fs.readFileSync(path);
        return path;
    } catch (err) {
        console.error('Can load page.');
        return "./index.html";
    }
}

function getpreloadfilepath() {
    try {
        const jsonfromfile = getConfigData();
        const id = jsonfromfile['UIid'];
        if(id.toString()=='undefined'){
            console.error('No installed preloadfile.');
            return "./preload.js";
        }
        const path = getExtensionPath(id, "./preload.js");
        console.log(path);
        fs.readFileSync(path);
        return path.join(getdirpath(),path);
    } catch (err) {
        console.error('Can load preloadfile.');
        return path.join(__dirname,"./preload.js");
    }
}

function compareoperation(data) {
    let matchedCommandId = -1;

    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (data.startsWith(command)) {
            matchedCommandId = i;
        }
    }

    if (matchedCommandId === -1) return 'NO PARED ACTION.';

    const operation = data.slice(commands[matchedCommandId].length).toString();

    switch (matchedCommandId) {
        case 0:
            openextension(operation).then(result => {
                global.mainWindow.webContents.send('message-from-main', result);
            });
            return null;
        case 1:
            openTool(operation).then(result => {
                global.mainWindow.webContents.send('message-from-main', result);
            });
            return null;
        case 2:
            startwithwait(operation).then(result => {
                global.mainWindow.webContents.send('message-from-main', result);
            });
            return null;
        case 3:
            startwithoutwait(operation);
            return null;
        case 4:
            app.quit();
            return 'OK';
        case 5:
            return GetShowMessageState();
        case 6:
            return SetShowMessageState(operation);
        case 7:
            return showmessage(operation);
        case 8:
            return getfile(operation);
        case 9:
            return loadpage(getpagepath());
        case 10:
            return loadpage(operation);
        case 11:
            return setfile(operation);
        case 12:
            return showDevTools();
        case 13:
            global.quitsign = 1;
            app.quit();
            return 'OK';
        default:
            return 'NO PARED ACTION.';
    }
}

async function openextension(operation) {
    const extensionDirPath = path.join(getdirpath(), `Extensions\\${operation}\\`);
    const extensionNamePath = path.join(extensionDirPath, "ExtensionName.etn");
    try {
        const extensionName = fs.readFileSync(extensionNamePath, 'utf8');
        const extensionPath = path.join(extensionDirPath, `${extensionName}.exe`);
        await runcmdwithwindow(`/d ${extensionDirPath} ${extensionPath}`);
        return 'OK';
    } catch (err) {
        return err.message;
    }
}

async function openTool(operation) {
    if (operation === 'Tool') {
        const config = getConfigData();
        const extensionId = config['toolid'];
        const extensionNamePath = path.join(getdirpath(), `Extensions\\${extensionId}\\ExtensionName.etn`);
        try {
            const extensionName = fs.readFileSync(extensionNamePath, 'utf8');
            const extensionPath = path.join(getdirpath(), `Extensions\\${extensionId}\\${extensionName}.exe`);
            startwithoutwait(extensionPath);
            return 'OK';
        } catch (err) {
            return err.message;
        }
    } else if (operation === "Core") {
        const dirpath = getdirpath();
        const filepath = path.join(dirpath, "GXCC_Core.exe");
        if (isProgramRunning('GXCC_Core.exe')) {
            return 'Already running.';
        }
        startwithoutwait(filepath);
        return 'OK';
    }
}

async function startwithwait(operation) {
    await runcmdwithwindow('cmd /c '+operation);
    return 'OK';
}
async function startwithoutwait(operation) {
    await runcmdwithwindow('cmd /c start '+operation);
    return 'OK';
}

function GetShowMessageState() {
    const config = getConfigData();
    return 'SetMessageBalloonState ' + config['GXCCUI']['ShowMessageBalloonState'];
}

function SetShowMessageState(operation) {
    const filepath = path.join(getdirpath(), ".\\Config\\Configs.GXc");
    const data = getConfigData();
    data['GXCCUI']['ShowMessageBalloonState'] = operation;
    fs.writeFileSync(filepath, JSON.stringify(data, null, 4));
    return 'NOOPERATION_OK';
}

function showmessage(operation) {
    dialog.showMessageBox({
        type: 'info',
        title: 'GXCC-UI',
        message: operation,
        buttons: ['OK']
    });
    return 'OK';
}

function getfile(operation) {
    try {
        const datafromfile = fs.readFileSync(operation);
        return "filedata " + datafromfile;
    } catch (err) {
        return err.message;
    }
}

function loadpage(operation) {
    mainWindow.loadFile(operation);
    return 'OK';
}

function setfile(operation) {
    const firstQuoteIndex = operation.indexOf('"');
    const secondQuoteIndex = operation.indexOf('"', firstQuoteIndex + 1);
    if (firstQuoteIndex !== -1 && secondQuoteIndex !== -1) {
        const filepath = operation.substring(firstQuoteIndex + 1, secondQuoteIndex);
        const information = operation.substring(secondQuoteIndex + 1);
        fs.writeFileSync(filepath, information);
        return 'OK';
    }
    return "No quoted text found";
}

function showDevTools(){
    global.mainWindow.webContents.openDevTools();
    return 'OK';
}

const createWindow = () => {
    mainWindow = new MicaBrowserWindow({
        width: 1000,
        height: 800,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            height: 50,
            color: "rgba(0,0,0,0)",
            symbolColor: "rgb(255,255,255)"
        },
        // transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: false,
            preload: getpreloadfilepath()
        }
    });

    mainWindow.on('close', (e) => {
        if (global.quitsign === 0) {
            e.preventDefault();
            mainWindow.hide();
            const tray = new Tray(path.join(__dirname, 'icon.png'));
            const contextMenu = Menu.buildFromTemplate([
                {
                    label: '显示窗口',
                    type: 'normal',
                    click: () => {
                        mainWindow.show();
                        tray.destroy();
                    }
                },
                {
                    label: '-',
                    type: 'separator'
                },
                {
                    label: '退出'+getProgramName(),
                    type: 'normal',
                    click: () => {
                        global.quitsign = 1;
                        app.quit();
                    }
                }
            ]);
            tray.setToolTip(getProgramName());
            tray.on('click', () => {
                mainWindow.show();
                tray.destroy();
            });
            tray.setContextMenu(contextMenu);
            const config = getConfigData();
            if (config['GXCCUI']['ShowMessageBalloonState'] === 'true') {
                const notification = {
                    title: getProgramName()+'已收起',
                    body: getProgramName()+'并没有退出，而是收起在了托盘中。点击来配置通知设置。',
                    icon: path.join(getdirpath(), 'icon.png')
                };
                const notificationbotton = new Notification(notification);
                notificationbotton.on('click', () => {
                    mainWindow.show();
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.focus();
                    global.mainWindow.webContents.send('message-from-main', 'ShowMessageBalloonStateUI');
                    tray.destroy();
                });
                notificationbotton.show();
            }
        } else {
            app.quit();
        }
    });

    mainWindow.loadFile('index.html');
    getProgramName();
    global.mainWindow = mainWindow;
    ipcMain.on('message-from-renderer', (event, arg) => {
        const result = compareoperation(arg);
        if (result !== null) {
            event.sender.send('message-from-main', result);
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('ready', () => {
    app.setUserTasks([
        {
            program: process.execPath,
            iconPath: 'icon.png',
            iconIndex: 0,
            title: getProgramName(),
            description: 'The new UI of '+getProgramName(),
        }
    ]);
});