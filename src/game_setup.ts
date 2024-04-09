import { ClientBase } from "./client_base";

// these parameters we define from the game url
class GameParameters {
    use_debug: boolean = false;
}

function parse_parameters(parameters_str: string): GameParameters {
    const params = new GameParameters();
    const url_search = new URLSearchParams(parameters_str);
    
    const param_debug = url_search.get("debug");
    if (param_debug && param_debug == "true") {
        params.use_debug = true;
    }

    return params;
}

export function game_setup(client: ClientBase, module, settings_ptr, link_parameters: string) {
    // parse parameters
    const params = parse_parameters(link_parameters);
    const use_debug = params.use_debug;
    // change default settings
    // select random seed
    const seed = Math.floor(Math.random() * 4294967295);
    // controllable seed ↓ for test
    if (use_debug) {
        module.settings_set_seed(settings_ptr, 12);
        console.log("use seed", 12);
    } else {
        module.settings_set_seed(settings_ptr, seed);
        console.log("use seed", seed);
    }
    module.settings_set_rvo_time_horizon(settings_ptr, 0.25);
    if (use_debug) {
        // use these settings ↓ for development
        // module.settings_set_generate(settings_ptr, 12, 3, 4, 1);
        // another settings
        module.settings_set_generate(settings_ptr, 18, 6, 6, 2);
    } else {
        module.settings_set_generate(settings_ptr,
            22,  // level size
            2, 4,  // min and max room size
            10  // the number of rooms
        );
    }

    // activate debug info
    module.settings_set_use_debug(settings_ptr, use_debug);
    client.debug_define_draw_flag(use_debug);  // for the client
    module.settings_set_debug_flags(settings_ptr, 
        true,  // show path
        false,  // show lines to the closest entities
        false,  // show visible rect
        false,  // show neighbourhood rect
        false,  // show search rect
        false,  // show mid rect
        true);  // show lines to monster enemies
    // setup engine settings
    if (use_debug) {
        module.settings_set_react_attack(settings_ptr, false);
    }
    module.settings_set_snap_to_navmesh(settings_ptr, true);
    module.settings_set_use_rvo(settings_ptr, true);
    module.settings_set_path_recalculate_time(settings_ptr, 1.0, 0.1);
    module.settings_set_velocity_boundary_control(settings_ptr, true);
    module.settings_set_level_tile_size(settings_ptr, 1.5);  // size of one tile in the map
    module.settings_set_tiles_visible_radius(settings_ptr, 12);  // how many map tiles are visible around the player
    module.settings_set_search_system_chunk_count(settings_ptr, 5);
    module.settings_set_visible_quad_size(settings_ptr, 18.0);  // visibility radius for the player
    module.settings_set_neighbourhood_quad_size(settings_ptr, 1.0);  // tweak this for greater radius for search close entities
    module.settings_set_search_quad_size(settings_ptr, 5.2);  // used for search enemies, should be greater than monster search radius
    module.settings_set_mid_quad_size(settings_ptr, 4.0);  // used for attack, should be greater than weapon (and skills) damage radius
    // setup game items default parameters
    module.settings_set_player(settings_ptr, 0.5,  // radius
        5.0,  // speed
        12,  // life
        24.0,  // rotation speed
        1.0,  // shield resurrect
        1,  // team
        3.0,  // shift speed multiplier
        7.0,  // shift distance
        1.0,  // shift cooldawn
        0.5,  // hide speed multiplier
        1.0,  // hide cooldawn
        0.5);  // hide activate time
    module.settings_set_default_empty_weapon(settings_ptr, 0.5,  // attack time
        1.0,  // attack distance
        0.75,  // attack cooldawn
        1.5,  // damage distance
        4,  // damage
        5.0);  // shield
    
    module.settings_set_default_monster_person(settings_ptr, 0.5,  // radius
        3.0,  // speed
        8,  // life
        5.0,  // search radius
        Math.PI / 2.5,  // search spread
        -1);  // team
    
    if (use_debug) {
        module.settings_set_monster_iddle_time(settings_ptr, 1000.0, 2000.0);
        module.settings_set_monsters_per_room(settings_ptr, 5, 50);  // no random monsters
    } else {
        module.settings_set_monster_iddle_time(settings_ptr, 1.0, 2.0);
        module.settings_set_monsters_per_room(settings_ptr, 3, 5);
    }
}

export function setup_player_inventar(module, local_this) {
    // add weapons to the player inventory
    module.dev_add_sword_to_player(local_this.m_game_ptr,
            1.0, 0.75, 1.25, 7, 12.0, Math.PI / 2.0, 2.0);
    module.dev_add_bow_to_player(local_this.m_game_ptr,
        5.5, 0.5, 0.75, 7, 7.0, 12.0);
}