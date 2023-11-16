package wrapper;

import com.google.gson.JsonObject;
import org.java_websocket.WebSocket;

import java.net.InetSocketAddress;

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

    public int id() {
        InetSocketAddress socketAddress = socket.getRemoteSocketAddress();
        return socketAddress.hashCode();
    }

    @Override
    public int hashCode() {
        return id();
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof Socket && ((Socket) obj).id() == id();
    }
}
