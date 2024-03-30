import { Game } from "./game";
import { Settings } from "./game/settings";
import { VirtualWeapon } from "./game/virtuals";

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

export function settings_set_debug_flags(settings: Settings, 
                                         in_show_path: boolean, 
                                         in_show_closest: boolean,
                                         in_show_visible: boolean,
                                         in_show_neighborhood: boolean,
                                         in_show_enemy_targets: boolean): void {
    const debug = settings.get_debug();
    debug.show_path = in_show_path;
    debug.show_closest = in_show_closest;
    debug.show_visible_quad = in_show_visible;
    debug.show_neighborhood_quad = in_show_neighborhood;
    debug.show_enemy_targets = in_show_enemy_targets;
}

/*---Engine settings---*/
export function settings_set_neighbourhood_quad_size(settings: Settings, in_size: f32): void {
    const engine = settings.get_engine();
    engine.set_neighborhood_quad_size(in_size);
}

export function settings_set_visible_quad_size(settings: Settings, in_size: f32): void {
    const engine = settings.get_engine();
    engine.set_visible_quad_size(in_size);
}

export function settings_set_search_quad_size(settings: Settings, in_size: f32): void {
    const engine = settings.get_engine();
    engine.set_search_quad_size(in_size);
}

export function settings_set_rvo_time_horizon(settings: Settings, in_time: f32): void {
    const engine = settings.get_engine();
    engine.set_rvo_time_horizon(in_time);
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

export function settings_set_path_recalculate_time(settings: Settings, common_value: f32, follow_value: f32): void {
    const engine = settings.get_engine();
    engine.set_path_recalculate_time(common_value, follow_value);
}

export function settings_set_tiles_visible_radius(settings: Settings, in_value: i32): void {
    const engine = settings.get_engine();
    engine.set_tiles_visible_radius(in_value);
}

/*---Constants---*/
export function settings_set_monster_iddle_time(settings: Settings, min_value: f32, max_value: f32): void {
    const constants = settings.get_constants();
    constants.set_monster_iddle_time(min_value, max_value);
}

export function settings_set_monsters_per_room(settings: Settings, min_value: u32, max_value: u32): void {
    const constants = settings.get_constants();
    constants.set_monsters_per_room(min_value, max_value);
}

export function settings_set_select_radius_delta(settings: Settings, in_value: f32): void {
    const constants = settings.get_constants();
    constants.set_select_radius_delta(in_value);
}

export function settings_set_level_tile_size(settings: Settings, in_value: f32): void {
    const constants = settings.get_constants();
    constants.set_level_tile_size(in_value);
}

export function settings_set_monster_random_walk_radius(settings: Settings, in_value: f32): void {
    const constants = settings.get_constants();
    constants.set_monster_random_walk_radius(in_value);
}

/*---Default monster---*/
export function settings_set_default_monster_common(settings: Settings,
                                                    rotation_speed: f32, shield_resurrect: f32, hide_speed_multiplier: f32, hide_activate_time: f32, hide_cooldawn: f32): void {
    const defaults = settings.get_defaults();
    const def_monster = defaults.default_monster_parameters;
    def_monster.set_common_parameters(rotation_speed, shield_resurrect, hide_speed_multiplier, hide_activate_time, hide_cooldawn);
}

export function settings_set_default_monster_person(settings: Settings,
                                                    radius: f32, speed: f32, life: u32, search_radius: f32, search_spread: f32, team: i32): void {
    const defaults = settings.get_defaults();
    const def_monster = defaults.default_monster_parameters;
    def_monster.set_person_parameters(radius, speed, life, search_radius, search_spread, team);
}

/*---Default player---*/
export function settings_set_player(settings: Settings,
                                    radius: f32, speed: f32, life: u32, rotation_speed: f32, shield_resurrect: f32, default_team: i32,
                                    shift_speed_multiplier: f32, shift_distance: f32, shift_cooldawn: f32,
                                    hide_speed_multiplier: f32, hide_cooldawn: f32, hide_activate_time: f32): void {
    const defaults = settings.get_defaults();
    const dpp = defaults.default_player_parameters;

    dpp.radius = radius;
    dpp.speed = speed;
    dpp.life = life;
    dpp.rotation_speed = rotation_speed;
    dpp.shield_resurrect = shield_resurrect;
    dpp.default_team = default_team;
    
    dpp.shift_speed_multiplier = shift_speed_multiplier;
    dpp.shift_distance = shift_distance;
    dpp.shift_cooldawn = shift_cooldawn;

    dpp.hide_speed_multiplier = hide_speed_multiplier;
    dpp.hide_cooldawn = hide_cooldawn;
    dpp.hide_activate_time = hide_activate_time;
}

/*---Monster weapon*/
export function settings_set_default_monster_weapon(settings: Settings,
                                                    attack_time: f32, attack_distance: f32, attack_cooldawn: f32, shield: f32, damage: u32, damage_distance: f32): void {
    const defaults = settings.get_defaults();
    const dmw = defaults.default_monster_weapon;

    dmw.attack_time = attack_time;
    dmw.attack_distance = attack_distance;
    dmw.attack_cooldawn = attack_cooldawn;
    dmw.shield = shield;
    dmw.damage = damage;
    dmw.damage_distance = damage_distance;
}

/*---Default weapons---*/
export function settings_set_default_empty_weapon(settings: Settings,
                                                  attack_time: f32, attack_distance: f32, attack_cooldawn: f32, damage_distance: f32, damage: u32, shield: f32): void {
    const default_weapon = settings.get_default_weapons();
    default_weapon.set_empty_weapon(attack_time, attack_distance, attack_cooldawn, damage_distance, damage, shield);
}

export function settings_set_default_shadow_weapon(settings: Settings,
                                                   attack_time: f32, attack_distance: f32, attack_cooldawn: f32, damage_distance: f32): void {
    const default_weapon = settings.get_default_weapons();
    default_weapon.set_shadow_weapon(attack_time, attack_distance, attack_cooldawn, damage_distance);
}

/*---Utility funcions, for gameplay tests---*/
export function dev_game_resurrect_player(game: Game): void {
    game.dev_resurrect_player();
}

export function dev_game_spawn_monster(game: Game,
                                       radius: f32, position_x: f32, position_y: f32, move_speed: f32, life: u32, 
                                       virtual_weapon: VirtualWeapon, search_radius: f32, search_spread: f32, team: i32, friend_for_player: bool): void {
    game.dev_emit_one_monster(radius, position_x, position_y, move_speed, life, virtual_weapon, search_radius, search_spread, team, friend_for_player);
}

export function dev_game_move_entity(game: Game, entity: u32, pos_x: f32, pos_y: f32): void {
    game.dev_move_entity(entity, pos_x, pos_y);
}

export function dev_add_sword_to_player(game: Game,
                                        attack_distance: f32, attack_time: f32, attack_cooldawn: f32, damage: u32, shield: f32,
                                        damage_spread: f32, damage_distance: f32): void {
    game.dev_create_sword(attack_distance, attack_time, attack_cooldawn, damage, shield, damage_spread, damage_distance);
}

export function dev_add_bow_to_player(game: Game,
                                      attack_distance: f32, attack_time: f32, attack_cooldawn: f32, damage: u32, shield: f32): void {
    game.dev_create_bow(attack_distance, attack_time, attack_cooldawn, damage, shield);
}

export function dev_player_equip_sword(game: Game): void {
    game.dev_equip_sword();
}

export function dev_player_equip_bow(game: Game): void {
    game.dev_equip_bow();
}

export function dev_player_equip_free_hands(game: Game): void {
    game.dev_equip_free_hands();
}

export function dev_create_virtual_sword(game: Game,
                                         attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32,
                                         damage_distance: f32, damage_spread: f32): VirtualWeapon {
    return game.dev_create_virtual_sword(attack_distance, attack_time, attack_cooldawn, shield, damage, damage_distance, damage_spread);
}

export function dev_create_virtual_bow(game: Game,
                                       attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32): VirtualWeapon {
    return game.dev_create_virtual_bow(attack_distance, attack_time, attack_cooldawn, shield, damage);
}

export function dev_create_virtual_empty_weapon(game: Game,
                                         attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32,
                                         damage_distance: f32): VirtualWeapon {
    return game.dev_create_virtual_empty_weapon(attack_distance, attack_time, attack_cooldawn, shield, damage, damage_distance);
}

/*---Game API---*/
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

export function game_client_toggle_hide(game: Game): void {
    game.player_toggle_hide();
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

export function game_stun_all_entities(game: Game, duration: f32): void {
    game.stun_all_entities(duration);
}
