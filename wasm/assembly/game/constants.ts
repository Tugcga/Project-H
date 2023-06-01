export const EPSILON: f32 = 0.0001;

export enum STATE {
    IDDLE,
    IDDLE_WAIT,  // used for monsters, when it shoul start to move after some time
    WALK_TO_POINT,
    WALK_TO_TARGET,
    ROLLING,  // fast move with invulnerability
    CASTING,  // apply some skill (atack, fro example)
    STAN,  // can not do anythong
    ACTIVATE_DEFENCE,
    DEFENCE,  // stay at defence position
    TALK,  // player talk with npc
}

export enum ACTOR {
    PLAYER,
    MONSTER
}