import { PseudoRandom } from "./promethean/pseudo_random";
import { ECS } from "./simple_ecs/simple_ecs";
import { Entity } from "./simple_ecs/types";
import { Navmesh } from "./pathfinder/navmesh/navmesh";
import { Level } from "./promethean/level";

import { generate_level, generate_navmesh } from "./game/generate";
import { Settings, ConstantsSettings } from "./game/settings";
import { EPSILON } from "./game/constants";

import { external_define_level,
         external_define_navmesh,
         external_define_total_tiles,
         external_create_player,
         external_define_entity_changes } from "./external";

import { setup_components, 
         setup_systems, 
         setup_player, 
         setup_monster,
         command_move_to_point,
         command_shift } from "./game/ecs_setup";

import { PositionComponent } from "./game/components/position";
import { SpeedComponent } from "./game/components/speed";
import { UpdateToClientSystem } from "./game/systems/update_to_client";
import { UpdateDebugSystem } from "./game/systems/update_debug";

export class Game {
    private ecs: ECS | null = null;
    private navmesh: Navmesh | null = null;
    private level: Level | null = null;
    private random: PseudoRandom | null = null;
    private player_entity: Entity;
    private constants: ConstantsSettings;

    private seed: u32 = 0;

    constructor(in_settings: Settings) {
        let local_seed = in_settings.get_seed();
        let local_level = generate_level(local_seed, in_settings.get_generate());

        // output to the host level data
        external_define_level(local_level.width(), local_level.height(), in_settings.get_constants().tile_size);
        external_define_total_tiles(local_level.statistics().walkable_tiles);

        let local_random = new PseudoRandom(local_seed, 2);

        // level contains tiles in array of arrays
        // the first array = the first row
        // the second array - second and so on
        // we should translte it to spatial position, by using tile size and center of the level
        // for simplicity assume that the first tile at (0, 0) and all tiles placed at right and top

        // toString print level from top to bottom and from left to right
        // in level x - index of the row, y - index of the column
        // but we should place columns (second index) at x-direction
        // rows (first index) at y-direction
        // and draw tiles from left to right and bottom to top

        // bake navmesh
        let local_navmesh = generate_navmesh(local_level, in_settings);
        // output to the host navigation mesh
        external_define_navmesh(local_navmesh.vertices(), local_navmesh.polygons(), local_navmesh.sizes());

        // get room index
        const level_stat = local_level.statistics();
        const rooms_count = level_stat.rooms_count;
        const start_room = 0;
        const start_point = level_stat.room_centers[start_room];

        const local_constants: ConstantsSettings = in_settings.get_constants();
        const tile_size = local_constants.tile_size;
        const visible_quad_size = local_constants.visible_quad_size;
        const neighborhood_quad_size = local_constants.neighborhood_quad_size;
        const player_speed = local_constants.player_speed;
        const player_shift_speed_multiplier = local_constants.player_shift_speed_multiplier;
        const player_shift_distance = local_constants.player_shift_distance;
        const player_shift_cooldawn = local_constants.player_shift_cooldawn;
        const player_radius = local_constants.player_radius;
        const player_rotation_speed = local_constants.player_rotation_speed;
        const tiles_visible_raidus = local_constants.tiles_visible_radius;
        const rvo_time_horizon = local_constants.rvo_time_horizon;
        const monster_random_walk_target_radius = local_constants.monster_random_walk_target_radius;
        const monster_iddle_time = local_constants.monster_iddle_time;
        const path_recalculate_time = local_constants.path_recalculate_time;

        const debug_settings = in_settings.get_debug();
        const engine_settings = in_settings.get_engine();

        const start_x: f32 = tile_size * <f32>start_point.y();  // in the level tile x - index of the row, y - index of the column, so, we should swap it
        const start_y: f32 = tile_size * <f32>start_point.x();

        // start player rotation angle
        // const start_angle = <f32>local_random.next_float(0.0, 2* Math.PI);
        const start_angle: f32 = 0.0;

        // init ecs
        let local_ecs = new ECS();

        // register components
        setup_components(local_ecs);

        // register systems
        setup_systems(local_ecs,
            local_navmesh,
            local_random,
            local_level.width(),
            local_level.height(),
            tile_size,
            visible_quad_size,
            neighborhood_quad_size,
            rvo_time_horizon,
            monster_random_walk_target_radius,
            monster_iddle_time,
            path_recalculate_time,
            debug_settings,
            engine_settings);

        // setup player entity
        const player_entity = setup_player(local_ecs, 
            local_level, 
            start_x, 
            start_y, 
            player_speed, 
            player_shift_speed_multiplier,
            player_shift_distance,
            player_shift_cooldawn,
            player_radius, 
            start_angle, 
            player_rotation_speed, 
            tiles_visible_raidus, 
            <f32>local_level.width() * tile_size, 
            neighborhood_quad_size);

        const update_system = local_ecs.get_system<UpdateToClientSystem>();
        update_system.init(player_entity);
        if (debug_settings.use_debug) {
            const debug_system = local_ecs.get_system<UpdateDebugSystem>();
            debug_system.init(player_entity);
        }
        
        // output player position and radius
        external_create_player(player_entity, player_radius);
        external_define_entity_changes(player_entity, start_x, start_y, start_angle, false);

        // store in the class all local instances
        this.level = local_level;
        this.seed = local_seed;
        this.random = local_random;
        this.navmesh = local_navmesh;
        this.ecs = local_ecs;
        this.player_entity = player_entity;
        this.constants = local_constants;

        // emit mosnter at each room
        for (let i = 0; i < rooms_count; i++) {
            const room_center = level_stat.room_centers[i];
            const room_radius = level_stat.room_sizes[i]

            this.add_monsters_at_room(room_center.x(), room_center.y(), room_radius.x(), room_radius.y())
        }
    }

