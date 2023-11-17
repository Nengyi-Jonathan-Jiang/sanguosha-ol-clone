package socket;

import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public abstract class AbstractSocketListener {
    protected final WebSocketServer wsServer;
    private final Map<String, SocketEventHandler> handlers = new HashMap<>();

    public AbstractSocketListener(int wsPort) {
        this.wsServer = new EventWebSocketServer(wsPort);
        wsServer.start();
        registerEventHandlers();
    }

    private void registerEventHandlers() {
        Method[] methods = this.getClass().getMethods();
        for (Method method : methods) {
            if (method.isAnnotationPresent(OnEvent.class)) {
                String eventName = method.getAnnotation(OnEvent.class).eventName();

                if (!SocketEventHandler.isValidEventHandler(method)) {
                    throw new RuntimeException(new NoSuchMethodException("Event handlers must have the signature (Socket, JSONObject)"));
                }

                handlers.put(eventName, ((socket, data) -> {
                    try {
                        method.setAccessible(true);
                        method.invoke(this, socket, data);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }));
            }
        }
    }

    protected void broadcast(String eventName, JsonObject eventData) {
        emitTo(wsServer.getConnections().stream().map(Socket::new).toList(), eventData, eventName);
    }

    protected void emitTo(Collection<Socket> sockets, JsonObject eventData, String eventName) {
        for (Socket s : sockets) {
            s.emitEvent(eventName, eventData);
        }
    }

    private void tryRunHandler(String eventName, Socket socket, JsonObject eventData) {
        if (handlers.containsKey(eventName)) {
            handlers.get(eventName).run(socket, eventData);
        }
    }

    private final Map<InetSocketAddress, Socket> connectedSockets = new HashMap<>();

    private void onOpen(WebSocket socket) {
        connectedSockets.put(socket.getRemoteSocketAddress(), new Socket(socket));
        onMessage(socket, "{eventName: \"open\"}");
    }

    private void onClose(WebSocket socket) {
        onMessage(socket, "{eventName: \"close\"}");
        connectedSockets.remove(socket.getRemoteSocketAddress());
    }

    private void onMessage(WebSocket socket, String message) {
        Socket wrappedSocket = connectedSockets.get(socket.getRemoteSocketAddress());
        wrappedSocket.setRawSocket(socket);
        JsonObject eventData = JsonParser.parseString(message).getAsJsonObject();
        String eventName = eventData.get("eventName").getAsString();
        tryRunHandler(eventName, wrappedSocket, eventData);
    }

    public void stop() throws InterruptedException {
        wsServer.stop(1000);
    }

    private class EventWebSocketServer extends WebSocketServer {
        public EventWebSocketServer(int wsPort) {
            super(new InetSocketAddress(wsPort));
        }

        @Override
        public void onOpen(WebSocket conn, ClientHandshake handshake) {
            AbstractSocketListener.this.onOpen(conn);
        }

        @Override
        public void onClose(WebSocket conn, int code, String reason, boolean remote) {
            AbstractSocketListener.this.onClose(conn);
        }

        @Override
        public void onMessage(WebSocket conn, String message) {
            AbstractSocketListener.this.onMessage(conn, message);
        }

        @Override
        public void onMessage(WebSocket conn, ByteBuffer message) {
        }

        @Override
        public void onError(WebSocket conn, Exception ex) {
        }

        @Override
        public void onStart() {
            System.out.println("Websocket server started on port " + getPort());
            setConnectionLostTimeout(0);
            setConnectionLostTimeout(100);
        }
    }
}