package sanguosha.player;

import sanguosha.characters.AbstractCharacter;

import java.util.List;

public class PlayerLoyalist extends Player {
    public PlayerLoyalist(AbstractCharacter character) {
        super(character);
    }

    @Override
    public PlayerRole getRole() {
        return PlayerRole.LOYALIST;
    }

    @Override
    public boolean testWinCondition(List<Player> players) {
        return players.stream().noneMatch(PlayerRole::isBadGuy);
    }

    @Override
    public void applyDeathEffect(Player killer) {
        if (PlayerRole.isRuler(killer)) {
            ((PlayerRuler) killer).onKillLoyalist();
        }
    }
}
