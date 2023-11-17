package sanguosha.player;

import com.google.gson.JsonElement;
import com.google.gson.JsonPrimitive;

import java.util.List;
import java.util.function.Consumer;
import java.util.function.Predicate;

public enum PlayerRole {
    RULER, LOYALIST, REBEL, DEFECTOR;

    public static PlayerRole[] getRoleDistributionForNumberPlayers(int numPlayers) {
        return switch (numPlayers) {
            case 3  -> new PlayerRole[]{RULER, REBEL, DEFECTOR};
            case 4  -> new PlayerRole[]{RULER, LOYALIST, REBEL, DEFECTOR};
            case 5  -> new PlayerRole[]{RULER, LOYALIST, REBEL, REBEL, DEFECTOR};
            case 6  -> new PlayerRole[]{RULER, LOYALIST, REBEL, REBEL, REBEL, DEFECTOR};
            case 7  -> new PlayerRole[]{RULER, LOYALIST, LOYALIST, REBEL, REBEL, REBEL, DEFECTOR};
            case 8  -> new PlayerRole[]{RULER, LOYALIST, LOYALIST, REBEL, REBEL, REBEL, REBEL, DEFECTOR};
            case 9  -> new PlayerRole[]{RULER, LOYALIST, LOYALIST, LOYALIST, REBEL, REBEL, REBEL, REBEL, DEFECTOR};
            case 10 -> new PlayerRole[]{RULER, LOYALIST, LOYALIST, LOYALIST, REBEL, REBEL, REBEL, REBEL, DEFECTOR, DEFECTOR};
            default -> throw new RuntimeException("Invalid number of players: " + numPlayers);
        };
    }

    public static boolean isRuler(Player player) {
        return player.getRole() == RULER;
    }
    public static boolean isLoyalist(Player player) {
        return player.getRole() == LOYALIST;
    }
    public static boolean isRebel(Player player) {
        return player.getRole() == REBEL;
    }
    public static boolean isDefector(Player player) {
        return player.getRole() == DEFECTOR;
    }
    public static boolean isBadGuy(Player player) {
        return isRebel(player) || isDefector(player);
    }
    public static boolean isGoodGuy(Player player) {
        return isLoyalist(player) || isRuler(player);
    }

    public JsonElement toJSON() {
        return switch (this) {
            case RULER -> new JsonPrimitive(0);
            case LOYALIST -> new JsonPrimitive(1);
            case REBEL -> new JsonPrimitive(2);
            case DEFECTOR -> new JsonPrimitive(3);
        };
    }
}
