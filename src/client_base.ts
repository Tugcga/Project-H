import { __Internref19, instantiate } from "../wasm/build/game_api";
import { SceneMap } from "./scene/scene_map";
import { Scene } from "./scene/scene";
import { Transform } from "./transform";
import { COOLDAWN, DAMAGE_TYPE, DEFAULT_HEIGHT, DEFAULT_WIDTH, DOUBLE_TOUCH_CURSOR_DELTA, DOUBLE_TOUCH_DELTA, MOVE_STATUS, RESIZABLE_HEIGHT_CLASS_NAME, RESIZABLE_WIDTH_CLASS_NAME, TARGET_ACTION, TILE_PIXELS_SIZE } from "./constants";
import { cursor_coordinates, touch_coordinates } from "./utilities";
import { GameUI } from "./ui/ui";

// base class for client of the game
// it implement functionality for connecting between wasm module (the server) and client IO
// particular graphic backend should use this base class
export abstract class ClientBase {
    m_game_ptr: __Internref19;
    m_scene_canvas: HTMLCanvasElement;
    m_scene_ctx: CanvasRenderingContext2D;

    m_map_canvas: HTMLCanvasElement;
    m_map_ctx: CanvasRenderingContext2D;

    m_scene: Scene;

    m_ui: GameUI;

    m_level_width: number;
    m_level_height: number;
    m_level_tile_size: number;

    m_current_time: number;
    m_module: any = undefined;
    m_is_start: boolean = false;

    m_map: SceneMap;
    m_wtc_tfm: Transform = new Transform();
    m_wtc_scale: number = 1.0;
    m_is_left_mouse_press: boolean = false;
    m_is_right_mouse_press: boolean = false;
    m_mouse_event: MouseEvent;
    m_last_touch_time: number = performance.now();
    m_last_touch_coords: [number, number] = [0, 0];

    m_total_level_entities: number = 0;

    m_is_game_active: boolean = true;
    m_is_pause: boolean = false;  // turn on only when pause the game manually

    // in start method current client implementation should start render loop
    // this loop should at first call update method, and only then process other stuff
    abstract start(): void;
    // called by the base when we change the game canvas size (after resizing the window)
    abstract on_canvas_resize(in_width: number, in_height: number): void;
    // input is coordinates on the screen, output is world coordinates of the point
    // conversation depends on the client implementation
    abstract point_to_world(in_x: number, in_y: number) : number[];
    // abstract mouse_click(inc_x: number, inc_y: number, inw_x: number, inw_y: number): void;
    // when we should delete the tile from the scene, call this method to delete the shape from the client
    abstract scene_tile_delete(index: number): void;
    // the same for create new tile
    // pos_x and pos_y world coordinates of the tile
    abstract scene_tile_create(pos_x: number, pos_y: number, index: number, type: number): void;
    // define player methods called after the module update player properties
    // it should be used in the client to update player shape
    abstract scene_create_player(radius: number): void;
    abstract scene_update_entity_position(id: number, pos_x: number, pos_y: number): void;
    abstract scene_update_entity_angle(id: number, angle: number): void;
    abstract scene_update_entity_move_status(id: number, move_status: MOVE_STATUS): void;
    abstract scene_update_entity_life(id: number, life: number, max_life: number): void;
    abstract scene_update_entity_shield(id: number, shield: number, max_shield: number): void;
    abstract scene_update_entity_params(entity: number, life: number, max_life: number, select_radius: number, attack_distance: number, attack_time: number): void;
    abstract scene_create_monster(entity: number, radius: number): void;
    abstract scene_remove_monster(entity: number): void;
    abstract scene_entity_start_shift(entity: number): void;
    abstract scene_entity_finish_shift(entity: number): void;
    abstract scene_entity_activate_shield(entity: number): void;
    abstract scene_entity_release_shield(entity: number): void;
    abstract scene_entity_start_melee_attack(entity: number, time: number, damage_distance: number, damage_spread: number): void;
    abstract scene_entity_finish_melee_attack(entity: number): void;
    abstract scene_entity_start_cooldawn(entity: number, cooldawn_id: COOLDAWN, time: number): void;
    abstract scene_click_entity(entity: number, action_id: TARGET_ACTION): void;
    abstract scene_click_position(pos_x: number, pos_y: number): void;
    abstract scene_entity_damaged(attacker_entity: number, target_entity: number, damage: number, damage_type: DAMAGE_TYPE): void;
    abstract scene_entity_dead(entity: number): void;
    abstract scene_entity_start_stun(entity: number, duration: number): void;
    abstract scene_entity_finish_stun(entity: number): void;
    // debug callbacks
    // if debug is off, then these callbacks are not required
    // it never called from the module
    abstract debug_entity_trajectory(entity: number, coordinates: Float32Array): void;
    abstract debug_close_entity_pair(entity_a: number, a_pos_x: number, a_pos_y: number, entity_b: number, b_pos_x: number, b_pos_y: number): void;
    abstract debug_player_visible_quad(start_x: number, start_y: number, end_x: number, end_y: number): void;
    abstract debug_player_neighbourhood_quad(start_x: number, start_y: number, end_x: number, end_y: number): void;

