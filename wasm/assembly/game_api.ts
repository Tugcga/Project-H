import { Game } from "./game";
import { Settings } from "./game/settings";

export function create_settings(): Settings {
    return new Settings();
}

export function settings_set_seed(settings: Settings, seed: u32): void {
    settings.set_seed(seed);
}

export function settings_set_generate(settings: Settings, level_size: u32, room_min_size: u32, room_max_size: u32, rooms_count: u32): void {
    let generate = settings.get_generate();
    generate.set_level_size(level_size);
    generate.set_room_size(room_min_size, room_max_size);
    generate.set_rooms_count(rooms_count);
}

export function settings_set_monsters_per_room(settings: Settings, min_value: u32, max_value: u32): void {
    const constants = settings.get_constants();
    constants.set_monsters_per_room(min_value, max_value);
}

export function settings_set_use_debug(settings: Settings, in_use_debug: boolean): void {
    settings.set_use_debug(in_use_debug);
}

export function settings_set_debug_flags(settings: Settings, 
                                         in_show_path: boolean, 
                                         in_show_closest: boolean,
                                         in_show_visible: boolean,
                                         in_show_neighborhood: boolean): void {
    const debug = settings.get_debug();
    debug.show_path = in_show_path;
    debug.show_closest = in_show_closest;
    debug.show_visible_quad = in_show_visible;
    debug.show_neighborhood_quad = in_show_neighborhood;
}

export function settings_set_neighborhood_quad_size(settings: Settings, in_size: f32): void {
    const constants = settings.get_constants();
    constants.set_neighborhood_quad_size(in_size);
}

export function settings_set_rvo_time_horizon(settings: Settings, in_time: f32): void {
    const constants = settings.get_constants();
    constants.set_rvo_time_horizon(in_time);
}

export function settings_set_use_rvo(settings: Settings, in_value: boolean): void {
    const engine = settings.get_engine();
    engine.set_use_rvo(in_value);
}

export function settings_set_snap_to_navmesh(settings: Settings, in_value: boolean): void {
    const engine = settings.get_engine();
    engine.set_snap_to_navmesh(in_value);
}

export function settings_set_velocity_boundary_control(settings: Settings, in_value: boolean): void {
    const engine = settings.get_engine();
    engine.set_velocity_boundary_control(in_value);
}

export function settings_set_path_recalculate_time(settings: Settings, in_value: f32): void {
    const constants = settings.get_constants();
    constants.set_path_recalculate_time(in_value);
}

export function settings_set_player_fast_shift(settings: Settings, speed_multiplier: f32, distance: f32, cooldawn: f32): void {
    const constants = settings.get_constants();
    constants.set_player_shift(speed_multiplier, distance, cooldawn);
}

export function settings_set_monster_iddle_time(settings: Settings, min_iddle: f32, max_iddle: f32): void {
    const constants = settings.get_constants();
    constants.set_monster_iddle_time(min_iddle, max_iddle);
}

export function settings_set_player_melee_attack(settings: Settings, distance: f32, time_span: f32, cooldawn: f32, damage: u32, damage_spread: f32, damage_distance: f32): void {
    const constants = settings.get_constants();
    constants.set_player_melee_attack(distance, time_span, cooldawn, damage, damage_spread, damage_distance);
}

export function settings_set_monster_melee_attack(settings: Settings, distance: f32, time_span: f32, cooldawn: f32, damage: u32, damage_spread: f32, damage_distance: f32): void {
    const constants = settings.get_constants();
    constants.set_monster_melee_attack(distance, time_span, cooldawn, damage, damage_spread, damage_distance);
}

export function settings_set_player_shield(settings: Settings, shield: f32, resurrect: f32): void {
    const constants = settings.get_constants();
    constants.set_player_shield(shield, resurrect);
}

export function settings_set_monster_shield(settings: Settings, shield: f32, resurrect: f32): void {
    const constants = settings.get_constants();
    constants.set_monster_shield(shield, resurrect);
}

export function settings_set_player_life(settings: Settings, value: u32): void {
    const constants = settings.get_constants();
    constants.set_player_life(value);
}

export function settings_set_monster_life(settings: Settings, value: u32): void {
    const constants = settings.get_constants();
    constants.set_monster_life(value);
}

export function create_game(settings: Settings): Game {
    return new Game(settings);
}

export function game_update(game: Game, dt: f32): void {
    game.update(dt);
}

export function game_client_point(game: Game, in_x: f32, in_y: f32): void {
    game.client_point(in_x, in_y);
}

export function game_client_shift(game: Game, cursor_x: f32, cursor_y: f32): void {
    game.player_shift(cursor_x, cursor_y);
}

export function game_client_shield(game: Game): void {
    game.player_shield();
}

export function game_client_release_shield(game: Game): void {
    game.player_release_shield();
}

export function game_add_monsters(game: Game): void {
    game.add_monsters();
}

export function game_make_aggressive(game: Game): void {
    game.make_aggressive();
}

export function game_damage_all_entities(game: Game, damage: u32): void {
    game.damage_all_entities(damage);
}
