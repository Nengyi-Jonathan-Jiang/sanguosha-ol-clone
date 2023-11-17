/** @typedef {(eventData: any)=>any} SocketEventHandler */

class Socket {
    /** @type {WebSocket} */
    #webSocket;
    /** @type {Map<string, SocketEventHandler>} */
    #handlers;

    #eventLog = [];

    /** @param {String} url */
    constructor(url) {
        this.#webSocket = new WebSocket(url);
        this.#handlers = new Map;
        this.#webSocket.onmessage = ({data}) => {
            console.log("received " + data);
            let eventData = JSON.parse(data);
            this.#eventLog.push({out: false, data: eventData});
            let {eventName} = eventData;
            console.log(eventName, eventData);
            if(this.#handlers.has(eventName)) {
                this.#handlers.get(eventName)(eventData);
            }
        };
    }

    get socket() {
        return this.#webSocket
    }

    get eventLog() {
        return [...this.#eventLog];
    }

    /**
     * @param {string} eventName
     * @param {SocketEventHandler} handler
     */
    addHandler(eventName, handler) {
        this.#handlers.set(eventName, handler);
    }

    /**
     * @param {string} eventName
     * @param {any} eventData
     */
    emit(eventName, eventData) {
        this.#eventLog.push({out: true, data: eventData});
        this.#webSocket.send(JSON.stringify({...eventData, eventName}));
    }
}
