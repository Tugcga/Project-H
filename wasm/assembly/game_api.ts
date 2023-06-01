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

export function settings_set_use_debug(settings: Settings, in_use_debug: boolean): void {
    settings.set_use_debug(in_use_debug);
}

export function settings_set_debug_flags(settings: Settings, in_show_path: boolean, in_show_closest: boolean): void {
    const debug = settings.get_debug();
    debug.show_path = in_show_path;
    debug.show_closest = in_show_closest;
}

export function settings_set_neighborhood_quad_size(settings: Settings, in_size: f32): void {
    const constants = settings.get_constants();
    constants.set_neighborhood_quad_size(in_size);
}

export function settings_set_rvo_time_horizon(settings: Settings, in_time: f32): void {
    const constants = settings.get_constants();
    constants.set_rvo_time_horizon(in_time);
}

export function create_game(settings: Settings): Game {
    return new Game(settings);
}

export function game_update(game: Game, dt: f32): void {
    game.update(dt);
}

export function game_client_point(game: Game, in_x: f32, in_y: f32): boolean {
    return game.client_point(in_x, in_y);
}

export function game_add_monsters(game: Game): void {
    game.add_monsters();
}
