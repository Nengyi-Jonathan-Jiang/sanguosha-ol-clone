package sanguosha.characters;

import sanguosha.PlayerAllegiance;

public abstract class AbstractCharacter {
    public abstract PlayerAllegiance getAllegiance();
    public abstract int getBaseHP();
    public abstract PlayerAbility[] getAbilities();
}
