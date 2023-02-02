import { Level } from "../promethean/level";
import { List } from "../pathfinder/common/list"; 
import { QUAD_SIZE, STATE } from "./constants";
import { Entity } from "../simple_ecs/types";

class OneFloatComponent {
    m_value: f32 = 0.0;

    constructor(in_value: f32) {
        this.m_value = in_value;
    }

    @inline
    value(): f32 {
        return this.m_value;
    }

    set_value(in_value: f32): void {
        this.m_value = in_value;
    }

    toString(): string {
        return this.m_value.toString();
    }
}

class OneIntComponent {
    m_value: i32 = -1;

    @inline
    set_value(in_value: i32): void {
        this.m_value = in_value;
    }

    @inline
    value(): i32 {
        return this.m_value;
    }

    toString(): string {
        return this.m_value.toString();
    }
}

class OneBooleanComponent {
    m_value: boolean = false;

    @inline
    set_value(in_value: boolean): void {
        this.m_value = in_value;
    }

    @inline
    value(): boolean {
        return this.m_value;
    }

    toString(): string {
        return this.m_value.toString();
    }
}

// player tag
export class PlayerComponent { }

// moster tag
export class MonsterComponent { }

// store in this cmponent data about neighborhood tiles
export class NeighborhoodTilesComponent {
    m_level: Level;
    m_visible_tiles: List<u32>;  // store each tile as triple: (x, y, i, type), where i - total tile index, i = y * width + x
    m_tiles_to_delete: List<u32>;  // here we will store only global indices (i)
    m_tiles_to_create: List<u32>;  // on client all these tiles should be ordered by these indices

    constructor(in_level: Level) {
        const tiles_count = in_level.width() * in_level.height();

        this.m_visible_tiles = new List<u32>(tiles_count * 4);
        this.m_tiles_to_delete = new List<u32>(tiles_count);  // here store only indices
        this.m_tiles_to_create = new List<u32>(tiles_count * 4);  // here store also all 4 tile data components

        this.m_level = in_level;
    }

    @inline
    level_tile_type(x: i32, y: i32): u32 {
        return this.m_level.get_from_coordinates(x, y);
    }

    @inline
    level_width(): i32 {
        return this.m_level.width();
    }

    @inline
    visible_tiles(): List<u32> {
        return this.m_visible_tiles;
    }

    @inline
    delete_tiles(): List<u32> {
        return this.m_tiles_to_delete;
    }

    @inline
    create_tiles(): List<u32> {
        return this.m_tiles_to_create;
    }

    set_arrays(in_visible: List<u32>, in_delete: List<u32>, in_create: List<u32>): void {
        this.m_visible_tiles.copy_from(in_visible);
        this.m_tiles_to_delete.copy_from(in_delete);
        this.m_tiles_to_create.copy_from(in_create);
    }

    @inline
    clear_to_delete(): void {
        this.m_tiles_to_delete.reset();
    }

    @inline
    clear_to_create(): void {
        this.m_tiles_to_create.reset();
    }
}

// define the size of the visible radius for the player
export class NeighborhoodRadiusComponent {
    private m_value: i32 = 0;

    @inline
    value(): i32 {
        return this.m_value;
    }

    constructor(in_value: i32) {
        this.m_value = in_value;
    }
}

// where the entity with spatial position is in tile
export class TilePositionComponent {
    x: i32 = -100;
    y: i32 = -100;

    toString(): string {
        return "(" + this.x.toString() + ", " + this.y.toString() + ")";
    }
}

// spatial position
export class PositionComponent {
    private m_x: f32 = 0.0;
    private m_y: f32 = 0.0;

