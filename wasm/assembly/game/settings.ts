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
}

export class EngineSettings {
    snap_to_navmesh: bool = true;
    use_rvo: bool = true;

    set_snap_to_navmesh(in_value: bool): void {
        this.snap_to_navmesh = in_value;
    }

    set_use_rvo(in_value: bool): void {
        this.use_rvo = in_value;
    }
}

export class ConstantsSettings {
    tile_size: f32 = 1.5;  // tile size of the map
    visible_quad_size: f32 = 18.0;  // the size of one quad, used for tracking neighborhood movable items (in fact close to tile_size * visible_radius)
    neighborhood_quad_size: f32 = 1.5;  // this quad size used for building neighborhood grid and use it in rvo (for finding close actors)
    tiles_visible_radius: i32 = 12;
    player_radius: f32 = 0.5;
    monster_radius: f32 = 0.35;
    player_speed: f32 = 5.0;
    monster_speed: f32 = 3.5;
    player_rotation_speed: f32 = 10.0;
    monster_rotation_speed: f32 = 7.5;
    rvo_time_horizon: f32 = 0.5;
    monster_random_walk_target_radius: f32 = 3.0;  // radius where we select next random point to walk in
    monster_iddle_time: Array<f32> = [1.0, 5.0];  // in seconds
    monsters_per_room: Array<i32> = [3, 7];
    path_recalculate_time: f32 = 1.0;  // in seconds, after this time we should calculate the path to the target point

    set_rvo_time_horizon(in_value: f32): void {
        this.rvo_time_horizon = in_value;
    }

    set_neighborhood_quad_size(in_value: f32): void {
        this.neighborhood_quad_size = in_value;
    }

    set_path_recalculate_time(in_value: f32): void {
        this.path_recalculate_time = in_value;
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