import { System } from "../simple_ecs/system_manager";
import { PathFinder } from "../pathfinder/pathfinder";
import { 
    EPSILON, 
    MONSTER_IDDLE_TIME, 
    MONSTER_RANDOM_WALK_TARGET_RADIUS, 
    QUAD_SIZE, 
    STATE, 
    TILE_SIZE } from "./constants";
import { Entity } from "../simple_ecs/types";
import { 
    AngleComponent, 
    MoveTagComponent, 
    NavmeshTaskComponent, 
    NeighborhoodRadiusComponent, 
    NeighborhoodTilesComponent, 
    PathfinderIdComponent, 
    PathfinderStatusComponent, 
    PositionComponent, 
    PreviousPositionComponent, 
    QuadGridIndexComponent, 
    QuadGridNeighborhoodComponent, 
    RadiusComponent, 
    RotationSpeedComponent, 
    SpeedComponent, 
    StateComponent, 
    StateIddleComponent, 
    StateWalkComponent, 
    TargetAngleComponent, 
    TilePositionComponent } from "./components";
import { List } from "../pathfinder/common/list";
import { direction_to_angle } from "./math";
import { PseudoRandom } from "../promethean/pseudo_random";

// this system should get all entities, which should be moved by pathfinder
// make one tick and geather positions
// TODO: check that player is not moved here, it should only define position
// this system should used for bots
export class PathfinderMoveSystem extends System {
    m_pathfinder: PathFinder;

    constructor(in_pathfinder: PathFinder) {
        super();

        this.m_pathfinder = in_pathfinder;
    }

    update(dt: f32): void {
        // update pathfinder
        this.m_pathfinder.update(dt);

        const entities = this.entities();
        for(let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const id: PathfinderIdComponent | null = this.get_component<PathfinderIdComponent>(entity);
            const status: PathfinderStatusComponent | null = this.get_component<PathfinderStatusComponent>(entity);

            if(position && id && status) {
                const a_pos = this.m_pathfinder.get_agent_position(id.value());
                if(a_pos.length > 0) {
                    // this is valid position
                    position.set(a_pos[0], a_pos[2]);
                }

                const a_active = this.m_pathfinder.get_agent_activity(id.value());
                status.set_value(a_active);
            }
        }
    }

    set_agent_position(agent_id: i32, pos_x: f32, pos_y: f32): void {
        this.m_pathfinder.set_agent_position(agent_id, pos_x, 0.0, pos_y);
    }

    set_agent_target(agent_id: i32, pos_x: f32, pos_y: f32): boolean {
        return this.m_pathfinder.set_agent_destination(agent_id, pos_x, 0.0, pos_y);
    }

    get_agent_destination(agent_id: i32): Float32Array {
        return this.m_pathfinder.get_agent_destination(agent_id);
    }

    get_agent_activity(agent_id: i32): boolean {
        return this.m_pathfinder.get_agent_activity(agent_id);
    }

    add_agent(entity: Entity, pos_x: f32, pos_y: f32, speed: f32): void {
        const id: PathfinderIdComponent | null = this.get_component<PathfinderIdComponent>(entity);
        const radius: RadiusComponent | null = this.get_component<RadiusComponent>(entity);
        if(id && radius) {
            const pf_id = this.m_pathfinder.add_agent(pos_x, 0.0, pos_y, radius.value(), speed);
            id.set_value(pf_id);
        }
    }
}

// in this system we manually move by using path from navigation mesh
// this system shold used for only player
// because for player we should not use RVO
export class NavmeshMoveSystem extends System {
    m_pathfinder_system: PathfinderMoveSystem

    // navmesh system use pathfinder object
    // to manualy set player agent position
    // because it should used in rvo simulation, but actual position should be calculated here
    constructor(in_system: PathfinderMoveSystem) {
        super();

        this.m_pathfinder_system = in_system;
    }

