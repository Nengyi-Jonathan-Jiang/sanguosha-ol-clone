/** @type {Socket} */
let socket;

let userName;   // User's name
let textarea;   // Chat area
let wsconsole;  // Websocket console area
let userlist;   // User list area
/* Connect to the Websocket endpoint
 * Set a callback for incoming messages */
function connect() {
    textarea = document.getElementById("textarea");
    wsconsole = document.getElementById("wsconsole");
    userlist = document.getElementById("userlist");

    socket = new Socket("ws://localhost:8081/");
    socket.addHandler('message', data => {
        let line = "";

        // message
        line = data.name + ": ";
        if (data.target.length > 0) line += "@" + data.target + " ";
        line += data.message + "\n";
        /* Update the chat area */
        textarea.value += "" + line;

        updateWsLog();
    })

    document.getElementById("name").focus();

    document.getElementById("consolediv").style.visibility = 'hidden';
}

function updateWsLog() {
    wsconsole.value = socket.eventLog.map(({out, data}) => {
        return (out ? " <- " : " -> ") + JSON.stringify(data);
    }).join('\n');
}

/* Send a join message to the server */
function sendJoin() {
    const input = document.getElementById("input");
    const name = document.getElementById("name");
    const join = document.getElementById("join");
    if (name.value.length > 0) {
        socket.emit("join", {name: name.value})
        /* Disable join controls */
        name.disabled = true;
        join.disabled = true;
        input.disabled = false;
        userName = name.value;
    }
}

/* Send a chat message to the server (press ENTER on the input area) */
function sendMessage(evt) {
    const input = document.getElementById("input");
    let jsonstr;
    let msgstr;
    if (evt.keyCode === 13 && input.value.length > 0) {

        msgstr = input.value;
        let target = getTarget(msgstr.replace(/,/g, ""));
        let message = cleanTarget(msgstr).replace(/(\r\n|\n|\r)/gm, "");

        socket.emit("message", {
            name: userName,
            target, message
        })
        input.value = "";
        updateWsLog();
    }
}

/* Send a join message if the user presses ENTER in the name area */
function checkJoin(evt) {
    const name = document.getElementById("name");
    const input = document.getElementById("input");
    if (evt.keyCode === 13 && name.value.length > 0) {
        sendJoin();
        updateWsLog();
        input.focus();
    }
}

/* Get the @User (target) for a message */
function getTarget(str) {
    const arr = str.split(" ");
    let target = "";
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].charAt(0) === '@') {
            target = arr[i].substring(1, arr[i].length);
            target = target.replace(/(\r\n|\n|\r)/gm, "");
        }
    }
    return target;
}

/* Remove the @User (target) from a message */
function cleanTarget(str) {
    const arr = str.split(" ");
    let cleanstr = "";
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].charAt(0) !== '@') cleanstr += arr[i] + " ";
    }
    return cleanstr.substring(0, cleanstr.length - 1);
}

/* Show or hide the WebSocket console */
function showHideConsole() {
    const chkbox = document.getElementById("showhideconsole");
    const consolediv = document.getElementById("consolediv");
    if (chkbox.checked) consolediv.style.visibility = 'visible'; else consolediv.style.visibility = 'hidden';
}

/* Call connect() when the page first loads */
window.addEventListener("load", connect, false);