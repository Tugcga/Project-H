export class DebugSettings {
    // if true that update debug info on client
    use_debug: bool = false;

    // show move trajectory for each entity
    show_path: bool = true;

    // show intervals from entity to all closest ones
    // these closest used in RVOSystem (for example)
    show_closest: bool = true;

    // for player only
    show_visible_quad: bool = true;
    show_neighborhood_quad: bool = true;

    // for enemies only
    // show virtual lines to entities from the enemies list
    show_enemy_targets: bool = true;
}

export class EngineSettings {
    snap_to_navmesh: bool = true;
    use_rvo: bool = true;
    velocity_boundary_control: bool = true;

    set_snap_to_navmesh(in_value: bool): void {
        this.snap_to_navmesh = in_value;
    }

    set_use_rvo(in_value: bool): void {
        this.use_rvo = in_value;
    }

    set_velocity_boundary_control(in_value: bool):void {
        this.velocity_boundary_control = in_value;
    }
}

export class ConstantsSettings {
    tile_size: f32 = 1.5;  // tile size of the map
    visible_quad_size: f32 = 18.0;  // the size of one quad, used for tracking neighborhood movable items (in fact close to tile_size * visible_radius)
    neighborhood_quad_size: f32 = 1.5;  // this quad size used for building neighborhood grid and use it in rvo (for finding close actors)
    tiles_visible_radius: i32 = 12;
    player_radius: f32 = 0.5;
    player_atack_distance: f32 = 0.85;  // these constants should defined by character equip
    monster_radius: f32 = 0.35;
    monster_atack_distance: f32 = 0.5;
    player_speed: f32 = 5.0;
    hide_speed_multiplier: f32 = 0.5;
    monster_speed: f32 = 3.5;
    player_rotation_speed: f32 = 10.0;
    monster_rotation_speed: f32 = 7.5;
    rvo_time_horizon: f32 = 0.5;
    monster_random_walk_target_radius: f32 = 3.0;  // radius where we select next random point to walk in
    monster_iddle_time: Array<f32> = [1.0, 5.0];  // in seconds
    monsters_per_room: Array<u32> = [3, 7];
    path_recalculate_time: f32 = 1.0;  // in seconds, after this time we should calculate the path to the target point
    path_to_target_recalculate_time: f32 = 0.1; // in seconds, time for recalculate path when the entity follow to the target actor (it can move, so, we should update the path)
    player_shift_speed_multiplier: f32 = 5.0;
    player_shift_distance: f32 = 2.0;
    player_shift_cooldawn: f32 = 0.5;
    radius_select_delta: f32 = 0.25;  // this value is add to the entity radius to define select circle
    player_melle_atack_time_span: f32 = 1.0;  // how long the atack cast
    monster_melle_atack_time_span: f32 = 1.2;
    player_melee_atack_cooldawn: f32 = 2.0;
    monster_melee_atack_cooldawn: f32 = 2.0;
    player_melee_damage_spread: f32 = 1.75;
    player_melee_damage_distance: f32 = 1.5;  // the size of the cone for melee damage
    monster_melee_damage_spread: f32 = 0.785;
    monster_melee_damage_distance: f32 = 0.5;
    player_melee_damage: u32 = 5;
    monster_melee_damage: u32 = 3;
    player_life: u32 = 24;
    monster_life: u32 = 8;
    player_shield: f32 = 4.0;
    monster_shield: f32 = 3.0;
    player_shield_resurect: f32 = 1.0;
    monster_shield_resurect: f32 = 0.5;
    default_melee_stun: f32 = 1.0;
    player_default_team: i32 = 1;
    monster_default_team: i32 = -1;
    search_radius: f32 = 5.0;
    search_spread: f32 = <f32>Math.PI / 2.0;

    set_rvo_time_horizon(in_value: f32): void {
        this.rvo_time_horizon = in_value;
    }

    set_visible_quad_size(in_value: f32): void {
        this.visible_quad_size = in_value;
    }

    set_neighborhood_quad_size(in_value: f32): void {
        this.neighborhood_quad_size = in_value;
    }

    set_path_recalculate_time(in_value: f32): void {
        this.path_recalculate_time = in_value;
    }

    set_monster_iddle_time(in_min: f32, in_max: f32): void {
        this.monster_iddle_time[0] = in_min;
        this.monster_iddle_time[1] = in_max;
    }

