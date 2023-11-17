package sanguosha.player;

import sanguosha.characters.AbstractCharacter;

import java.util.List;

public abstract class Player {
    private int HP;
    private final AbstractCharacter character;

    protected Player(AbstractCharacter character) {
        this.character = character;
        this.HP = character.getBaseHP();
    }

    public abstract PlayerRole getRole();
    public abstract boolean testWinCondition(List<Player> players);
    public abstract void applyDeathEffect(Player killer);

    protected void onKillRebel() {
        // TODO
    }
}
