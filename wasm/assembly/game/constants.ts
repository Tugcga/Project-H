export const EPSILON: f32 = 0.0001;

export const ASSERT_ERRORS: bool = true;

export enum STATE {
    IDDLE,
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
    HAND_ATTACK,
    MELEE_ATTACK,
    RANGE_ATTACK,
    HIDE_ACTIVATION,
    SHADOW_ATTACK,
}

// this enum used to define the action at the end of user click
export enum TARGET_ACTION {
    NONE,
    ATTACK,
}

// what type of the target point
export enum TARGET_ACTION_TYPE {
    NONE,  // target is not required
    ENTITY,  // target is entity
    POSITION,  // target is position
}

// this enum define the type of cast
export enum CAST_ACTION {
    HANDS_ATTACK,
    MELEE_ATTACK,
    RANGE_ATTACK,
    HIDE_ACTIVATION,
    SHADOW_ATTACK
}

export enum DAMAGE_TYPE {
    UNKNOWN,
    MELEE,
    RANGE,
    ULTIMATE,  // infinite value without any protection
}

export enum START_CAST_STATUS {
    OK,
    FAIL,  // in general sence
    FAIL_COOLDAWN,
    FAIL_DISTANCE,
    FAIL_WRONG_CAST,  // try to start wrong cast type
    FAIL_FORBIDDEN,  // when the entity already in cast state, or in state where we can not start the cast
}

export enum UPDATE_TARGET_ACTION_STATUS {
    YES,
    NO,
    FORBIDDEN
}

export enum INVENTORY_ITEM_TYPE {
    UNKNOWN,
    WEAPON,
}

export enum WEAPON_TYPE {
    UNKNOWN,
    SWORD,
    BOW,
}

export enum WEAPON_DAMAGE_TYPE {
    UNKNOWN,
    EMPTY,  // for free hands
    MELEE,  // for swords
    RANGE,  // for bows
}