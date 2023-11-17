package server.waitingroom;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class WaitingRoom {

    private final UUID roomID;
    private final List<WaitingRoomPlayer> players = new ArrayList<>();

    public WaitingRoom(UUID roomID) {
        this.roomID = roomID;
    }

    public UUID getID() {
        return roomID;
    }

    public List<WaitingRoomPlayer> players() {
        return players;
    }

    public void addPlayer(WaitingRoomPlayer player) {
        players.add(player);
    }
}
