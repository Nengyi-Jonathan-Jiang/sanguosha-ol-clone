/** @typedef {(eventName: string, eventData: any)=>any} SocketEventHandler */

class Socket {
    /** @type {WebSocket} */
    #webSocket;
    /** @type {Map<string, SocketEventHandler>} */
    #handlers;

    /** @param {String} url */
    constructor(url) {
        this.#webSocket = new WebSocket(url);
        this.#handlers = new Map;
        this.#webSocket.onmessage = ({data}) => {
            let eventData = JSON.parse(data);
            let {eventName} = eventData;
            if(this.#handlers.has(eventName)) {
                this.#handlers.get(eventName)(eventName, eventData);
            }
        };
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
        this.#webSocket.send(JSON.stringify({...eventData, eventName}));
    }
}
