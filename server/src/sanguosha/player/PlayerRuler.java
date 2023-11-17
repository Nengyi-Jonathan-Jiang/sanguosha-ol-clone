package sanguosha.player;

import sanguosha.characters.AbstractCharacter;

import java.util.List;

public class PlayerRuler extends Player {

    public PlayerRuler(AbstractCharacter character) {
        super(character);
    }

    @Override
    public PlayerRole getRole() {
        return PlayerRole.RULER;
    }

    @Override
    public boolean testWinCondition(List<Player> players) {
        return players.stream().noneMatch(PlayerRole::isBadGuy);
    }

    @Override
    public void applyDeathEffect(Player killer) {

    }

    public void onKillLoyalist() {
        // TODO
    }
}
