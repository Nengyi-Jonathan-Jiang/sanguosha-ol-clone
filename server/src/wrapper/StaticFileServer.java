package wrapper;

import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;

public class StaticFileServer {
    private static final java.util.Map<String, String> MIMETypes = java.util.Map.of("html", "text/html", "js", "text/javascript", "css", "text/css", "jpg", "image/jpeg", "png", "image/png", "ico", "image/x-icon", "json", "application/json");

    private static final String prefix = "/";

    public StaticFileServer(int port) {
        InetSocketAddress host = new InetSocketAddress("localhost", port);
        HttpServer server = null;
        try {
            server = HttpServer.create(host, 0);
            server.createContext("/", StaticFileServer::handleRequest);
            server.start();
            System.out.println("Server is running at http://" + host.getHostName() + ":" + host.getPort() + prefix);
        } catch (IOException e) {
            System.out.println("Failed to create static file server");
            throw new RuntimeException(e);
        }
    }

    private static void handleRequest(com.sun.net.httpserver.HttpExchange t) throws java.io.IOException {
        java.net.URI uri = t.getRequestURI();
        if (uri.toString().endsWith("/")) {
            uri = uri.resolve("index.html");
        }
        String path = uri.getPath();
        java.io.File local = null;
        if (path.startsWith("/")) {
            local = new java.io.File("./client/", path.substring(1));
        }
        System.out.print("GET " + uri);
        if (local != null && local.exists()) {
            //String response = "This is the response of "+local.getAbsolutePath();
            String filename = local.getName();
            String ext = filename.substring(filename.lastIndexOf('.') + 1);
            if (MIMETypes.containsKey(ext)) {
                System.out.print(" " + MIMETypes.get(ext));
                t.getResponseHeaders().add("Content-Type", MIMETypes.get(ext));
            }
            System.out.print(" 200 " + local.length());
            t.sendResponseHeaders(200, local.length());
            try (java.io.OutputStream out = t.getResponseBody()) {
                java.nio.file.Files.copy(local.toPath(), out);
            }
        } else {
            System.out.println(" 404");
            String response = "File not found %s".formatted(uri);
            t.sendResponseHeaders(404, response.length());
            try (java.io.OutputStream os = t.getResponseBody()) {
                os.write(response.getBytes());
            }
        }
        System.out.println();
    }
}
