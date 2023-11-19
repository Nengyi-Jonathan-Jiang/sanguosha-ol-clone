package server.waitingroom;

import socket.Socket;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class WaitingRoom {

    private final RoomID roomID;
    private final List<WaitingRoomPlayer> players = new ArrayList<>();

    public WaitingRoom(RoomID roomID) {
        this.roomID = roomID;
    }

    public RoomID getID() {
        return roomID;
    }

    public List<WaitingRoomPlayer> players() {
        return players;
    }

    public void addPlayer(WaitingRoomPlayer player) {
        players.add(player);
    }

    public void removePlayer(WaitingRoomPlayer player) {
        players.remove(player);
    }

    public List<Socket> getSockets() {
        return players().stream().map(WaitingRoomPlayer::getSocket).collect(Collectors.toList());
    }
}