import wrapper.Server;
import wrapper.StaticFileServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws InterruptedException, IOException {
        int port = 8080;

        StaticFileServer server = new StaticFileServer(port);
        System.out.println("Started static file server on port 8080");

        Server s = new Server(port + 1);
        System.out.println("Starting websocket server on port " + s.getPort());
        s.start();

        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        while (true) {
            String input = in.readLine();
            s.broadcast(input);
            if (input.equals("exit")) {
                s.stop(1000);
                break;
            }
        }
    }
}
