package socket;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.file.Files;
import java.util.Map;

public class StaticFileServer {
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

    protected final HttpServer server;

    public StaticFileServer(int port) {
        this.server = startStaticFileServer(port);

    }

    private HttpServer startStaticFileServer(int port) {
        try {
            InetSocketAddress host = new InetSocketAddress("localhost", port);
            HttpServer server = HttpServer.create(host, 0);
            server.createContext("/", this::handleRequest);
            server.start();

            System.out.println("Server is running at http://" + host.getHostName() + ":" + port + "/");
            return server;
        } catch (IOException e) {
            System.out.println("Failed to create server");
            throw new RuntimeException(e);
        }
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
        server.stop(1000);
    }
}
