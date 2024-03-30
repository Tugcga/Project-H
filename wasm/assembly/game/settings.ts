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
    
    velocity_boundary_control: bool = true;

    use_rvo: bool = true;
    rvo_time_horizon: f32 = 0.5;

    visible_quad_size: f32 = 18.0;  // the size of one quad, used for tracking neighborhood movable items (in fact close to tile_size * visible_radius)
    neighborhood_quad_size: f32 = 1.5;  // this quad size used for building neighborhood grid and use it in rvo (for finding close actors)
    search_quad_size: f32 = 5.0;
    tiles_visible_radius: i32 = 12;

    path_recalculate_time: f32 = 1.0;  // in seconds, after this time we should calculate the path to the target point
    path_to_target_recalculate_time: f32 = 0.1; // in seconds, time for recalculate path when the entity follow to the target actor (it can move, so, we should update the path)

    set_snap_to_navmesh(in_value: bool): void {
        this.snap_to_navmesh = in_value;
    }

    set_use_rvo(in_value: bool): void {
        this.use_rvo = in_value;
    }

    set_rvo_time_horizon(in_value: f32): void {
        this.rvo_time_horizon = in_value;
    }

    set_velocity_boundary_control(in_value: bool):void {
        this.velocity_boundary_control = in_value;
    }

    set_visible_quad_size(in_value: f32): void {
        this.visible_quad_size = in_value;
    }

    set_neighborhood_quad_size(in_value: f32): void {
        this.neighborhood_quad_size = in_value;
    }

    set_path_recalculate_time(common_value: f32, target_follow_value: f32): void {
        this.path_recalculate_time = common_value;
        this.path_to_target_recalculate_time = target_follow_value;
    }

    set_search_quad_size(in_value: f32): void {
        this.search_quad_size = in_value;
    }

    set_tiles_visible_radius(in_value: i32): void {
        this.tiles_visible_radius = in_value;
    }
}

export class ConstantsSettings {
    radius_select_delta: f32 = 0.25;  // this value is add to the entity radius to define select circle
    tile_size: f32 = 1.5;  // tile size of the map
    
    monster_random_walk_target_radius: f32 = 3.0;  // radius where we select next random point to walk in
    monster_iddle_time: Array<f32> = [1.0, 5.0];  // in seconds
    monsters_per_room: Array<u32> = [3, 7];

    set_monster_iddle_time(in_min: f32, in_max: f32): void {
        this.monster_iddle_time[0] = in_min;
        this.monster_iddle_time[1] = in_max;
    }

    set_monsters_per_room(min_count: u32, max_count: u32): void {
        this.monsters_per_room[0] = min_count;
        this.monsters_per_room[1] = max_count;
    }

    set_select_radius_delta(in_value: f32): void {
        this.radius_select_delta = in_value;
    }

    set_level_tile_size(in_value: f32): void {
        this.tile_size = in_value;
    }

    set_monster_random_walk_radius(in_value: f32): void {
        this.monster_random_walk_target_radius = in_value;
    }
}

export class DefaultMonsterParameters {
    // these parameters are common for all monsters
    // it has tecnical aspect
    rotation_speed: f32 = 7.5;
    shield_resurrect: f32 = 1.0;
    hide_speed_multiplier: f32 = 0.3;
    hide_activate_time: f32 = 0.5;
    hide_cooldawn: f32 = 2.0;

    // these parameters can be varied for create monsters of the different type
    speed: f32 = 3.5;
    radius: f32 = 0.6;
    life: u32 = 12;
    team: i32 = -1;
    search_radius: f32 = 5.0;
    search_spread: f32 = Mathf.PI / 2.0;

    set_common_parameters(rotation_speed: f32, shield_resurrect: f32, hide_speed_multiplier: f32, hide_activate_time: f32, hide_cooldawn: f32): void {
        this.rotation_speed = rotation_speed;
        this.shield_resurrect = shield_resurrect;
        this.hide_speed_multiplier = hide_speed_multiplier;
        this.hide_activate_time = hide_activate_time;
        this.hide_cooldawn = hide_cooldawn;
    }

    set_person_parameters(radius: f32, speed: f32, life: u32, search_radius: f32, search_spread: f32, team: i32):void {
        this.radius = radius;
        this.speed = speed;
        this.life = life;
        this.search_radius = search_radius;
        this.search_spread = search_spread;
        this.team = team;
    }
}

export class DefaultPlayerParameters {
    default_team: i32 = 1;
    radius: f32 = 0.5;
    rotation_speed: f32 = 7.5;
    speed: f32 = 5.0;
    shield_resurrect: f32 = 1.0;
    life: u32 = 24;

    shift_speed_multiplier: f32 = 5.0;
    shift_distance: f32 = 2.0;
    shift_cooldawn: f32 = 0.5;

    hide_speed_multiplier: f32 = 0.5;
    hide_cooldawn: f32 = 0.5;
    hide_activate_time: f32 = 0.25;
}

export class DefaultMonsterWeapon {
    // for deafult mosnter we use free-hand weapon
    attack_time: f32 = 0.75;
    attack_distance: f32 = 1.25;
    attack_cooldawn: f32 = 1.0;
    shield: f32 = 5.0;
    damage: u32 = 3;
    damage_distance: f32 = 1.5;
}

export class DefaultWeapons {
    empty_weapon_attack_time: f32 = 1.5;
    empty_weapon_attack_distance: f32 = 1.25;
    empty_weapon_attack_cooldawn: f32 = 2.0;
    empty_weapon_damage_distance: f32 = 1.5;
    empty_weapon_damage: u32 = 1;
    empty_weapon_shield: f32 = 5.0;

    shadow_attack_time: f32 = 1.0;
    shadow_attack_distance: f32 = 1.25;
    shadow_attack_cooldawn: f32 = 2.0;
    shadow_damage_distance: f32 = 1.5;

    set_empty_weapon(attack_time: f32, attack_distance: f32, attack_cooldawn: f32, damage_distance: f32, damage: u32, shield: f32): void {
        this.empty_weapon_attack_time = attack_time;
        this.empty_weapon_attack_distance = attack_distance;
        this.empty_weapon_attack_cooldawn = attack_cooldawn;
        this.empty_weapon_damage_distance = damage_distance;
        this.empty_weapon_damage = damage;
        this.empty_weapon_shield = shield;
    }

    set_shadow_weapon(attack_time: f32, attack_distance: f32, attack_cooldawn: f32, damage_distance: f32): void {
        this.shadow_attack_time = attack_time;
        this.shadow_attack_distance =attack_distance;
        this.shadow_attack_cooldawn = attack_cooldawn;
        this.shadow_damage_distance = damage_distance;
    }
}

export class Defaults {
    default_weapons: DefaultWeapons;
    default_monster_weapon: DefaultMonsterWeapon;
    default_monster_parameters: DefaultMonsterParameters;
    default_player_parameters: DefaultPlayerParameters;
    default_stun_time: f32 = 1.0;

    constructor() {
        this.default_weapons = new DefaultWeapons();
        this.default_monster_weapon = new DefaultMonsterWeapon();
        this.default_monster_parameters = new DefaultMonsterParameters();
        this.default_player_parameters = new DefaultPlayerParameters();
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
    defaults: Defaults;
    engine: EngineSettings;
    debug: DebugSettings;

    constructor() {
        this.seed = 1;
        this.generate = new GenerateSettings();
        this.constants = new ConstantsSettings();
        this.defaults = new Defaults();
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

    get_defaults(): Defaults {
        return this.defaults;
    }

    get_default_weapons(): DefaultWeapons {
        return this.defaults.default_weapons;
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