    constructor(in_x: f32 = 0.0, in_y: f32 = 0.0) {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    @inline
    x(): f32 {
        return this.m_x;
    }

    @inline
    y(): f32 {
        return this.m_y;
    }

    @inline
    set(in_x: f32, in_y: f32): void {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    toString(): string {
        return "(" + this.m_x.toString() + ", " + this.m_y.toString() + ")";
    }
}

// use this component to track is an itm is actualy move
// we should change angle only when the item is move
// if it stops, then doest not change angle
export class PreviousPositionComponent {
    private m_x: f32 = 0.0;
    private m_y: f32 = 0.0;

    constructor(in_x: f32 = 0.0, in_y: f32 = 0.0) {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    @inline
    x(): f32 {
        return this.m_x;
    }

    @inline
    y(): f32 {
        return this.m_y;
    }

    @inline
    set(in_x: f32, in_y: f32): void {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    toString(): string {
        return "(" + this.m_x.toString() + ", " + this.m_y.toString() + ")";
    }
}

export class PathfinderTaskComponent {

}

export class PathfinderIdComponent extends OneIntComponent { }

// this component should be assign to player
// and use to move player along the path
export class NavmeshTaskComponent {
    private m_path_points: StaticArray<f32> = new StaticArray<f32>(0);
    private m_target_index: i32 = 0;
    private m_points_count: i32 = 0;
    private m_is_active: bool = false;

    @inline
    active(): bool {
        return this.m_is_active;
    }

    @inline
    target_point_index(): i32 {
        return this.m_target_index;
    }

    @inline
    path_points_count(): i32 {
        return this.m_points_count;
    }

    @inline
    target_x(): f32 {
        return this.m_path_points[3 * this.m_target_index];
    }

    @inline
    target_y(): f32 {
        return this.m_path_points[3 * this.m_target_index + 2];
    }

    @inline
    increate_target_index(): void {
        this.m_target_index += 1;
        if(this.m_target_index >= this.m_points_count) {
            this.deactivate();
        }
    }

    define_path(in_path: StaticArray<f32>): boolean {
        if(in_path.length > 0) {
            this.m_path_points = in_path;
            this.m_is_active = true;

            this.m_target_index = 1;  // first index in the path is start point
            this.m_points_count = in_path.length / 3;  // each point in the path contains 3 coordinates

            return true;
        }
        return false;
    }

    deactivate(): void {
        this.m_is_active = false;
        this.m_target_index = 0;
        this.m_points_count = 0;
    }
}

export class SpeedComponent extends OneFloatComponent { }

// use this component to change angle to match the target angle for each item
export class RotationSpeedComponent extends OneFloatComponent { }

// used for rotation angle
export class AngleComponent extends OneFloatComponent {
    @inline
    set_value(in_value: f32): void {
        const two_pi: f32 = 2.0 * <f32>Math.PI;
        if(in_value < 0.0) {
            this.m_value = in_value + two_pi;
        } else if(in_value >= two_pi) {
            this.m_value = in_value - two_pi;
        } else {
            this.m_value = in_value;
        }
    }
}

// use this component to define target angle of the item
// in separate system we should change actual angle (from AngleComponent) to this target value
// angle measured from the positive x-axist conter clock-wise direction
export class TargetAngleComponent extends OneFloatComponent { }

export class MoveTagComponent extends OneBooleanComponent {
    
    toString(): string {
        return this.m_value ? "move" : "not move";
    }
}

export class RadiusComponent extends OneFloatComponent { }

export class QuadGridIndexComponent extends OneIntComponent {
    m_width_count: i32 = 0;  // the number of quads in one horisontal line

    constructor(in_level_width: f32) {
        super();

        this.m_width_count = <i32>(in_level_width / QUAD_SIZE) + 1;  // this value can be actual greater than in real
    }

    set_from_position(pos_x: f32, pos_y: f32): void {
        const x_index = <i32>(pos_x / QUAD_SIZE);
        const y_index = <i32>(pos_y / QUAD_SIZE);

        this.m_value = y_index * this.m_width_count + x_index;
    }
}

// store here items in the neighborhood of the player in quad grid
// and also items to delete in the current frame
export class QuadGridNeighborhoodComponent {
    m_current: List<Entity> = new List<Entity>();
    m_to_delete: List<Entity> = new List<Entity>();

    set_entities(in_array: List<Entity>): void {
        // we should sort in_array, then check difference with current, build to_delete and assign current array
        in_array.sort();
        this.m_to_delete.reset();

        var i: i32 = 0;  // counter of the current
        const current_count = this.m_current.length;
        const in_count = in_array.length;
        for(let j = 0; j < in_count; j++) {
            const in_value = in_array.get(j);
            while(i < current_count && this.m_current.get(i) < in_value) {
                this.m_to_delete.push(this.m_current.get(i));
                i += 1;
            }
            if(i >= current_count) {  // current array is over
                // nothing to do
                break;
            } else if(this.m_current.get(i) == in_value) {
                i += 1;
            }
        }

        // add all other values form the current array to delete
        while(i < current_count) {
            this.m_to_delete.push(this.m_current.get(i));
            i += 1;
        }

        this.m_current.copy_from(in_array);
    }

    @inline
    current(): List<Entity> {
        return this.m_current;
    }

    @inline
    to_delete(): List<Entity> {
        return this.m_to_delete;
    }

    toString(): string {
        return "[" + this.m_current.toString() + "]>[" + this.m_to_delete.toString() + "]";
    }
}

export class StateComponent {
    m_state: STATE = STATE.IDDLE;

    set_state(in_state: STATE): void {
        this.m_state = in_state;
    }

    state(): STATE {
        return this.m_state;
    }

    toString(): string {
        if(this.m_state == STATE.IDDLE) {
            return "iddle";
        } else if(this.m_state == STATE.WALK) {
            return "walk";
        } else {
            return "unknown";
        }
    }
}

export class StateIddleComponent { 
    m_wait_time: f32 = 0.0;  // how many times we should hold this state
    m_current_time: f32 = 0.0;  // how many time we already hold this state

    constructor(in_wait: f32 = 1.0) {
        this.m_wait_time = in_wait;
    }

    is_over(): bool {
        return this.m_current_time > this.m_wait_time;
    }

    increase_time(dt: f32): void {
        this.m_current_time += dt;
    }

    reset(in_time: f32): void {
        this.m_wait_time = in_time;
        this.m_current_time = 0.0;
    }

    toString(): string {
        return "state[" + this.m_wait_time.toString() + ":" + this.m_current_time.toString() + "]";
    }
}

// for walk state we should additionally store the target coordinates
export class StateWalkComponent { 
    m_target_x: f32 = 0.0;
    m_target_y: f32 = 0.0;

    m_assign_target: bool = false;

    set_target(in_x: f32, in_y: f32): void {
        this.m_target_x = in_x;
        this.m_target_y = in_y;

        this.m_assign_target = true;
    }

    @inline
    target_x(): f32 {
        return this.m_target_x;
    }

    @inline
    target_y(): f32 {
        return this.m_target_y;
    }

    @inline
    assign_target(): bool {
        return this.m_assign_target;
    }
}

// measure is active or not
export class PathfinderStatusComponent extends OneBooleanComponent {}