import org.java_websocket.WebSocket;
import wrapper.Server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.ByteBuffer;

public class Main {
    public static void main(String[] args) throws InterruptedException, IOException {
        int port = 8080;
        int wsPort = 8081;

        Server s = new Server(port, wsPort) {
            @Override
            protected void onOpen(WebSocket socket) {

            }

            @Override
            protected void onClose(WebSocket socket) {

            }

            @Override
            protected void onMessage(WebSocket socket, String message) {
                System.out.println(socket.getResourceDescriptor() + " : " + message);
                broadcast(message);
            }

            @Override
            protected void onMessage(WebSocket socket, ByteBuffer message) {

            }
        };
        System.out.println("Starting server... ");

        BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
        while (true) {
            String input = in.readLine();
            if (input.equals("exit")) {
                s.stop();
                break;
            }
        }
    }
}
