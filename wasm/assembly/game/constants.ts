export const EPSILON: f32 = 0.0001;

export enum STATE {
    IDDLE,
    IDDLE_WAIT,  // used for monsters, when it shoul start to move after some time
    WALK_TO_POINT,
    SHIFTING,  // fast move with invulnerability
    CASTING,  // apply some skill
    STUN,  // can not do anything
    SHIELD,  // stay at defence position with active shield
    TALK,  // player talk with npc
    DEAD,
}

export enum ACTOR {
    PLAYER,
    MONSTER
}

export enum MOVE_STATUS {
    NONE,
    WALK,
    SHIFT
}

export enum COOLDAWN {
    SHIFT,
    MELEE_ATTACK,
}

// this enum used to define the action at the end of user click
export enum TARGET_ACTION {
    NONE,
    ATACK,
}

// this enum define the type of cast
export enum CAST_ACTION {
    MELEE_ATACK,
    RANGE_ATACK
}

export enum DAMAGE_TYPE {
    UNKNOWN,
    MELEE,
    RANGE
}

export enum START_CAST_STATUS {
    OK,
    FAIL,  // in general sence
    FAIL_COOLDAWN,
    FAIL_DISTANCE,
    FAIL_WRONG_CAST,  // try to start wrong cast type
    FAIL_FORBIDDEN,  // when the entity already in cast state, or in state where we can not start the cast
}