    constructor() {
        // define host functions for external calls from the wasm module
        globalThis.host = {
            define_level: this.define_level.bind(this),
            define_navmesh: this.define_navmesh.bind(this),
            define_total_tiles: this.define_total_tiles.bind(this),
            tile_delete: this.tile_delete.bind(this),
            tile_create: this.tile_create.bind(this),
            create_player: this.create_player.bind(this),
            update_entity_params: this.update_entity_params.bind(this),
            create_monster: this.create_monster.bind(this),
            define_entity_changes: this.define_entity_changes.bind(this),
            remove_monster: this.remove_monster.bind(this),
            define_total_update_entities: this.define_total_update_entities.bind(this),
            entity_start_shift: this.entity_start_shift.bind(this),
            entity_finish_shift: this.entity_finish_shift.bind(this),
            entity_activate_shield: this.entity_activate_shield.bind(this),
            entity_release_shield: this.entity_release_shield.bind(this),
            entity_start_melee_attack: this.entity_start_melee_attack.bind(this),
            entity_finish_melee_attack: this.entity_finish_melee_attack.bind(this),
            entity_start_cooldawn: this.entity_start_cooldawn.bind(this),
            entity_start_stun: this.entity_start_stun.bind(this),
            entity_finish_stun: this.entity_finish_stun.bind(this),
            click_entity: this.click_entity.bind(this),
            click_position: this.click_position.bind(this),
            entity_dead: this.entity_dead.bind(this),
            entity_damaged: this.entity_damaged.bind(this),
            debug_entity_walk_path: this.debug_entity_walk_path.bind(this),
            debug_close_entity: this.debug_close_entity.bind(this),
            debug_visible_quad: this.debug_visible_quad.bind(this),
            debug_neighbourhood_quad: this.debug_neighbourhood_quad.bind(this)
        };

        // setup ui
        this.m_ui = new GameUI();
        this.m_ui.assign_fps_element("fps");
        this.m_ui.assign_count_elements("level_count", "visible_count");
        this.m_ui.assign_pause_screen("pause");
        this.m_ui.assign_loading("loading");

        // get canvas elements from html
        // for scene
        this.m_scene_canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.m_scene_ctx = this.m_scene_canvas.getContext("2d")!;

        // and for map
        this.m_map_canvas = document.getElementById("map_canvas") as HTMLCanvasElement;
        this.m_map_ctx = this.m_map_canvas.getContext("2d")!;

        // resize canvases
        this.setup_canvas_size();

        // disable map canvas mouse interaction
        this.m_map_canvas.style.pointerEvents = "none";

        // store the current time
        this.m_current_time = performance.now();

        // disable right click menu
        window.addEventListener("contextmenu", event => event.preventDefault());

        // setup event
        const local_this = this;
        // keyboard
        document.onkeydown = function(event) {
            local_this.key_event(event.key);

            // stop scrolling the page by the space
            // and also other space actions
            return !(event.key == " ");
        }

        const is_touch_input = "ontouchstart" in window && navigator.maxTouchPoints;
        if (is_touch_input) {
            this.m_scene_canvas.addEventListener("touchstart", (event) => {
                event.preventDefault();
                local_this.touch_start_event(event);
            });
        } else {
            // mouse click, release and move
            this.m_scene_canvas.addEventListener("mousedown", function(event) {
                local_this.mouse_press_event(event);
            });
            this.m_scene_canvas.addEventListener("mouseup", function(event) {
                local_this.mouse_release_event(event);
            });
            document.onmousemove = function(event) {
                local_this.m_mouse_event = event;
            }
        }

        document.addEventListener("visibilitychange" , function() {
            local_this.visibilitychange_event();
        });

        window.addEventListener("resize", function() {
            local_this.setup_canvas_size();
        });

        // finally, load the wasm module
        fetch("/build/game_api.wasm")
            .then((response) => WebAssembly.compileStreaming(response))
            .then((result) => instantiate(result, { env: {}})
            .then((module) => {
                local_this.m_module = module;
                console.log("finish to load the module:", (performance.now() - local_this.m_current_time) / 1000.0, "seconds");
                local_this.m_current_time = performance.now();

                // create settings object
                const settings_ptr = module.create_settings();
                // change default settings
                // select random seed
                const seed = Math.floor(Math.random() * 4294967295);
                // controllable seed ↓ for test
                module.settings_set_seed(settings_ptr, 12);
                module.settings_set_rvo_time_horizon(settings_ptr, 0.25);
                module.settings_set_neighbourhood_quad_size(settings_ptr, 2.0);  // tweak this for greater radius for search close entities
                module.settings_set_generate(settings_ptr,
                    22,  // level size
                    2, 4,  // min and max room size
                    10  // the number of rooms
                );
                // use these settings ↓ for development
                module.settings_set_generate(settings_ptr, 12, 3, 4, 1);

                // activate debug info
                module.settings_set_use_debug(settings_ptr, true);
                module.settings_set_debug_flags(settings_ptr, true, true, false, true);
                module.settings_set_snap_to_navmesh(settings_ptr, true);
                module.settings_set_use_rvo(settings_ptr, true);
                module.settings_set_path_recalculate_time(settings_ptr, 1.0);
                module.settings_set_velocity_boundary_control(settings_ptr, true);
                module.settings_set_player_fast_shift(settings_ptr, 2.0, 5.0, 0.5);
                module.settings_set_monster_iddle_time(settings_ptr, 1.0, 2.0);
                module.settings_set_monsters_per_room(settings_ptr, 1, 1);
                module.settings_set_player_melee_attack(settings_ptr, 1.25,  // attack distance
                                                                      0.75,  // how long attack cast
                                                                      1.0,  // cooldawn, start after attack is finish
                                                                      5,  // damage
                                                                      Math.PI / 2.0,  // angles spread
                                                                      1.5);  // damage cone size
                module.settings_set_monster_melee_attack(settings_ptr, 0.75,  // distance
                                                                       0.75,  // how long
                                                                       0.75,  // cooldawn
                                                                       3,  // damage
                                                                       Math.PI / 4,  // spread
                                                                       1.0);  // cone size
                module.settings_set_player_shield(settings_ptr, 15.0, 5.0);
                
                // create the game
                // this method calls some callbacks:
                // - define_level
                // - define_total_tiles
                // - define_navmesh
                local_this.m_game_ptr = module.create_game(settings_ptr);

                console.log("generate the level:", (performance.now() - local_this.m_current_time) / 1000.0, "seconds");
                local_this.m_current_time = performance.now();

                // call client start method
                local_this.start();
                local_this.m_is_start = true;

                // after start disable loading screen
                local_this.m_ui.off_pause();
                local_this.m_ui.loading_hide();
        }));
    }

