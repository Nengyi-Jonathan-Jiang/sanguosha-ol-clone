package wrapper;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

public abstract class Server {
    private static final Map<String, String> MIMETypes = Map.of(
        "html", "text/html",
        "js", "text/javascript",
        "css", "text/css",

        "jpg", "image/jpeg",
        "png", "image/png",
        "ico", "image/x-icon",
        "svg", "image/svg+xml",

        "ttf", "font/ttf",
        "otf", "font/otf",

        "json", "application/json"
    );

    protected final WebSocketServer wsServer;
    protected final HttpServer server;
    private final Map<String, SocketEventHandler> handlers = new HashMap<>();

    public Server(int port, int wsPort) {
        this.wsServer = new EventWebSocketServer(wsPort);
        this.server = startStaticFileServer(port, wsPort);

        registerEventHandlers();
    }

    private void registerEventHandlers() {
        Method[] methods = this.getClass().getMethods();
        for (Method method : methods) {
            if (method.isAnnotationPresent(OnEvent.class)) {
                String eventName = method.getAnnotation(OnEvent.class).eventName();

                Class<?>[] types = method.getParameterTypes();
                if (types.length != 2 || !types[0].isAssignableFrom(Socket.class) || !types[1].isAssignableFrom(JsonObject.class)) {
                    throw new RuntimeException(new NoSuchMethodException("Event handlers must have the signature (Socket, JSONObject)"));
                }

                handlers.put(eventName, ((socket, data) -> {
                    try {
                        method.setAccessible(true);
                        method.invoke(this, new Socket(socket), data);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }));
            }
        }
    }

    private HttpServer startStaticFileServer(int port, int wsPort) {
        try {
            InetSocketAddress host = new InetSocketAddress("localhost", port);
            HttpServer server = HttpServer.create(host, 0);
            server.createContext("/", this::handleRequest);
            server.start();
            wsServer.start();

            System.out.println("Server is running at http://" + host.getHostName() + ":" + port + "/");
            System.out.println("Websocket Server is running at ws://" + host.getHostName() + ":" + wsPort + "/");
            return server;
        } catch (IOException e) {
            System.out.println("Failed to create server");
            throw new RuntimeException(e);
        }
    }

    protected void broadcast(String eventName, JsonObject eventData) {
        emitTo(wsServer.getConnections().stream().map(Socket::new).toList(), eventData, eventName);
    }

    protected void emitTo(Collection<Socket> sockets, JsonObject eventData, String eventName) {
        for(Socket s : sockets) {
            s.emitEvent(eventName, eventData);
        }
    }

    private void tryRunHandler(String eventName, WebSocket socket, JsonObject eventData) {
        if (handlers.containsKey(eventName)) {
            handlers.get(eventName).run(socket, eventData);
        }
    }

    private void onOpen(WebSocket socket) {
        tryRunHandler("open", socket, null);
    }

    private void onClose(WebSocket socket) {
        tryRunHandler("close", socket, null);
    }

    private void onMessage(WebSocket socket, String message) {
        JsonObject eventData = JsonParser.parseString(message).getAsJsonObject();
        String eventName = eventData.get("eventName").getAsString();
        tryRunHandler(eventName, socket, eventData);
    }

    private void handleRequest(HttpExchange t) throws IOException {
        URI uri = t.getRequestURI();
        if (uri.toString().endsWith("/")) {
            uri = uri.resolve("index.html");
        }
        String path = uri.getPath();
        File local = null;
        if (path.startsWith("/")) {
            local = new File("./client/", path.substring(1));
        }
        System.out.print("GET \"" + uri + "\":");
        if (local != null && local.exists()) {
            sendFile(t, local);
        } else {
            send404Error(t, uri);
        }
        System.out.println();
    }

    private static void send404Error(HttpExchange t, URI uri) throws IOException {
        System.out.println(" Status=404");
        String response = "File not found %s".formatted(uri);
        t.sendResponseHeaders(404, response.length());
        try (OutputStream os = t.getResponseBody()) {
            os.write(response.getBytes());
        }
    }

    private static void sendFile(HttpExchange t, File local) throws IOException {
        String filename = local.getName();
        String ext = filename.substring(filename.lastIndexOf('.') + 1);
        if (MIMETypes.containsKey(ext)) {
            System.out.print(" " + MIMETypes.get(ext));
            t.getResponseHeaders().add("Content-Type", MIMETypes.get(ext));
        }
        System.out.print("  Status=200 (size " + local.length() + " bytes)");
        t.sendResponseHeaders(200, local.length());
        try (OutputStream out = t.getResponseBody()) {
            Files.copy(local.toPath(), out);
        }
    }

    public void stop() throws InterruptedException {
        var t1 = new Thread(() -> {
            server.stop(1000);
        });
        var t2 = new Thread(() -> {
            try {
                wsServer.stop(1000);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
        });
        t1.start();
        t2.start();
        t1.join();
        t2.join();
    }

    private class EventWebSocketServer extends WebSocketServer {
        public EventWebSocketServer(int wsPort) {
            super(new InetSocketAddress(wsPort));
        }

        @Override
        public void onOpen(WebSocket conn, ClientHandshake handshake) {
            Server.this.onOpen(conn);
        }

        @Override
        public void onClose(WebSocket conn, int code, String reason, boolean remote) {
            Server.this.onClose(conn);
        }

        @Override
        public void onMessage(WebSocket conn, String message) {
            Server.this.onMessage(conn, message);
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