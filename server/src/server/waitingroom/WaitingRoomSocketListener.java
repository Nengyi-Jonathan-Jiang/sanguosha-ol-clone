package server.waitingroom;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import socket.AbstractSocketListener;
import socket.OnEvent;
import socket.Socket;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public class WaitingRoomSocketListener extends AbstractSocketListener {
    private final Map<RoomID, WaitingRoom> rooms = new HashMap<>();

    public WaitingRoomSocketListener(int wsPort) {
        super(wsPort);
    }

    @OnEvent(eventName = "create-room")
    public void onCreateRoom(Socket socket, JsonObject data) {
        String playerName = data.get("player-name").getAsString();
        RoomID roomID = RoomID.getRandom();

        WaitingRoom room = new WaitingRoom(roomID);
        rooms.put(roomID, room);

        System.out.println("Created room " + roomID);

        joinRoomSuccess(socket, room, playerName);
    }

    @OnEvent(eventName = "join-room")
    public void onJoinRoom(Socket socket, JsonObject data) {
        String roomIDString = data.get("room-id").getAsString();
        String playerName = data.get("player-name").getAsString();

        RoomID roomID = RoomID.fromString(roomIDString);

        if (rooms.containsKey(roomID)) {
            joinRoomSuccess(socket, rooms.get(roomID), playerName);
        } else {
            System.out.println("Could not find room " + roomID);
            socket.emitEvent("join-room-error");
        }
    }

    private void joinRoomSuccess(Socket socket, WaitingRoom room, String playerName) {
        UUID playerID = UUID.randomUUID();

        WaitingRoomPlayer player = new WaitingRoomPlayer(playerID, playerName, socket);
        room.addPlayer(player);
        socket.setData("room", room);
        socket.setData("player", player);

        System.out.println("Player " + playerID + " joined room " + room.getID());

        JsonObject response = new JsonObject();
        response.addProperty("room-id", room.getID().toString());
        response.addProperty("player-id", playerID.toString());
        socket.emitEvent("join-room-success", response);

        broadcastUpdatedPlayerList(room);
    }

    private void broadcastUpdatedPlayerList(WaitingRoom room) {
        JsonObject data = new JsonObject();
        JsonArray playerNames = new JsonArray();
        room.players().forEach(player -> {
            playerNames.add(player.getName());
        });
        data.add("player-names", playerNames);

        broadcast(room.getSockets(), "update-player-list", data);
    }

    @OnEvent(eventName = "request-start-game")
    public void onRequestStartGame(Socket socket, JsonObject data) {
        WaitingRoom room = socket.getData("room");
        System.out.println("Started game for players in room " + room);
        broadcast(room.getSockets(), "start-game", null);
    }

    @OnEvent(eventName = "close")
    public void onClose(Socket socket, JsonObject data) {
        if(socket.hasData("room")) {
            WaitingRoom room = socket.getData("room");
            room.removePlayer(socket.getData("player"));
            broadcastUpdatedPlayerList(room);
        }
    }
}