    update(dt: f32): void {
        // it should be used only for player, so get singleton
        const entity: Entity = this.singleton();
        const task: NavmeshTaskComponent | null = this.get_component<NavmeshTaskComponent>(entity);
        const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
        const speed: SpeedComponent | null = this.get_component<SpeedComponent>(entity);
        const id: PathfinderIdComponent | null = this.get_component<PathfinderIdComponent>(entity);

        if(task && position && speed && id) {
            if(task.active() && task.target_point_index() < task.path_points_count()) {
                const target_x: f32 = task.target_x();
                const target_y: f32 = task.target_y();

                const current_x: f32 = position.x();
                const current_y: f32 = position.y();

                // calculate direction vector
                var dir_x = target_x - current_x;
                var dir_y = target_y - current_y;

                // normalize
                const dir_length = <f32>Math.sqrt(dir_x * dir_x + dir_y * dir_y);
                var force_use_target: boolean = false;
                if(dir_length > EPSILON) {
                    dir_x = dir_x / dir_length;
                    dir_y = dir_y / dir_length;
                } else {
                    // we are very close to the target position
                    force_use_target = true;
                }

                // calculate new point
                const s: f32 = speed.value();
                const new_x: f32 = current_x + dir_x * dt * s;
                const new_y: f32 = current_y + dir_y * dt * s;

                // check, may be we overjump target point
                const new_dir_x = target_x - new_x;
                const new_dir_y = target_y - new_y;

                // calculate dot product between old and new directions
                const d: f32 = new_dir_x * dir_x + new_dir_y * dir_y;
                if(force_use_target || d < 0.0) {
                    // directions are opposite, so we overjump
                    // stap position to the path point
                    // and increase the target index
                    task.increate_target_index();
                    position.set(target_x, target_y);

                    this.m_pathfinder_system.set_agent_position(id.value(), target_x, target_y);
                } else {
                    position.set(new_x, new_y);

                    this.m_pathfinder_system.set_agent_position(id.value(), new_x, new_y);
                }
            }
        }
    }

    add_agent(entity: Entity, pos_x: f32, pos_y: f32): void {
        const id: PathfinderIdComponent | null = this.get_component<PathfinderIdComponent>(entity);
        const speed: SpeedComponent | null = this.get_component<SpeedComponent>(entity);
        if(id && speed) {
            this.m_pathfinder_system.add_agent(entity, pos_x, pos_y, speed.value());
        }
    }
}

// this system convert item position to the tile index (x, y)
export class PositionToTileSystem extends System {
    m_tile_size: f32 = 0.0;
    m_level_width: i32 = 0;
    m_level_height: i32 = 0;

    i_added_indices: Set<u32> = new Set<u32>();  // store here which indices we already add to the new visible
    i_new_visible: List<u32> = new List<u32>();
    i_new_delete: List<u32> = new List<u32>();

    constructor(in_width: i32, in_height: i32) {
        super();

        this.m_tile_size = TILE_SIZE;
        this.m_level_width = in_width;
        this.m_level_height = in_height;
    }

    update(dt: f32): void {
        // we assume that this system call only for player, so, use singleton
        const entity: Entity = this.singleton();
        const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
        const tile: TilePositionComponent | null = this.get_component<TilePositionComponent>(entity);
        const radius: NeighborhoodRadiusComponent| null = this.get_component<NeighborhoodRadiusComponent>(entity);
        const neigh_tiles: NeighborhoodTilesComponent| null = this.get_component<NeighborhoodTilesComponent>(entity);

        if(position && tile && radius && neigh_tiles) {
            // calculate new tile position
            const new_tile_x = <i32>(position.x() / this.m_tile_size);
            const new_tile_y = <i32>(position.y() / this.m_tile_size);
            if(new_tile_x != tile.x || new_tile_y != tile.y) {
                const r: i32 = radius.value();
                // here we should update visible tiles
                // check visibility of all previous visible tiles
                // if it visible, add it to the separate array
                // if it should be invisible - add it to delete array
                let old_visible = neigh_tiles.visible_tiles();
                const vis_count = old_visible.length / 4;  // the structure is (x, y, index, type)

                var new_visible = this.i_new_visible;
                new_visible.reset();
                var new_delete = this.i_new_delete;
                new_delete.reset();

                var added_indices = this.i_added_indices;
                added_indices.clear();
                
                for(let i = 0; i < vis_count; i++) {
                    const vis_x: i32 = <i32>old_visible.get(4*i);
                    const vis_y: i32 = <i32>old_visible.get(4*i + 1);
                    const vis_index: u32 = old_visible.get(4*i + 2);
                    const vis_type: u32 = old_visible.get(4*i + 3);
                    if(<i32>Math.abs(vis_x - new_tile_x) <= r && <i32>Math.abs(vis_y - new_tile_y) <= r) {
                        // this tile in visible radius with respect to the new tile
                        // write data to new visible
                        new_visible.push(vis_x);
                        new_visible.push(vis_y);
                        new_visible.push(vis_index);
                        new_visible.push(vis_type);

                        added_indices.add(vis_index);
                    } else {
                        // this tile outside of the new visible
                        new_delete.push(vis_index);  // add only index
                    }
                }

                // new xt we should consider all tiles in the neighborhood of the current tile
                // and add those tiles, which are not added yet
                // and also add their indices into new array
                let new_create: List<u32> = new List<u32>((2*r + 1) * (2*r + 1) * 4);
                const x_start = <i32>Math.max(0, new_tile_x - r);
                const x_end = <i32>Math.min(this.m_level_width, new_tile_x + r + 1);
                const y_start =  <i32>Math.max(0, new_tile_y - r);
                const y_end = <i32>Math.min(this.m_level_height, new_tile_y + r + 1);
                for(let x = x_start; x < x_end; x++) {
                    for(let y = y_start; y < y_end; y++) {
                        const i: u32 = y * neigh_tiles.level_width() + x;
                        const t = neigh_tiles.level_tile_type(y, x);
                        if(!added_indices.has(i)) {
                            new_create.push(x);
                            new_create.push(y);
                            new_create.push(i);
                            new_create.push(t);

                            new_visible.push(x);
                            new_visible.push(y);
                            new_visible.push(i);
                            new_visible.push(t);

                            added_indices.add(i);
                        }
                    }
                }
                // write to component
                neigh_tiles.set_arrays(new_visible, new_delete, new_create);

                tile.x = new_tile_x;
                tile.y = new_tile_y;
            } else {
                // current player tile is the same
                // clear component
                neigh_tiles.clear_to_create();
                neigh_tiles.clear_to_delete();
            }
        }
    }
}

