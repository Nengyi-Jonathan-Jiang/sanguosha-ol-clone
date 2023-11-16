package wrapper;

import com.google.gson.JsonObject;
import org.java_websocket.WebSocket;

public interface SocketEventHandler {
    void run(WebSocket socket, JsonObject data);
}
