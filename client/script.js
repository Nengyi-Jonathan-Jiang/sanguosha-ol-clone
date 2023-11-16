const socket = new Socket("ws://localhost:8081/");


var wsocket;    // Websocket connection
var userName;   // User's name
var textarea;   // Chat area
var wsconsole;  // Websocket console area
var userlist;   // User list area
/* Connect to the Websocket endpoint
 * Set a callback for incoming messages */
function connect() {
    textarea = document.getElementById("textarea");
    wsconsole = document.getElementById("wsconsole");
    userlist = document.getElementById("userlist");
    wsocket = new WebSocket("ws://localhost:8081/");
    wsocket.onmessage = onMessage;
    document.getElementById("name").focus();

    document.getElementById("consolediv").style.visibility = 'hidden';
}
/* Callback function for incoming messages
 * evt.data contains the message
 * Update the chat area, user's area and Websocket console */
function onMessage(evt) {
    var line = "";
    /* Parse the message into a JavaScript object */
    var msg = JSON.parse(evt.data);
    if (msg.eventName === "message") {
        line = msg.name + ": ";
        if (msg.target.length > 0)
            line += "@" + msg.target + " ";
        line += msg.message + "\n";
        /* Update the chat area */
        textarea.value += "" + line;
    } else if (msg.eventName === "info") {
        line = "[--" + msg.info + "--]\n";
        /* Update the chat area */
        textarea.value += "" + line;
    } else if (msg.eventName === "users") {
        line = "Users:\n";
        for (var i=0; i < msg.userlist.length; i++)
            line += "-" + msg.userlist[i] + "\n";
        /* Update the user list area */
        userlist.value = line;
    }
    textarea.scrollTop = 999999;
    /* Update the Websocket console area */
    wsconsole.value += "-> " +  evt.data + "\n";
    wsconsole.scrollTop = 999999;
}
/* Send a join message to the server */
function sendJoin() {
    var input = document.getElementById("input");
    var name = document.getElementById("name");
    var join = document.getElementById("join");
    var jsonstr;
    if (name.value.length > 0) {
        /* Create a message as a JavaScript object */
        var joinMsg = {};
        joinMsg.eventName = "join";
        joinMsg.name = name.value;
        /* Convert the message to JSON */
        jsonstr = JSON.stringify(joinMsg);
        /* Send the JSON text */
        wsocket.send(jsonstr);
        /* Disable join controls */
        name.disabled = true;
        join.disabled = true;
        input.disabled = false;
        userName = name.value;
        /* Update the Websocket console area */
        wsconsole.value += "<- " + jsonstr + "\n";
        wsconsole.scrollTop = 999999;
    }
}
/* Send a chat message to the server (press ENTER on the input area) */
function sendMessage(evt) {
    var input = document.getElementById("input");
    var jsonstr;
    var msgstr;
    if (evt.keyCode === 13 && input.value.length > 0) {
        /* Create a chat message as a JavaScript object */
        var chatMsg = {};
        chatMsg.eventName = "message";
        chatMsg.name = userName;
        msgstr = input.value;
        chatMsg.target = getTarget(msgstr.replace(/,/g, ""));
        chatMsg.message = cleanTarget(msgstr);
        chatMsg.message = chatMsg.message.replace(/(\r\n|\n|\r)/gm,"");
        /* Convert the object to JSON */
        jsonstr = JSON.stringify(chatMsg);
        /* Send the message as JSON text */
        wsocket.send(jsonstr);
        input.value = "";
        /* Update the Websocket console area */
        wsconsole.value += "<- " + jsonstr + "\n";
        wsconsole.scrollTop = 999999;
    }
}
/* Send a join message if the user presses ENTER in the name area */
function checkJoin(evt) {
    var name = document.getElementById("name");
    var input = document.getElementById("input");
    if (evt.keyCode === 13 && name.value.length > 0) {
        sendJoin();
        input.focus();
    }
}
/* Get the @User (target) for a message */
function getTarget(str) {
    var arr = str.split(" ");
    var target = "";
    for (var i=0; i<arr.length; i++) {
        if (arr[i].charAt(0) === '@') {
            target = arr[i].substring(1,arr[i].length);
            target = target.replace(/(\r\n|\n|\r)/gm,"");
        }
    }
    return target;
}
/* Remove the @User (target) from a message */
function cleanTarget(str) {
    var arr = str.split(" ");
    var cleanstr = "";
    for (var i=0; i<arr.length; i++) {
        if (arr[i].charAt(0) !== '@')
            cleanstr += arr[i] + " ";
    }
    return cleanstr.substring(0,cleanstr.length-1);
}
/* Show or hide the WebSocket console */
function showHideConsole() {
    var chkbox = document.getElementById("showhideconsole");
    var consolediv = document.getElementById("consolediv");
    if (chkbox.checked)
        consolediv.style.visibility = 'visible';
    else
        consolediv.style.visibility = 'hidden';
}
/* Call connect() when the page first loads */
window.addEventListener("load", connect, false);