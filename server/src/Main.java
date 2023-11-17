import server.waitingroom.WaitingRoomSocketListener;
import socket.AbstractSocketListener;
import socket.StaticFileServer;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws InterruptedException, IOException {
        int port = 8080;
        int waitingRoomWSPort = 8081;
        int gameWSPort = 8082;

        StaticFileServer server = new StaticFileServer(port);

        AbstractSocketListener waitingRoomSocketListener = new WaitingRoomSocketListener(waitingRoomWSPort);


        System.out.println("Starting server... ");

        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        while (true) {
            String input = in.readLine();
            if (input.equals("exit")) {
                System.exit(0);
            }
        }
    }
}
