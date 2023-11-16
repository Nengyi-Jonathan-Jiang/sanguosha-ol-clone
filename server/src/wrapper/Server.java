package wrapper;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.util.Collection;
import java.util.Map;

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
            "json", "application/json"
    );

    protected final WebSocketServer wsServer;
    protected final HttpServer server;

    public Server(int port, int wsPort) {
        this.wsServer = new WebSocketServer(new InetSocketAddress(wsPort)) {
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
                Server.this.onMessage(conn, message);
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
        };

        try {
            InetSocketAddress host = new InetSocketAddress("localhost", port);
            server = HttpServer.create(host, 0);
            server.createContext("/", this::handleRequest);
            server.start();
            wsServer.start();

            System.out.println("Server is running at http://" + host.getHostName() + ":" + port + "/");
            System.out.println("Websocket Server is running at ws://" + host.getHostName() + ":" + wsPort + "/");
        } catch (IOException e) {
            System.out.println("Failed to create server");
            throw new RuntimeException(e);
        }
    }

    protected void broadcast(String message) {
        wsServer.broadcast(message);
    }

    protected void broadcast(ByteBuffer message) {
        wsServer.broadcast(message);
    }

    protected void broadcast(String message, Collection<WebSocket> sockets) {
        wsServer.broadcast(message, sockets);
    }

    protected abstract void onOpen(WebSocket socket);

    protected abstract void onClose(WebSocket socket);

    protected abstract void onMessage(WebSocket socket, String message);

    protected abstract void onMessage(WebSocket socket, ByteBuffer message);

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
}