// this system track current and previous positions
// if these values different, then set move tag to true
// in other case - to false
// also, if current and previous positions are different, then find direction and set target angle
export class MoveTrackingSystem extends System {

    update(dt: f32): void {
        const entities = this.entities();
        for(let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const prev_position: PreviousPositionComponent | null = this.get_component<PreviousPositionComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
            const target: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);

            if(prev_position && position && move && target) {
                const prev_x = prev_position.x();
                const prev_y = prev_position.y();

                const x = position.x();
                const y = position.y();

                // calculate direction from previous to current
                var dir_x = x - prev_x;
                var dir_y = y - prev_y;
                const dir_length = <f32>Math.sqrt(dir_x * dir_x + dir_y * dir_y);

                if(dir_length > EPSILON) {
                    move.set_value(true);

                    // normalize direction vector
                    dir_x /= dir_length;
                    dir_y /= dir_length;

                    target.set_value(direction_to_angle(dir_x, dir_y));

                    // set new previous position
                    prev_position.set(x, y);
                } else {
                    // positions are the same, nothing to do
                    move.set_value(false);
                }
            }
        }
    }
}

export class RotateSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();
        for(let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
            const angle: AngleComponent | null = this.get_component<AngleComponent>(entity);
            const target_angle: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);
            const speed: RotationSpeedComponent | null = this.get_component<RotationSpeedComponent>(entity);

            if(move && angle && target_angle && speed) {
                if(move.value()) {
                    // item is moving, so, we should rotate the angle to snap with target angle
                    const a = angle.value();  // curent angle
                    const ta = target_angle.value();  // target angle
                    const delta = dt * speed.value();  // value we should add/subtract to the current angle a
                    
                    // calculate the delta between a and ta
                    const a_diff = <f32>Math.abs(a - ta);
                    const a_diff_comp = 2.0 * <f32>Math.PI - a_diff;
                    const a_delta = <f32>Math.min(a_diff, a_diff_comp);

                    if(a_delta < delta) {
                        // snap the angle
                        angle.set_value(ta);
                    } else {
                        // calculate direction to change the angle
                        // it depends what diff is smaller
                        var direction: f32 = 1.0;
                        if(a_diff < a_diff_comp) {
                            if(ta > a) {
                                direction = 1.0;
                            } else {
                                direction = -1.0;
                            }
                        } else {
                            if(ta > a) {
                                direction = -1.0;
                            } else {
                                direction = 1.0;
                            }
                        }

                        // set new angle
                        angle.set_value(a + direction * delta);
                    }
                }
            }
        }
    }
}

export class QuadGridTrackingSystem extends System {
    m_items_map: StaticArray<List<Entity>>;
    m_width_count: i32;

    constructor(in_level_width: f32, in_level_height: f32) {
        super();

        // calculate the number of quads for the map
        const x_size = <i32>(in_level_width / QUAD_SIZE) + 1;
        const y_size = <i32>(in_level_height / QUAD_SIZE) + 1;

        this.m_width_count = x_size;

        this.m_items_map = new StaticArray<List<Entity>>(x_size * y_size);
        for(let i = 0, len = x_size * y_size; i < len; i++) {
            this.m_items_map[i] = new List<Entity>();
        }
    }

    // return all movable entities in the quad with given position and also from the near quads
    get_items_from_position(pos_x: f32, pos_y: f32): List<Entity> {
        // get quad index
        const x_index = <i32>(pos_x / QUAD_SIZE);
        const y_index = <i32>(pos_y / QUAD_SIZE);

        const index = y_index * this.m_width_count + x_index;

        if(index >= 0) {
            const center = new List<Entity>();
            center.copy_from(this.m_items_map[index]);
            // also we should add to the center list items from other near quads
            for(let x = -1; x <= 1; x++) {
                for(let y = -1; y <= 1; y++) {
                    if(!(x == 0 && y == 0)) {
                        const i = index + y * this.m_width_count + x;
                        if(i >= 0 && i < this.m_items_map.length) {
                            const addon = this.m_items_map[i];
                            center.extend(addon);
                        }
                    }
                }
            }
            return center;
        }

        return new List<Entity>();
    }