    setup_canvas_size() {
        const window_width = window.innerWidth;
        const window_height = window.innerHeight;

        let game_width = DEFAULT_WIDTH;
        let game_height = DEFAULT_HEIGHT;
        if (window_width < DEFAULT_WIDTH || window_height < DEFAULT_HEIGHT) {
            game_width = window_width;
            game_height = window_height;
        }

        const width_elements = document.getElementsByClassName(RESIZABLE_WIDTH_CLASS_NAME);
        for (let i = 0; i < width_elements.length; i++) {
            const element = width_elements[i] as HTMLElement;
            element.style.width = game_width + "px";
        }
        const height_elements = document.getElementsByClassName(RESIZABLE_HEIGHT_CLASS_NAME);
        for (let i = 0; i < height_elements.length; i++) {
            const element = height_elements[i] as HTMLElement;
            element.style.height = game_height + "px";
        }

        // resize both canvases
        if (this.m_scene_canvas) {
            this.m_scene_canvas.width  = game_width;
            this.m_scene_canvas.height = game_height;
        }
        if (this.m_map_canvas) {
            this.m_map_canvas.width  = game_width;
            this.m_map_canvas.height = game_height;
        }

        // get main window div
        const window_div = document.getElementById("window");
        if (window_div) {
            window_div.style.left = (window_width - game_width) / 2.0 + "px";
            window_div.style.top = (window_height - game_height) / 2.0 + "px";
        }

        // update the host
        this.on_canvas_resize(game_width, game_height);
    }

