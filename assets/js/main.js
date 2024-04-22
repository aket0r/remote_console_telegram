const child_process = require("child_process");
const os = require("os");
const fs = require("fs");
const requests = require("requests");
const data = {
    storage: [],
    user: {
        token: null,
        chat_id: null
    }
}

function create(object, status = false) {
    const path = document.querySelector('#main #container');
    const element = document.createElement('div');
    element.id = 'item';
    element.innerHTML =
    `
        <span class="date">${object.createdAt || new Date().toLocaleString()}</span>
        <p class="command-text">
            <span id="user">${object.user}</span> : ${object.command}
            <br>
            <pre class="${object.status}" id="request">${object.request}</pre>
        </p>
    `
    path.prepend(element);
    if(status) {
        data.storage.push(object);
        save();
    }
}
let resultOfCommand;
function start(command, id) {
    if(command.indexOf("shutdown") > -1 || command == 'N' || command == 'Y') {
        if(unsafeCommandValue != null && command == 'Y') {
            sendProccess(command, id);
            unsafeCommandValue = null;
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

async function sendProccess(command, chat_id) {
    let status = '';
    child_process.exec(`${command}`, async (err, stdout, stderr) => {
        if (err) {
            resultOfCommand = stderr;
            data.storage.push({
                createdAt: new Date().toLocaleString(),
                command: command,
                request: stderr,
                user: os.userInfo().homedir.replaceAll("\\", "/"),
                status: 'error'
            })
            status = 'error';
            return err.message;
        }
        data.storage.push({
            createdAt: new Date().toLocaleString(),
            command: command,
            request: stdout,
            user: os.userInfo().homedir.replaceAll("\\", "/"),
            status: 'success'
        })
        status = 'success';
        resultOfCommand = stdout.replaceAll(/[\u{0080}-\u{FFFF}]/gu,"");
        
        create({
            createdAt: new Date().toLocaleString(),
            command: command,
            request: stdout,
            user: os.userInfo().homedir.replaceAll("\\", "/"),
            status: status
        })
        save();
    });
}

function loadStorage() {
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


function save() {
    fs.writeFileSync('assets/storage/cmd_storage.json', JSON.stringify(data.storage, null, '\t'), () => {});
}

function updateUserData() {
    fs.writeFileSync('assets/user/user.json', JSON.stringify(data.user, null, '\t'), () => {});
}

function reset() {
    fs.writeFileSync('assets/storage/cmd_storage.json', JSON.stringify([]), () => {});
}

const cmd = document.querySelector("#command");
cmd.addEventListener("keyup", function(e) {
    if(this.value == '') return;
    if(e.key == 'Enter') {
        start(this.value, chat_id);
        cmd.value = "";
    }
});

let regWin = document.querySelector("#registration-container");

window.addEventListener("load", () => {
    data.storage = loadStorage();
    const userData = loadUser();

    if(!userData?.token && !userData?.chat_id) {
        regWin.classList.remove("hidden");
    } else {
        data.user.token = userData.token;
        data.user.chat_id = userData.chat_id;
    }

    if(data.storage?.length > 0) {
        data.storage.forEach(item => {
            create(item);
        })
    }
})




let send = document.querySelector("#send");
send.addEventListener("click", async function() {
    let token = document.querySelector("#token").value.trim();
    let chat_id = document.querySelector("#chat_id").value.trim();
    let res = document.querySelector("#res");
    if(!token || !chat_id) return;
    let req = await fetch(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chat_id}&text=API Token is correct`);
    let response = await req.json();
    if(response.ok == true) {
        data.user.token = token;
        data.user.chat_id = chat_id;
        updateUserData();
        regWin.classList.add("hidden");
        res.innerText = JSON.stringify(response, null, '\t');
        setTimeout(() => {
            location.reload();
        }, 500);
    } else {
        res.innerText = JSON.stringify(response, null, '\t');
    }
});