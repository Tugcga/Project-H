export const TILE_SIZE: f32 = 1.5;  // tile size of the map
export const QUAD_SIZE: f32 = 18.0;  // the size of one quad, used for tracking neighborhood movable items (in fact close to tile_size * visible_radius)
export const TILES_VISIBLE_RADIUS: i32 = 12;
export const PLAYER_RADIUS: f32 = 0.5;
export const MONSTER_RADIUS: f32 = 0.35;
export const PLAYER_SPEED: f32 = 5.0;
export const MONSTER_SPEED: f32 = 3.5;
export const PLAYER_ROTATION_SPEED: f32 = 10.0;
export const MONSTER_ROTATION_SPEED: f32 = 7.5;
export const MONSTER_RANDOM_WALK_TARGET_RADIUS: f32 = 3.0;  // radius where we select next random point to walk in
export const MONSTER_IDDLE_TIME = [0.5, 1.5];  // in seconds
export const MONSTERS_PER_ROOM = [3, 7];

export const EPSILON: f32 = 0.0001;

export enum STATE {
    IDDLE,
    WALK
}