    update(dt: f32): void {
        const entities = this.entities();
        for(let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const quad_index: QuadGridIndexComponent | null = this.get_component<QuadGridIndexComponent>(entity);

            if(position && quad_index) {
                const x = position.x();
                const y = position.y();

                const prev_quad = quad_index.value();
                // update quad index
                quad_index.set_from_position(x, y);
                const current_quad = quad_index.value();
                if(prev_quad != current_quad) {  // new index different fro the last index
                    // os, we should update the map for the old and new quad
                    if(prev_quad >= 0) {
                        this.m_items_map[prev_quad].pop_value(entity);
                    }
                    this.m_items_map[current_quad].push(entity);
                }
            }
        }
    }
}

export class QuadGridNeighborhoodSystem extends System {
    m_tracking_system: QuadGridTrackingSystem;

    constructor(in_tracking: QuadGridTrackingSystem) {
        super();

        this.m_tracking_system = in_tracking;
    }

    update(dt: f32): void {
        const entity: Entity = this.singleton();
        const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
        const quad_neight: QuadGridNeighborhoodComponent | null = this.get_component<QuadGridNeighborhoodComponent>(entity);

        if(position && quad_neight) {
            const pos_x = position.x();
            const pos_y = position.y();

            const neight_entities: List<Entity> = this.m_tracking_system.get_items_from_position(pos_x, pos_y);
            quad_neight.set_entities(neight_entities);
        }
    }
}

export class StateIddleSystem extends System {
    m_random: PseudoRandom;

    constructor() {
        super();

        this.m_random = new PseudoRandom(101010);
    }

    update(dt: f32): void {
        const entities = this.entities();
        for(let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const iddle: StateIddleComponent | null = this.get_component<StateIddleComponent>(entity);

            if(state && iddle && state.state() == STATE.IDDLE) {
                iddle.increase_time(dt);
                if(iddle.is_over()) {
                    // we should select other state
                    const next_state = this.m_random.next(0, 1);
                    if(next_state == 0) {  // iddle
                        // reset current iddle component
                        iddle.reset(<f32>this.m_random.next_float(MONSTER_IDDLE_TIME[0], MONSTER_IDDLE_TIME[1]));
                    } else if(next_state == 1) {  // walk
                        // in this case we should remove iddle state component and add walk component
                        this.remove_component<StateIddleComponent>(entity);
                        this.add_component<StateWalkComponent>(entity, new StateWalkComponent());
                        state.set_state(STATE.WALK);
                    }
                }
            }
        }
    }
}

export class StateWalkSystem extends System {
    m_random: PseudoRandom;
    m_pathfinder_system: PathfinderMoveSystem;

    constructor(in_pathfiner_system: PathfinderMoveSystem) {
        super();

        this.m_random = new PseudoRandom(202020);
        this.m_pathfinder_system = in_pathfiner_system;
    }

    update(dt: f32): void {
        const entities = this.entities();
        for(let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];
            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const walk: StateWalkComponent | null = this.get_component<StateWalkComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const id: PathfinderIdComponent| null = this.get_component<PathfinderIdComponent>(entity);

            if(state && walk && position && state.state() == STATE.WALK && id) {
                if(!walk.assign_target()) {
                    // assign random target
                    const pos_x = position.x();
                    const pos_y = position.y();
                    const target_x = <f32>this.m_random.next_float(pos_x - MONSTER_RANDOM_WALK_TARGET_RADIUS, pos_x + MONSTER_RANDOM_WALK_TARGET_RADIUS);
                    const target_y = <f32>this.m_random.next_float(pos_y - MONSTER_RANDOM_WALK_TARGET_RADIUS, pos_y + MONSTER_RANDOM_WALK_TARGET_RADIUS);

                    const is_set = this.m_pathfinder_system.set_agent_target(id.value(), target_x, target_y);
                    if(is_set) {
                        // real destination point may different with respect to our
                        // bacuse we find the closest in the navigation mesh
                        const point = this.m_pathfinder_system.get_agent_destination(id.value());
                        walk.set_target(point[0], point[2]);
                    }// in other case we will try to set the destination point at the enxt update
                } else {
                    // check is we come to the target
                    if(!this.m_pathfinder_system.get_agent_activity(id.value())) {
                        // come to the target
                        this.remove_component<StateWalkComponent>(entity);
                        this.add_component<StateIddleComponent>(entity, new StateIddleComponent(<f32>this.m_random.next_float(MONSTER_IDDLE_TIME[0], MONSTER_IDDLE_TIME[1])));
                        state.set_state(STATE.IDDLE);
                    }
                }
            }
        }
    }
}