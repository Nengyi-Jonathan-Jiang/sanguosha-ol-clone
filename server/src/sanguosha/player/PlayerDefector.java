package sanguosha.player;

import sanguosha.characters.AbstractCharacter;

import java.util.List;

public class PlayerDefector extends Player {
    public PlayerDefector(AbstractCharacter character) {
        super(character);
    }

    @Override
    public PlayerRole getRole() {
        return PlayerRole.DEFECTOR;
    }

    @Override
    public boolean testWinCondition(List<Player> players) {
        return players.size() == 1 && players.get(0) == this;
    }

    @Override
    public void applyDeathEffect(Player killer) {

    }
}
