package sanguosha;

public enum PlayerAllegiance {
    SHU, WU, WEI, NONE;

    public boolean isAlliedWith(PlayerAllegiance other) {
        return this != NONE && this == other;
    }
}
