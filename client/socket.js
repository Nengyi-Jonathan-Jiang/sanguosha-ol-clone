/** @typedef {(eventData: any)=>any} SocketEventHandler */

class Socket {
    /** @type {WebSocket} */
    #webSocket;
    /** @type {Map<string, SocketEventHandler>} */
    #handlers;

    #eventLog = [];

    #activePromises = [];

    /** @param {String} url */
    constructor(url) {
        this.#webSocket = new WebSocket(url);
        this.#handlers = new Map;
        this.#webSocket.onmessage = ({data}) => {
            let eventData = JSON.parse(data);
            this.#eventLog.push({out: false, data: eventData});
            let {eventName} = eventData;
            console.log(eventName, eventData);
            this.#activePromises.forEach(i => i(eventData));
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
     * @param {any} [eventData]
     */
    emit(eventName, eventData={}) {
        let data = {...eventData, eventName};
        this.#eventLog.push({out: true, data});
        this.#webSocket.send(JSON.stringify(data));

        return new Promise(resolve => {
            this.#activePromises.push(data => resolve(data))
        })
    }
}
