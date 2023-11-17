package server.waitingroom;

import com.google.gson.JsonObject;
import socket.AbstractSocketListener;
import socket.OnEvent;
import socket.Socket;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class WaitingRoomSocketListener extends AbstractSocketListener {
    private final Map<UUID, WaitingRoom> rooms = new HashMap<>();

    public WaitingRoomSocketListener(int wsPort) {
        super(wsPort);
    }

    @OnEvent(eventName = "create-room")
    public void onCreateRoom(Socket socket, JsonObject data) {
        UUID roomID = UUID.randomUUID();

        WaitingRoom room = new WaitingRoom(roomID);
        rooms.put(roomID, room);

        System.out.println("Created room " + roomID);

        joinRoomSuccess(socket, room);
    }

    @OnEvent(eventName = "join-room")
    public void onJoinRoom(Socket socket, JsonObject data) {
        String roomIDString = data.get("room-id").getAsString();

        UUID roomID = UUID.fromString(roomIDString);

        if (rooms.containsKey(roomID)) {
            joinRoomSuccess(socket, rooms.get(roomID));
        } else {
            System.out.println("Could not find room " + roomID);
            socket.emitEvent("join-room-error");
        }
    }

    private void joinRoomSuccess(Socket socket, WaitingRoom room) {
        UUID playerID = UUID.randomUUID();

        room.addPlayer(new WaitingRoomPlayer(playerID, "", socket));
        socket.setData("room", room);

        System.out.println("Player " + playerID + " joined room " + room.getID());

        JsonObject response = new JsonObject();
        response.addProperty("room-id", room.getID().toString());
        response.addProperty("player-id", playerID.toString());
        socket.emitEvent("join-room-success", response);
    }

    @OnEvent(eventName = "request-start-game")
    public void onRequestStartGame(Socket socket, JsonObject data) {
        WaitingRoom room = socket.getData("room");
        System.out.println("Started game for players in room " + room);
        room.players().forEach(player -> player.getSocket().emitEvent("start-game"));
    }
}