    update(dt: f32): void {
        let local_ecs = this.ecs;
        if(local_ecs) {
            if (dt > EPSILON) {
                local_ecs.update(dt);
            }
        }
    }

    // for development only
    _set_player_position(in_x: f32, in_y: f32): void {
        const local_ecs = this.ecs;
        if (local_ecs) {
            const player_entity = this.player_entity;
            const position: PositionComponent | null = local_ecs.get_component<PositionComponent>(player_entity);
            if (position) {
                position.set(in_x, in_y);
            }
        }
    }

    _zero_speed(): void {
        const local_ecs = this.ecs;
        if (local_ecs) {
            const player_entity = this.player_entity;
            const speed: SpeedComponent | null = local_ecs.get_component<SpeedComponent>(player_entity);
            if (speed) {
                speed.set_value(0.0);
            }
        }
    }

    client_point(in_x: f32, in_y: f32): boolean {
        let local_ecs = this.ecs;
        let local_navmesh = this.navmesh;
        if (local_ecs && local_navmesh) {
            // get player entity
            const player_entity = this.player_entity;
            return command_move_to_point(local_ecs, local_navmesh, player_entity, in_x, in_y);
        }

        return false;
    }

    // use cursor x/y for direction of the shift
    player_shift(cursor_x: f32, cursor_y: f32): void {
        const local_ecs = this.ecs;
        const local_navmesh = this.navmesh;
        if (local_ecs && local_navmesh) {
            const player_entity = this.player_entity;

            command_shift(local_ecs, local_navmesh, player_entity, cursor_x, cursor_y);
        }
    }

    emit_one_monster(pos_x: f32, pos_y: f32, angle: f32): void {
        const local_ecs = this.ecs;
        const local_constants = this.constants;
        const local_level = this.level;
        const local_random = this.random;
        if (local_ecs && local_level && local_random) {
            const monster_speed = local_constants.monster_speed;
            const monster_radius = local_constants.monster_radius;
            const monster_rotation_speed = local_constants.monster_rotation_speed;
            const visible_quad_size = local_constants.visible_quad_size;
            const neighborhood_quad_size = local_constants.neighborhood_quad_size;
            const tile_size = local_constants.tile_size;
            const monster_iddle_time = local_constants.monster_iddle_time;

            setup_monster(local_ecs, 
                pos_x, 
                pos_y, 
                angle, 
                monster_speed, 
                monster_radius, 
                monster_rotation_speed, 
                <f32>local_random.next_float(monster_iddle_time[0], monster_iddle_time[1]),
                <f32>local_level.width() * tile_size, 
                visible_quad_size, 
                neighborhood_quad_size);
        }
    }

    private add_monsters_at_room(center_x: u32, center_y: u32, radius_x: u32, radius_y: u32): void {
        const local_random = this.random;
        const local_constants = this.constants;
        const tile_size = local_constants.tile_size;
        const local_navmesh = this.navmesh;

        const monsters_per_room = local_constants.monsters_per_room;

        if (local_random && local_navmesh) {
            const emit_count = local_random.next(monsters_per_room[0], monsters_per_room[1]);

            for (let j = 0; j < emit_count; j++) {
                // select random position
                var pos_x = <f32>local_random.next_float(<f32>(center_y - radius_y) * tile_size, <f32>(center_y + radius_y) * tile_size);
                var pos_y = <f32>local_random.next_float(<f32>(center_x - radius_x) * tile_size, <f32>(center_x + radius_x) * tile_size);
                const sample = local_navmesh.sample(pos_x, 0.0, pos_y);
                if (sample.length == 4 && sample[3] > 0.5) {
                    pos_x = sample[0];
                    pos_y = sample[2];

                    // and angle
                    const angle = <f32>local_random.next_float(0.0, 2.0 * Math.PI);

                    this.emit_one_monster(pos_x, pos_y, angle);
                }
            }
        }
    }

    add_monsters(): void {
        let local_level = this.level;
        let local_random = this.random;
        if (local_level && local_random) {
            const level_stat = local_level.statistics();
            // get random room
            const r_index = local_random.next(0, level_stat.rooms_count - 1);
            
            // get center of the room
            const r_center = level_stat.room_centers[r_index];
            // and radius
            const r_radius = level_stat.room_sizes[r_index];

            this.add_monsters_at_room(r_center.x(), r_center.y(), r_radius.x(), r_radius.y());
        }
    }

    toString(): string {
        return `Game<${this.seed}>`;
    }
}