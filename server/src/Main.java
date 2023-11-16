import com.google.gson.JsonObject;
import wrapper.OnEvent;
import wrapper.Server;
import wrapper.Socket;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class Main {
    public static void main(String[] args) throws InterruptedException, IOException {
        int port = 8080;
        int wsPort = 8081;

        Server s = new Server(port, wsPort) {

            @OnEvent(eventName = "open")
            public void onOpen(Socket socket, JsonObject data) {
                System.out.println("Socket " + socket.id() + " joined");
            }

            @OnEvent(eventName = "message")
            public void onMessage(Socket socket, JsonObject data) {
                System.out.println("Socket " + socket.id() + " sent " + data);
                broadcast("message", data);
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
