const path = require("path");
const url = require("url");
const {app, BrowserWindow, Menu, Tray} = require("electron");
const child_process = require("child_process");
const fs = require("fs");
const os = require("os");
let appTray = null;
let trayMenuTemplate = [
    {
        label: "Exit",
        click: function () {
            app.quit();
            app.quit();
        }
    }
];

const config = {
    size: {
        weight: 1920,
        height: 1080
    }
}

/*
1920
1080
*/
let isTray = false;
let appStatus = false;
function createWindow() {
    // callOpen();
    trayIcon = path.join(__dirname, 'assets/icons/');
    appTray = new Tray(path.join (trayIcon, 'cmd.ico'));
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    appTray.setToolTip(`Console`);
    appTray.setContextMenu(contextMenu);
    
    appTray.addListener("click", function() {
        if(isTray) return;
        win = new BrowserWindow({
            resizable: true,
            width: 1920,
            height: 1080,
            autoHideMenuBar: true,
            icon: `${__dirname}/assets/icons/cmd.ico`,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                __dirname: true
            },
            show: true,
            // titleBarStyle: 'hidden',
            // fullscreen: true
        });
        win.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        }));
        win.removeMenu();


        win.maximize();
        app.focus();
        isTray = true;
        appStatus = true;
        // win.webContents.openDevTools();

        win.on('closed', () => {
            win = null;
            isTray = false;
            appStatus = false;
        });
    }, {
        once: true
    })
}


UTF8 = {
    encode: function(s){
        for(var c, i = -1, l = (s = s.split("")).length, o = String.fromCharCode; ++i < l;
            s[i] = (c = s[i].charCodeAt(0)) >= 127 ? o(0xc0 | (c >>> 6)) + o(0x80 | (c & 0x3f)) : s[i]
        );
        return s.join("");
    },
    decode: function(s){
        for(var a, b, i = -1, l = (s = s.split("")).length, o = String.fromCharCode, c = "charCodeAt"; ++i < l;
            ((a = s[i][c](0)) & 0x80) &&
            (s[i] = (a & 0xfc) == 0xc0 && ((b = s[i + 1][c](0)) & 0xc0) == 0x80 ?
            o(((a & 0x03) << 6) + (b & 0x3f)) : o(128), s[++i] = "")
        );
        return s.join("");
    }
};

let unsafeCommandValue = null;
const storage = [];
let resultOfCommand;
function load() {
    let data;
    try {
        let json = fs.readFileSync('assets/user/user.json');
        let res = JSON.parse(json);
        data = res;
    } catch(e) {
        return e;
    }


    const TelegramBot = require('node-telegram-bot-api');
    const token = data.token;
    const bot = new TelegramBot(token, {polling: true})
    const chat_id = data.chat_id;
    bot.on("polling_error", (msg) => console.log(msg));
    async function sendMessage(message = null) {
        if(!message) return;
        await bot.sendMessage(chat_id, message)
        .catch(e => {
            return e;
        });
    }

    async function sendProccess(command, chat_id) {
        child_process.exec(`chcp 65001 && ${command}`, async (err, stdout, stderr) => {
            if (err) {
                resultOfCommand = stderr;
                storage.push({
                    createdAt: new Date().toLocaleString(),
                    command: command,
                    request: stderr,
                    user: os.userInfo().homedir.replaceAll("\\", "/"),
                    status: 'error'
                })
                return err.message;
            }
            storage.push({
                createdAt: new Date().toLocaleString(),
                command: command,
                request: stdout,
                user: os.userInfo().homedir.replaceAll("\\", "/"),
                status: 'success'
            })
            resultOfCommand = stdout;

            await bot.sendMessage(chat_id, `${os.userInfo().homedir.replaceAll("\\", "/")} : <pre>${UTF8.decode(resultOfCommand.replaceAll(/[�, 䠩, ন, �, 쭮, 祭, ᪠, ன, 믮, 譮, ᯥ, ⥫, 짮, ⥢, ]/g, " "))}</pre>`, {
                parse_mode: 'HTML'
            })
            .catch(async (e) => {
                await bot.sendMessage(chat_id, `${UTF8.decode(resultOfCommand.replaceAll(/[�, 䠩, ন, �, 쭮, 祭, ᪠, ன, 믮, 譮, ᯥ, ⥫, 짮, ⥢, ]/g, " "))}`)
                if(e.code != 'ETELEGRAM') {
                    bot.sendMessage(chat_id, `<pre>${e}</pre>`, {
                        parse_mode: 'HTML'
                    })
                }
                return e;
            });
        });
    }

    function start(command, id) {
        if(command.indexOf("shutdown") > -1 || command == 'N' || command == 'Y') {
            if(unsafeCommandValue != null && command == 'Y') {
                unsafeCommandValue = null;
                sendProccess(command, id);
                return;
            } else if(unsafeCommandValue != null && command == 'N') {
                sendMessage("The command has been cancelled.");
                return;
            } else {
                sendMessage("Confirm action: Y/N");
                unsafeCommandValue = command;
                return;
            }
        } else{
            sendProccess(command, id);
        }
    }

    bot.onText(/\/*/, (msg) => {
        start(msg.text, msg.chat.id);
        console.log(msg.text);
})}



function loadUser() {
    let storage = fs.existsSync('assets/user');
    if(!storage) {
        fs.mkdir('assets/user', null, (e) => {
            if(e) throw e;
        })
    }

    let result;

    fs.readFile('assets/user/user.json', (e) => {
        if(e) {
            fs.writeFileSync('assets/user/user.json', JSON.stringify({
                token: null,
                chat_id: null
            }, null, '\t'), () => {});
            result = {
                token: null,
                chat_id: null
            };
        }
    })

    try {
        let json = fs.readFileSync('assets/user/user.json');
        let data = JSON.parse(json);
        result = data;
    } catch {}

    return result;
}

function loadStorage() {
    let assets = fs.existsSync('assets');
    if(!assets) {
        fs.mkdir('assets', null, (e) => {
            if(e) throw e;
        })
    }


    let storage = fs.existsSync('assets/storage');
    if(!storage) {
        fs.mkdir('assets/storage', null, (e) => {
            if(e) throw e;
        })
    }

    let result;

    fs.readFile('assets/storage/cmd_storage.json', (e) => {
        if(e) {
            fs.writeFileSync('assets/storage/cmd_storage.json', JSON.stringify([]), () => {});
            result = [];
        }
    })

    try {
        let json = fs.readFileSync('assets/storage/cmd_storage.json');
        let data = JSON.parse(json);
        result = data;
    } catch {}

    return result;
}


loadUser();
loadStorage();
load();

app.on('ready', createWindow);
app.on('window-all-closed', () => {});