    set_player_speed(in_speed: f32): void {
        this.player_speed = in_speed;
    }

    set_hide_speed_multiplier(in_value: f32): void {
        this.hide_speed_multiplier = in_value;
    }

    set_player_shift(in_multiplier: f32, in_distance: f32, in_cooldawn: f32): void {
        this.player_shift_speed_multiplier = in_multiplier;
        this.player_shift_distance = in_distance;
        this.player_shift_cooldawn = in_cooldawn;
    }

    set_player_melee_attack(distance: f32, time_span: f32, cooldawn: f32, damage: u32, damage_spread: f32, damage_distance: f32): void {
        this.player_atack_distance = distance;
        this.player_melle_atack_time_span = time_span;
        this.player_melee_atack_cooldawn = cooldawn;
        this.player_melee_damage_spread = damage_spread;
        this.player_melee_damage_distance = damage_distance;
        this.player_melee_damage = damage;
    }

    set_monster_melee_attack(distance: f32, time_span: f32, cooldawn: f32, damage: u32, damage_spread: f32, damage_distance: f32): void {
        this.monster_atack_distance = distance;
        this.monster_melle_atack_time_span = time_span;
        this.monster_melee_atack_cooldawn = cooldawn;
        this.monster_melee_damage_spread = damage_spread;
        this.monster_melee_damage_distance = damage_distance;
        this.monster_melee_damage = damage;
    }

    set_monsters_per_room(min_count: u32, max_count: u32): void {
        this.monsters_per_room[0] = min_count;
        this.monsters_per_room[1] = max_count;
    }

    set_player_life(in_value: u32): void {
        this.player_life = in_value;
    }

    set_player_shield(in_shield: f32, in_resurect: f32): void {
        this.player_shield = in_shield;
        this.player_shield_resurect = in_resurect;
    }

    set_monster_life(in_value: u32): void {
        this.monster_life = in_value;
    }

    set_monster_shield(in_shield: f32, in_resurect: f32): void {
        this.monster_shield = in_shield;
        this.monster_shield_resurect = in_resurect;
    }

    set_default_melee_stun(value: f32): void {
        this.default_melee_stun = value;
    }

    set_search_radius_spread(radius: f32, spread: f32): void {
        this.search_radius = radius;
        this.search_spread = spread;
    }
}

export class GenerateSettings {
    // the number of tiles in width and height
    level_size: u32;

    // minimum and maximum size of each room
    min_room_size: u32;
    max_room_size: u32;

    // the number of rooms
    rooms_count: u32

    constructor() {
        this.level_size = 10;
        this.min_room_size = 2;
        this.max_room_size = 2;
        this.rooms_count = 1;
    }

    set_level_size(in_value: u32): void {
        this.level_size = in_value;
    }

    set_room_size(min_value: u32, max_value: u32): void {
        this.min_room_size = min_value;
        this.max_room_size = max_value;
    }

    set_rooms_count(in_value: u32): void {
        this.rooms_count = in_value;
    }

    get_level_size(): u32 {
        return this.level_size;
    }

    get_min_room_size(): u32 {
        return this.min_room_size;
    }

    get_max_room_size(): u32 {
        return this.max_room_size;
    }

    get_rooms_count(): u32 {
        return this.rooms_count;
    }

    toString(): string {
        return `<${this.level_size}, ${this.min_room_size}, ${this.max_room_size}, ${this.rooms_count}>`;
    }
}

export class Settings {
    seed: u32;
    generate: GenerateSettings;
    constants: ConstantsSettings;
    engine: EngineSettings;
    debug: DebugSettings;

    constructor() {
        this.seed = 1;
        this.generate = new GenerateSettings();
        this.constants = new ConstantsSettings();
        this.engine = new EngineSettings();
        this.debug = new DebugSettings();
    }

    set_seed(in_value: u32): void {
        this.seed = in_value;
    }

    set_use_debug(in_use_debug: boolean): void {
        const debug = this.debug;
        debug.use_debug = in_use_debug;
    }

    get_generate(): GenerateSettings {
        return this.generate;
    }

    get_constants(): ConstantsSettings {
        return this.constants;
    }

    get_engine(): EngineSettings {
        return this.engine;
    }

    get_debug(): DebugSettings {
        return this.debug;
    }

    get_seed(): u32 {
        return this.seed;
    }

    toString(): string {
        return `[Seed<${this.seed}>, Generate${this.generate}]`;
    }
}