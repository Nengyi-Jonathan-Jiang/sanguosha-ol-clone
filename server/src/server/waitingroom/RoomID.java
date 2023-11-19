package server.waitingroom;

public class RoomID {
    private static int counter = (int) (Math.random() * 0x100000);

    public final int id;
    private final String asString;

    private RoomID(int id) {
        this.id = id;
        String result = Integer.toHexString(id).toUpperCase();
        result = "".repeat(5 - result.length()) + result;
        this.asString = result;
    }

    public static RoomID fromString(String s) {
        return new RoomID(Integer.parseInt(s, 16));
    }

    public String toString() {
        return asString;
    }

    @Override
    public int hashCode() {
        return id;
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof RoomID && ((RoomID) obj).id == id;
    }

    public static RoomID getRandom() {
        // Random-looking enough for our purposes, and guaranteed to never repeat for 2^20 calls
        return new RoomID((1018177 * ++counter) & 0xfffff);
    }
}
