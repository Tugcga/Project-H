import { ACTOR } from "../constants";

export class ActorTypeComponent {
    private m_type: ACTOR;

    constructor(in_type: ACTOR) {
        this.m_type = in_type;
    }

    type(): ACTOR {
        return this.m_type;
    }

    toString(): string {
        if(this.m_type == ACTOR.PLAYER) {
            return "player";
        } else if(this.m_type == ACTOR.MONSTER) {
            return "monster";
        } else if (this.m_type == ACTOR.BULLET) {
            return "bullet";
        } else {
            return "unknown";
        }
    }
}