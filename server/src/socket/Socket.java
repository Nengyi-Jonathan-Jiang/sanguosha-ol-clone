package socket;

import com.google.gson.JsonObject;
import org.java_websocket.WebSocket;

import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

/** A socket connection. The socket instance is guaranteed to be unique for each unique connection */
public class Socket {
    private WebSocket socket;
    private final Map<String, Object> data = new HashMap<>();

    @SuppressWarnings("unchecked")
    public <T> T getData(String key) {
        return (T) data.get(key);
    }
    public <T> void setData(String key, T value) {
        data.put(key, value);
    }

    Socket(WebSocket socket) {
        this.socket = socket;
    }

    public WebSocket getRawSocket() {
        return socket;
    }

    public void emitEvent(String eventName) {
        emitEvent(eventName, new JsonObject());
    }

    public void emitEvent(String eventName, JsonObject data) {
        data.addProperty("eventName", eventName);
        socket.send(data.toString());
    }

    public void closeConnection() {
        socket.close();
    }

    @Override
    public String toString() {
        return "Socket@%d".formatted(id());
    }

    @Override
    public int hashCode() {
        return id();
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof Socket && ((Socket) obj).id() == id();
    }

    public int id() {
        InetSocketAddress socketAddress = socket.getRemoteSocketAddress();
        return socketAddress.hashCode();
    }

    void setRawSocket(WebSocket socket) {
        this.socket = socket;
    }
}
