package server.waitingroom;

import socket.Socket;

import java.util.UUID;

public class WaitingRoomPlayer {
    private final UUID playerID;
    private final String playerName;
    private final Socket socket;

    public WaitingRoomPlayer(UUID playerID, String playerName, Socket socket) {
        this.playerID = playerID;
        this.playerName = playerName;
        this.socket = socket;
    }

    public Socket getSocket() {
        return socket;
    }
}
