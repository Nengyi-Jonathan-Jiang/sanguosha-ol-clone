package server.game;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import server.waitingroom.RoomID;
import server.waitingroom.WaitingRoom;
import server.waitingroom.WaitingRoomPlayer;
import socket.AbstractSocketListener;
import socket.OnEvent;
import socket.Socket;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class GameSocketListener extends AbstractSocketListener {
    private final Map<RoomID, WaitingRoom> rooms = new HashMap<>();

    public GameSocketListener(int wsPort) {
        super(wsPort);
    }


}
