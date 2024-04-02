export const DEFAULT_WIDTH: number = 1200;
export const DEFAULT_HEIGHT: number = 700;

export const RESIZABLE_WIDTH_CLASS_NAME = "resizable_width";
export const RESIZABLE_HEIGHT_CLASS_NAME = "resizable_height";

export const TILE_PIXELS_SIZE: number = 50; // the number of pixels for one tile of the level
export const CLICK_CURSOR_TIME: number = 400; // in milliseconds
export const CLICK_CURSOR_RADIUS: number = 0.5; // in world units
export const MAP_TILE_PIXELS_SIZES: number[] = [3, 5, 8, 12, 15, 20, 30, 40, 50];  // arrays of different sizes for map
export const CAMERA_LERP_COEFFICIENT: number = 1.0;  // for smooth camera

// delay between mouse clicks, when the button is hold
export const FIRST_MOUSE_CLICK_DELTA: number = 500;  // in milliseconds
export const OTHER_MOUSE_CLICK_DELTA: number = 30;  // in milliseconds
export const DOUBLE_TOUCH_DELTA: number = 200;
export const DOUBLE_TOUCH_CURSOR_DELTA: number = 2.0; // if second click outside of the square with side = 2 x value, then interpret click as single click

export enum EFFECT {
    MELEE_ATTACK,
    RANGE_ATTACK,
    HAND_ATTACK,
    STUN,
    HIDE_ACTIVATION,
    SHADOW_ATTACK,
}

// the same as in wasm-side
export enum ACTOR {
    PLAYER,
    MONSTER,
    BULLET,
}

// sync with wasm side
export enum BULLET_TYPE {
    ARROW,
}

// use one of these keys when entity is removed from the scene
// should be the same as in wasm side
export enum REMOVE_REASON {
    VISIBILITY_OUT,
    COME_TARGET,
    DAMAGE_ELIMINATE
}

export enum MOVE_STATUS {
    NONE,
    WALK,
    SHIFT
}

export enum TARGET_ACTION {
    NONE,
    ATTACK,
}

export enum COOLDAWN {
    SHIFT,
    HAND_ATTACK,
    MELEE_ATTACK,
    RANGE_ATTACK,
    HIDE_ACTIVATION,
    SHADOW_ATTACK,
}

export enum DAMAGE_TYPE {
    UNKNOWN,
    MELEE,
    RANGE,
    ULTIMATE,
}