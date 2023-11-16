package wrapper;

import com.google.gson.JsonObject;
import org.java_websocket.WebSocket;

public class Socket {
    private final WebSocket socket;

    public Socket(WebSocket socket) {
        this.socket = socket;
    }

    public WebSocket getRawSocket() {
        return socket;
    }

    public void emitEvent(String eventName, JsonObject data) {
        data.addProperty("eventName", eventName);
        socket.send(data.toString());
    }

    public void closeConnection() {
        socket.close();
    }
}
