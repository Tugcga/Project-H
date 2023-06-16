export const TILE_PIXELS_SIZE: number = 50; // the number of pixels for one tile of the level
export const CLICK_CURSOR_TIME: number = 400; // in milliseconds
export const CLICK_CURSOR_RADIUS: number = 0.5; // in world units
export const MAP_TILE_PIXELS_SIZES: number[] = [3, 5, 8, 12, 15, 20, 30, 40, 50];  // arrays of different sizes for map
export const CAMERA_LERP_COEFFICIENT: number = 1.0;  // for smooth camera

// delay between mouse clicks, when the button is hold
export const FIRST_MOUSE_CLICK_DELTA: number = 500;  // in miliseconds
export const OTHER_MOUSE_CLICK_DELTA: number = 30;  // in miliseconds

// the same as in wasm-side
export enum MOVE_STATUS {
    NONE,
    WALK,
    SHIFT
}

export enum ACTION {
    SHIFT,
}

export enum COOLDAWN {
    SHIFT,
}