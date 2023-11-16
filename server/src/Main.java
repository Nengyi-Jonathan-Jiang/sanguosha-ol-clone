import com.google.gson.JsonObject;
import org.java_websocket.WebSocket;
import wrapper.On;
import wrapper.Server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws InterruptedException, IOException {
        int port = 8080;
        int wsPort = 8081;

        Server s = new Server(port, wsPort) {

            @On(eventName = "open")
            public void onOpen(WebSocket socket, JsonObject data) {
                System.out.println("Socket " + socket.getLocalSocketAddress() + " joined");
            }

            @On(eventName = "message")
            public void onMessage(WebSocket socket, JsonObject data) {
                System.out.println(data);
                broadcast(data.toString());
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
