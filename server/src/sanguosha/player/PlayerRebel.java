package sanguosha.player;

import sanguosha.characters.AbstractCharacter;

import java.util.List;

public class PlayerRebel extends Player {

    public PlayerRebel(AbstractCharacter character) {
        super(character);
    }

    @Override
    public PlayerRole getRole() {
        return PlayerRole.REBEL;
    }

    @Override
    public boolean testWinCondition(List<Player> players) {
        return players.stream().noneMatch(PlayerRole::isRuler);
    }

    @Override
    public void applyDeathEffect(Player killer) {
        killer.onKillRebel();
    }
}