    visibilitychange_event() {
        if (document.hidden) {
            this.deactivate();
        } else {
            if(!this.m_is_pause) {
                this.activate();
            }
        }
    }

    activate() {
        this.m_is_game_active = true;
        this.m_current_time = performance.now();

        this.m_ui.off_pause();
    }

    deactivate() {
        this.m_is_game_active = false;

        this.m_ui.on_pause();
    }

    toggle_activate() {
        if(this.m_is_game_active) {
            this.deactivate();
            this.m_is_pause = true;
        } else {
            this.activate();
            this.m_is_pause = false;
        }
    }

    touch_start_event(event: TouchEvent) {
        if (this.m_is_start && this.m_is_game_active) {
            const c = touch_coordinates(this.m_scene_canvas, event);
            if (c.length > 0) {
                const touch_time = performance.now();
                const c_world = this.point_to_world(c[0], c[1]);
                if (touch_time - this.m_last_touch_time < DOUBLE_TOUCH_DELTA && 
                    Math.abs(c_world[0] - this.m_last_touch_coords[0]) < DOUBLE_TOUCH_CURSOR_DELTA &&
                    Math.abs(c_world[1] - this.m_last_touch_coords[1]) < DOUBLE_TOUCH_CURSOR_DELTA) {
                    // this is double touch
                    // make the shift
                    this.m_module.game_client_shift(this.m_game_ptr, c_world[0], c_world[1]);
                } else {
                    // this is single touch
                    const is_send = this.m_scene.input_click(c[0], c[1], c_world[0], c_world[1], true);
                    if (is_send) {
                        this.m_module.game_client_point(this.m_game_ptr, c_world[0], c_world[1]);
                    }
                }

                this.m_last_touch_time = touch_time;
                this.m_last_touch_coords[0] = c_world[0];
                this.m_last_touch_coords[1] = c_world[1];
            }
        }
    }

    mouse_press_event(event: MouseEvent) {
        this.m_mouse_event = event;
        const is_left_click = event.button == 0;
        const is_right_click = event.button == 2;
        if (this.m_is_start && this.m_is_game_active) {
            if (is_left_click) {
                this.m_is_left_mouse_press = true;
    
                const c = cursor_coordinates(this.m_scene_canvas, event);
                const c_world = this.point_to_world(c[0], c[1]);
                const is_send = this.m_scene.input_click(c[0], c[1], c_world[0], c_world[1], true);
                if (is_send) {
                    this.m_module.game_client_point(this.m_game_ptr, c_world[0], c_world[1]);
                }
            }
            if (is_right_click) {
                this.m_is_right_mouse_press = true;
                this.m_module.game_client_shield(this.m_game_ptr);
            }
        }
    }

    mouse_release_event(event: MouseEvent) {
        const is_left_release = event.button == 0;
        const is_right_release = event.button == 2;
        if(this.m_is_start) {
            if (is_left_release) {
                this.m_is_left_mouse_press = false;
                this.m_scene.reset_click();
            }
            if(is_right_release) {
                this.m_is_right_mouse_press = false;
                this.m_module.game_client_release_shield(this.m_game_ptr);
            }
            
        }
    }

    key_event(key: string) {
        if(this.m_is_start) {
            if(key == "Escape") {
                // pause the game
                this.toggle_activate();
            } else if(this.m_is_game_active) {
                // read all other keys only when the game is active
                if(key == "s") {
                    // add monster
                    this.m_module.game_add_monsters(this.m_game_ptr);
                } else if(key == "a") {
                    this.m_module.game_make_aggressive(this.m_game_ptr);
                } else if(key == "d") {
                    this.m_module.game_damage_all_entities(this.m_game_ptr, 1.5);
                } else if (key == "t") {
                    this.m_module.game_stun_all_entities(this.m_game_ptr, 1.0);
                } else if(key == "m") {
                    this.m_map.toggle_active();
                } else if(key == "+") {
                    this.m_map.scale_up();
                } else if(key == "-") {
                    this.m_map.scale_down();
                } else if (key == " ") {
                    const c = cursor_coordinates(this.m_scene_canvas, this.m_mouse_event);
                    const c_world = this.point_to_world(c[0], c[1]);
                    this.m_module.game_client_shift(this.m_game_ptr, c_world[0], c_world[1]);
                }
            }
        }
    }
    
