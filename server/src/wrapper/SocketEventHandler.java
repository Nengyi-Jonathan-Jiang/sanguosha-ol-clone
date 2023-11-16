package wrapper;

import org.java_websocket.WebSocket;
import org.json.JSONObject;

public interface SocketEventHandler {
    void run(WebSocket socket, JSONObject data);
}
