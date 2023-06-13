import { __Internref18, instantiate } from "../wasm/build/game_api";
import { SceneMap } from "./scene/scene_map";
import { Scene } from "./scene/scene";
import { Transform } from "./transform";
import { TILE_PIXELS_SIZE } from "./constants";
import { click_coordinates } from "./utilities";
import { GameUI } from "./ui/ui";

// base class for client of the game
// it implement functionallity for connecting between wasm module (the server) and client IO
// particluar graphic backend should use this base class
export abstract class ClientBase {
    m_game_ptr: __Internref18;
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
    m_is_mouse_press: boolean = false;
    m_mouse_event: MouseEvent;

    m_total_level_entities: number = 0;

    m_is_game_active: boolean = true;
    m_is_pause: boolean = false;  // turn on only when pause the game manualy

    // in start method current client implementation should start render loop
    // this loop should at first call update method, and only then process other stuff
    abstract start(): void;
    // input is coordinates on the screen, output is world coordinates of the point
    // conversation depends on the client implementation
    abstract point_to_world(in_x: number, in_y: number) : number[];
    // mouse_click can be used for inistantiate the shape for the cursor
    // input is coordinates on the canvas and corresponding coordinates on the world
    abstract mouse_click(inc_x: number, inc_y: number, inw_x: number, inw_y: number): void;
    // when we should delete the tile from the scene, call this method to delete the shape from the client
    abstract scene_tile_delete(index: number): void;
    // the same for create new tile
    // pos_x and pos_y world coordinates of the tile
    abstract scene_tile_create(pos_x: number, pos_y: number, index: number, type: number): void;
    // define player methods called after the module update player properties
    // it should be used in the client to update player shape
    abstract scene_define_player_changes(pos_x: number, pos_y: number, angle: number, is_move: boolean): void;
    abstract scene_create_player(radius: number): void;
    abstract scene_define_monster_changes(entity: number, pos_x: number, pos_y: number, angle: number, is_move: boolean): void;
    abstract scene_create_monster(entity: number, radius: number): void;
    abstract scene_remove_monster(entity: number): void;
    // debug callbacks
    // if debug is off, then these callbacks are not required
    // it never called from the module
    abstract debug_entity_trajectory(entity: number, coordinates: Float32Array): void;
    abstract debug_close_entity_pair(entity_a: number, a_pos_x: number, a_pos_y: number, entity_b: number, b_pos_x: number, b_pos_y: number): void;
    abstract debug_player_visible_quad(start_x: number, start_y: number, end_x: number, end_y: number): void;
    abstract debug_player_neighborhood_quad(start_x: number, start_y: number, end_x: number, end_y: number): void;

    constructor() {
        // define host functions for external calls from the wasm module
        globalThis.host = {
            define_level: this.define_level.bind(this),
            define_navmesh: this.define_navmesh.bind(this),
            define_total_tiles: this.define_total_tiles.bind(this),
            tile_delete: this.tile_delete.bind(this),
            tile_create: this.tile_create.bind(this),
            create_player: this.create_player.bind(this),
            define_player_changes: this.define_player_changes.bind(this),
            create_monster: this.create_monster.bind(this),
            define_monster_changes: this.define_monster_changes.bind(this),
            remove_monster: this.remove_monster.bind(this),
            define_total_update_entities: this.define_total_update_entities.bind(this),
            debug_entity_walk_path: this.debug_entity_walk_path.bind(this),
            debug_close_entity: this.debug_close_entity.bind(this),
            debug_visible_quad: this.debug_visible_quad.bind(this),
            debug_neighborhood_quad: this.debug_neighborhood_quad.bind(this)
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
        }

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
        document.addEventListener("visibilitychange" , function() {
            local_this.visibilitychange_event();
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
                // controllabel seed ↓ for test
                module.settings_set_seed(settings_ptr, 12);
                module.settings_set_rvo_time_horizon(settings_ptr, 1.0);
                module.settings_set_neighborhood_quad_size(settings_ptr, 1.0);
                module.settings_set_generate(settings_ptr,
                    22,  // level size
                    2, 4,  // min and max room size
                    10  // the number of rooms
                );
                // use these settings ↓ for developement
                // module.settings_set_generate(settings_ptr, 12, 3, 4, 2);

                // activate debug info
                module.settings_set_use_debug(settings_ptr, false);
                module.settings_set_debug_flags(settings_ptr, true, true, true, true);
                module.settings_set_snap_to_navmesh(settings_ptr, true);
                module.settings_set_use_rvo(settings_ptr, true);
                module.settings_set_path_recalculate_time(settings_ptr, 1.0);
                
                // create the game
                // this method calls some callbcks:
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

    mouse_press_event(event: MouseEvent) {
        this.m_mouse_event = event;
        if(this.m_is_start && this.m_is_game_active) {
            this.m_is_mouse_press = true;
    
            const c = click_coordinates(this.m_scene_canvas, event);
            const c_world = this.point_to_world(c[0], c[1]);
            const is_defined = this.m_scene.click_position(this.m_module, this.m_game_ptr, c_world[0], c_world[1], true);
            // also call click method from the client implementation
            if(is_defined) {
                // nothing to do if we click outside the walkable are
                this.mouse_click(c[0], c[1], c_world[0], c_world[1]);
            }
        }
    }

    mouse_release_event(event: MouseEvent) {
        if(this.m_is_start) {
            this.m_is_mouse_press = false;
            this.m_scene.reset_click();
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
                } else if(key == "m") {
                    this.m_map.toggle_active();
                } else if(key == "+") {
                    this.m_map.scale_up();
                } else if(key == "-") {
                    this.m_map.scale_down();
                }
            }
        }
    }
    
    update() {
        if (this.m_is_game_active) {
            // update game only when tab is active
            // in non-active tab the delta time is nearly 2 seconds
            // it's too big value for correct behaviour
            if(this.m_is_mouse_press && this.m_mouse_event && this.m_scene_canvas) {
                const c = click_coordinates(this.m_scene_canvas, this.m_mouse_event);
                const c_world = this.point_to_world(c[0], c[1]);
                this.m_scene.click_position(this.m_module, this.m_game_ptr, c_world[0], c_world[1]);
            }

            // read the curent time
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

            this.m_scene.get_click_cursor().update(dt);

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

    create_player(radius: number) {
        this.m_scene.set_player_radius(radius);
        this.scene_create_player(radius);
    }

    define_player_changes(pos_x: number, pos_y: number, angle: number, is_move: boolean) {
        this.m_scene.set_player_position(pos_x, pos_y);
        this.m_scene.set_player_angle(angle);
        this.m_scene.set_player_move(is_move);
        this.scene_define_player_changes(pos_x, pos_y, angle, is_move);
    }

    create_monster(entity: number, radius: number) {
        this.m_scene.set_monster_radius(entity, radius);
        this.scene_create_monster(entity, radius);
    }

    define_monster_changes(entity: number, pos_x: number, pos_y: number, angle: number, is_move: boolean) {
        this.m_scene.set_monster_position(entity, pos_x, pos_y);
        this.m_scene.set_monster_angle(entity, angle);
        this.m_scene.set_monster_move(entity, is_move);
        this.scene_define_monster_changes(entity, pos_x, pos_y, angle, is_move);
    }

    remove_monster(entity: number) {
        this.m_scene.remove_monster(entity);
        this.scene_remove_monster(entity);
    }

    define_total_update_entities(count: number) {
        this.m_total_level_entities = count;
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

    debug_neighborhood_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        this.debug_player_neighborhood_quad(start_x, start_y, end_x, end_y);
    }
}