    update() {
        if (this.m_is_game_active) {
            // update game only when tab is active
            // in non-active tab the delta time is nearly 2 seconds
            // it's too big value for correct behaviour
            if(this.m_is_left_mouse_press && this.m_mouse_event && this.m_scene_canvas) {
                const c = cursor_coordinates(this.m_scene_canvas, this.m_mouse_event);
                const c_world = this.point_to_world(c[0], c[1]);
                const is_send = this.m_scene.input_click(c[0], c[1], c_world[0], c_world[1], false);
                if (is_send) {
                    this.m_module.game_client_point(this.m_game_ptr, c_world[0], c_world[1]);
                }
            }

            // read the current time
            const time = performance.now();
            // calculate delta time
            const dt = (time - this.m_current_time) / 1000.0;
            // write the current time
            this.m_current_time = time;
    
            // update the game
            if(this.m_module) {
                // this method calls many callbacks in the current host
                // it transfer data about changed entities
                this.m_module.game_update(this.m_game_ptr, dt);
            }

            this.m_scene.update(dt);

            this.m_ui.update(dt);
            this.m_ui.update_count_values(this.m_total_level_entities, this.m_scene.get_monsters().size);
        }

        // draw the map, if we need
        this.draw_map();
    }

    draw_map() {
        if(this.m_map) {
            this.m_map.draw();
        }
    }

    // ----------------------------------------------------------------------
    // ----------------callbacks from the wasm side--------------------------

    define_level(level_width: number, level_height: number, tile_size: number) {
        this.m_level_width = level_width;
        this.m_level_height = level_height;
        this.m_level_tile_size = tile_size;

        // create the scene
        this.m_scene = new Scene(this.m_level_width,
            this.m_level_height,
            this.m_level_tile_size);
        
        this.m_wtc_scale = TILE_PIXELS_SIZE / this.m_level_tile_size;
        this.m_wtc_tfm.set_uniform_scale(this.m_wtc_scale);
    }

    define_navmesh(vertices: Float32Array, polygons: Int32Array, sizes: Int32Array) {
        // create the scene minimap
        // this world-to-canvas transform is universal
        // it can be used for different canvases and different purposes
        // when the game change the player position, we should update this transform
        this.m_map = new SceneMap(this.m_map_ctx,
            this.m_wtc_tfm,
            this.m_level_tile_size, 
            vertices, 
            polygons, 
            sizes);
    }

    define_total_tiles(total_tiles: number) {
        // for info only
        // nothing to do here
    }

    tile_delete(index: number) {
        this.m_scene.delete_tile(index);
        this.scene_tile_delete(index);
    }

    tile_create(x: number, y: number, index: number, type: number) {
        const pos_x = x * this.m_level_tile_size;
        const pos_y = y * this.m_level_tile_size;

        this.m_scene.create_tile(pos_x, pos_y, index, type);
        this.scene_tile_create(pos_x, pos_y, index, type);
    }

    create_player(id: number, radius: number) {
        this.m_scene.set_player_id(id);
        this.m_scene.set_player_radius(radius);
        this.scene_create_player(radius);
    }

    update_entity_params(id: number, life: number, max_life: number, select_radius: number, attack_distance: number, attack_time: number) {
        this.m_scene.set_entity_attack_distance(id, attack_distance);
        this.m_scene.set_entity_life(id, life, max_life);
        this.m_scene.set_entity_attack_time(id, attack_time);
        this.m_scene.set_entity_select_radius(id, select_radius);
        this.scene_update_entity_params(id, life, max_life, select_radius, attack_distance, attack_time);
    }

    create_monster(entity: number, radius: number) {
        this.m_scene.set_monster_radius(entity, radius);
        this.scene_create_monster(entity, radius);
    }

    define_entity_changes(entity: number, 
                          pos_x: number, pos_y: number,
                          angle: number, 
                          move_status: number,
                          life: number, max_life: number,
                          shield: number, max_shield: number,
                          is_dead: boolean) {
        this.m_scene.set_entity_position(entity, pos_x, pos_y);
        this.m_scene.set_entity_angle(entity, angle);
        this.m_scene.set_entity_move(entity, move_status);
        this.m_scene.set_entity_life(entity, life, max_life);
        this.m_scene.set_entity_shield(entity, shield, max_shield);
        this.m_scene.set_entity_dead(entity, is_dead);

        this.scene_update_entity_position(entity, pos_x, pos_y);
        this.scene_update_entity_angle(entity, angle);
        this.scene_update_entity_move_status(entity, move_status);
        this.scene_update_entity_life(entity, life, max_life);
        this.scene_update_entity_shield(entity, shield, max_shield);
    }

    remove_monster(entity: number) {
        this.m_scene.remove_monster(entity);
        this.scene_remove_monster(entity);
    }

    define_total_update_entities(count: number) {
        this.m_total_level_entities = count;
    }

    entity_start_shift(entity: number) {
        this.m_scene.entity_start_shift(entity);
        this.scene_entity_start_shift(entity);
    }

    entity_finish_shift(entity: number) {
        this.scene_entity_finish_shift(entity);
    }

    entity_activate_shield(entity: number) {
        this.m_scene.set_entity_activate_shield(entity, true);
        this.scene_entity_activate_shield(entity);
    }

    entity_release_shield(entity: number) {
        this.m_scene.set_entity_activate_shield(entity, false);
        this.scene_entity_release_shield(entity);
    }

    entity_start_melee_attack(entity: number, time: number, damage_distance: number, damage_spread: number) {
        this.m_scene.entity_start_melee_attack(entity, time, damage_distance, damage_spread);
        this.scene_entity_start_melee_attack(entity, time, damage_distance, damage_spread);
    }

    entity_finish_melee_attack(entity: number, interrupt: boolean) {
        this.m_scene.entity_finish_melee_attack(entity);
        this.scene_entity_finish_melee_attack(entity);
    }

    entity_start_cooldawn(entity: number, cooldawn_id: number, cooldawn_time: number) {
        this.m_scene.get_cooldawns().start_cooldawn(entity, cooldawn_id, cooldawn_time);
        this.scene_entity_start_cooldawn(entity, cooldawn_id, cooldawn_time);
    }

    click_entity(entity: number, action_id: TARGET_ACTION) {
        this.m_scene.input_click_entity(entity, action_id);
        this.scene_click_entity(entity, action_id);
    }

    click_position(pos_x: number, pos_y: number) {
        this.m_scene.input_click_position(pos_x, pos_y);
        this.scene_click_position(pos_x, pos_y);
    }

    entity_dead(entity: number) {
        this.m_scene.set_entity_dead(entity, true);
        this.scene_entity_dead(entity);
    }

    entity_damaged(attacker_entity: number, target_entity: number, damage: number, damage_type: number) {
        this.scene_entity_damaged(attacker_entity, target_entity, damage, damage_type);
    }

    entity_start_stun(entity: number, duration: number) {
        this.m_scene.entity_start_stun(entity, duration);
        this.scene_entity_start_stun(entity, duration);
    }

    entity_finish_stun(entity: number) {
        this.m_scene.entity_finish_stun(entity);
        this.scene_entity_finish_stun(entity);
    }

    debug_entity_walk_path(entity: number, points: ArrayLike<number>) {
        const coordinates = new Float32Array(points.length);
        for(let i = 0; i < coordinates.length; i++) {
            coordinates[i] = points[i];
        }
        this.debug_entity_trajectory(entity, coordinates);
    }

    debug_close_entity(e1: number, pos_x1: number, pos_y1: number, e2: number, pos_x2: number, pos_y2: number) {
        this.debug_close_entity_pair(e1, pos_x1, pos_y1, e2, pos_x2, pos_y2);
    }

    debug_visible_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        this.debug_player_visible_quad(start_x, start_y, end_x, end_y);
    }

    debug_neighbourhood_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        this.debug_player_neighbourhood_quad(start_x, start_y, end_x, end_y);
    }
}