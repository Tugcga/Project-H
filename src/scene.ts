import { DATA } from "../wasm/assembly/game/data_constants";  // use the same data keys as in wasm
import { define_player_target_position } from "../wasm/build/game_api";
import { DrawClickCursor, DrawMap, DrawMonster, DrawPlayer, DrawTile } from "./drawable_items";
import { Transform } from "./transform";
import { TILE_NONWALKABLE_COLOR } from "./visual_styles";
import { CAMERA_LERP_COEFFICIENT, FIRST_MOUSE_CLICK_DELTA, OTHER_MOUSE_CLICK_DELTA, TILE_PIXELS_SIZE } from "./constants";

export class Scene {
    m_context: CanvasRenderingContext2D;
    m_canvas_width: number;
    m_canvas_height: number;

    m_level_width: number = 0;
    m_level_height: number = 0;
    m_level_tile_size: number = 0.0;

    m_last_click_time: number = 0;
    m_click_number: number = 0;

    m_level_tiles: Map<number, DrawTile> = new Map<number, DrawTile>();

    m_wtc_scale: number = 0.0;
    m_wtc_tfm = new Transform();  // use one transform object for convert world coordinates to canvas coordinates

    m_player: DrawPlayer;
    m_click_cursor: DrawClickCursor;
    m_map: DrawMap;

    m_monsters: Map<number, DrawMonster> = new Map<number, DrawMonster>();
    m_monstars_total: number = 0;

    m_camera_pos_x: number = 0.0;
    m_camera_pos_y: number = 0.0;

    m_fps_accumulator: number = 0.0;
    m_fps_ticks: number = 0;
    m_fps_value: number = 0.0;

    constructor(in_ctx: CanvasRenderingContext2D, canvas_width: number, canvas_height: number, game_settings: ArrayLike<number>) {
        this.m_context = in_ctx;
        this.m_canvas_width = canvas_width;
        this.m_canvas_height = canvas_height;

        let in_navmesh_vertices: Float32Array = new Float32Array();
        let in_navmesh_polygons: Int32Array = new Int32Array();
        let in_navmesh_sizes: Int32Array = new Int32Array();

        // we should parse input game settings
        var is_finish: boolean = false;
        var v_index = 0;
        const array_length = game_settings.length;
        while(!is_finish) {
            const data_type: number = game_settings[v_index];
            const data_length = game_settings[v_index + 1];

            v_index += 2;  // point to the first value in the data container
            if(data_length > 0) {
                // parse data type
                if(data_type == DATA.LEVEL_WIDHT) {
                    this.m_level_width = game_settings[v_index];
                } else if(data_type == DATA.LEVEL_HEIGHT) {
                    this.m_level_height = game_settings[v_index];
                } else if(data_type == DATA.TILE_SIZE) {
                    this.m_level_tile_size = game_settings[v_index];
                } else if(data_type == DATA.NAVMESH_VERTICES) {
                    in_navmesh_vertices = new Float32Array(data_length);
                    for(let i = 0; i < data_length; i++) {
                        in_navmesh_vertices[i] = game_settings[v_index + i];
                    }
                } else if(data_type == DATA.NAVMESH_POLYGONS) {
                    in_navmesh_polygons = new Int32Array(data_length);
                    for(let i = 0; i < data_length; i++) {
                        in_navmesh_polygons[i] = game_settings[v_index + i];
                    }
                } else if(data_type == DATA.NAVMESH_SIZES) {
                    in_navmesh_sizes = new Int32Array(data_length);
                    for(let i = 0; i < data_length; i++) {
                        in_navmesh_sizes[i] = game_settings[v_index + i];
                    }
                } else if(data_type == DATA.LEVEL_TOTAL_TILES) {
                    console.log("Level tiles:", game_settings[v_index]);
                }
            }
            
            v_index += data_length;
            if(v_index >= array_length) {
                is_finish = true;
            }
        }

        // now we are ready to setup world-to-canvas transform
        // by default it is identity
        // we should setup scale and translation
        // now translation is zero, because it depends on camera position
        this.m_wtc_tfm.set_translation(0.0, 0.0);
        this.m_wtc_scale = TILE_PIXELS_SIZE / this.m_level_tile_size;
        this.m_wtc_tfm.set_uniform_scale(this.m_wtc_scale);

        // create player drawable item
        this.m_player = new DrawPlayer(this.m_context, this.m_wtc_tfm);
        this.m_click_cursor = new DrawClickCursor(this.m_context, this.m_wtc_tfm);

        this.m_map = new DrawMap(this.m_context, this.m_wtc_tfm, this.m_level_tile_size, in_navmesh_vertices, in_navmesh_polygons, in_navmesh_sizes);
    }

    reset_click() {
        this.m_click_number = 0;
    }

    // input are canvas coordinates of the mouse click
    click_position(in_x: number, in_y: number, force: boolean = false) {
        const current_time = performance.now();
        if(force || current_time - this.m_last_click_time > (this.m_click_number == 1 ? FIRST_MOUSE_CLICK_DELTA : OTHER_MOUSE_CLICK_DELTA)) {
            this.m_last_click_time = current_time;
            this.m_click_number += 1;
            if(this.m_click_number > 2) {
                this.m_click_number = 2;
            }

            // convert click position to world position
            // for this we should use inverse transform matrix
            let ctw_tfm = this.m_wtc_tfm.inverse();
            const pos = ctw_tfm.multiply(in_x, in_y);

            // call to move the player
            const is_define: boolean = define_player_target_position(pos[0], pos[1]);

            if(force && is_define) {
                this.m_click_cursor.activate(pos[0], pos[1]);
            }
        }
    }

    update_ui() {
        let level_count = document.getElementById("level_count");
        if(level_count) {
            level_count.innerText = this.m_monstars_total.toString();
        }

        let visible_count = document.getElementById("visible_count");
        if(visible_count) {
            visible_count.innerText = this.m_monsters.size.toString();
        }

        let fps = document.getElementById("fps");
        if(fps) {
            fps.innerText = (Math.round(this.m_fps_value * 100) / 100).toFixed(2).toString();
        }
    }

    press_key(key: string) {
        if(key == "m") {
            this.m_map.toggle_active();
        } else if(key == "+") {
            this.m_map.scale_up();
        } else if(key == "-") {
            this.m_map.scale_down();
        }
    }

    private draw_background() {
        this.m_context.clearRect(0, 0, this.m_canvas_width, this.m_canvas_height);

        this.m_context.save();
        this.m_context.fillStyle = TILE_NONWALKABLE_COLOR;
        this.m_context.fillRect(0, 0, this.m_canvas_width, this.m_canvas_height);
        this.m_context.restore();
    }

    draw() {
        this.draw_background();

        // draw level tiles
        for(let [tile_index, tile] of this.m_level_tiles) {
            tile.draw();
        }

        // cursor
        this.m_click_cursor.draw();

        // draw player
        this.m_player.draw();

        // monsters
        for(let [monster_entity, monster] of this.m_monsters) {
            monster.draw();
        }

        // map
        this.m_map.draw();
    }

    update(game_state: ArrayLike<number>, dt: number) {
        // parse game state array
        var is_finish = false;
        var data_iterator = 0;
        while(!is_finish) {
            const data_type = game_state[data_iterator];
            const data_count = game_state[data_iterator + 1];

            data_iterator += 2;
            if(data_count > 0) {
                if(data_type == DATA.PLAYER_POSITION) {
                    const pos_x = game_state[data_iterator];
                    const pos_y = game_state[data_iterator + 1];
                    this.m_player.set_position(pos_x, pos_y);

                    // recalculate camera position
                    this.m_camera_pos_x = CAMERA_LERP_COEFFICIENT * pos_x + (1 - CAMERA_LERP_COEFFICIENT) * this.m_camera_pos_x;
                    this.m_camera_pos_y = CAMERA_LERP_COEFFICIENT * pos_y + (1 - CAMERA_LERP_COEFFICIENT) * this.m_camera_pos_y;

                    // also define camera position
                    this.m_wtc_tfm.set_translation(this.m_canvas_width / 2 - this.m_camera_pos_x * this.m_wtc_scale, this.m_canvas_height / 2 - this.m_camera_pos_y * this.m_wtc_scale);
                } else if(data_type == DATA.PLAYER_RADIUS) {
                    const r = game_state[data_iterator];
                    this.m_player.set_radius(r);
                } else if(data_type == DATA.PLAYER_ANGLE) {
                    const a = game_state[data_iterator];
                    this.m_player.set_rotation(a);
                } else if(data_type == DATA.PLAYER_MOVE) {
                    const m = game_state[data_iterator];
                    this.m_player.set_move(m > 0.5);
                } else if(data_type == DATA.TILES_TO_DELETE) {
                    // for delete we send only indices
                    for(let t = 0; t < data_count; t++) {
                        const del_index = game_state[data_iterator + t];
                        if(this.m_level_tiles.has(del_index)) {
                            this.m_level_tiles.delete(del_index);
                        }
                    }
                }
                else if(data_type == DATA.TILES_TO_CREATE) {
                    // get the number of new tiles
                    const new_tiles_count = data_count / 4;  // because for each tile we send 4 values (x, y, i, type)
                    for(let t = 0; t < new_tiles_count; t++) {
                        const new_x = game_state[data_iterator + 4 * t];  // these values are tile indices (integers), not actual positions
                        const new_y = game_state[data_iterator + 4 * t + 1];
                        const new_index = game_state[data_iterator + 4 * t + 2];
                        const new_type = game_state[data_iterator + 4 * t + 3];

                        this.m_level_tiles.set(new_index, new DrawTile(this.m_context, this.m_wtc_tfm, new_x * this.m_level_tile_size, new_y * this.m_level_tile_size, this.m_level_tile_size, new_type));
                    }
                } else if(data_type == DATA.MONSTERS_COUNT) {
                    this.m_monstars_total = game_state[data_iterator];
                } else if(data_type == DATA.MONSTER_POSITION) {
                    const m_id = game_state[data_iterator];
                    const m_x = game_state[data_iterator + 1];
                    const m_y = game_state[data_iterator + 2];

                    if(this.m_monsters.has(m_id)) {
                        const m = this.m_monsters.get(m_id);
                        if(m) {
                            m.set_position(m_x, m_y);
                        }                        
                    } else {
                        let m = new DrawMonster(this.m_context, this.m_wtc_tfm);
                        m.set_position(m_x, m_y);
                        this.m_monsters.set(m_id, m);

                    }
                } else if(data_type == DATA.MONSTER_RADIUS) {
                    const m_id = game_state[data_iterator];
                    const m_radius = game_state[data_iterator + 1];
                    if(this.m_monsters.has(m_id)) {
                        const m = this.m_monsters.get(m_id);
                        if(m) {
                            m.set_radius(m_radius);
                        }                        
                    } else {
                        this.m_monsters.set(m_id, new DrawMonster(this.m_context, this.m_wtc_tfm));
                    }
                } else if(data_type == DATA.MONSTER_ANGLE) {
                    const m_id = game_state[data_iterator];
                    const m_angle = game_state[data_iterator + 1];
                    if(this.m_monsters.has(m_id)) {
                        const m = this.m_monsters.get(m_id);
                        if(m) {
                            m.set_rotation(m_angle);
                        }                        
                    } else {
                        this.m_monsters.set(m_id, new DrawMonster(this.m_context, this.m_wtc_tfm));
                    }
                } else if(data_type == DATA.MONSTER_MOVE) {
                    const m_id = game_state[data_iterator];
                    const m_move = game_state[data_iterator + 1] > 0.5;
                    if(this.m_monsters.has(m_id)) {
                        const m = this.m_monsters.get(m_id);
                        if(m) {
                            m.set_move(m_move);
                        }                        
                    } else {
                        this.m_monsters.set(m_id, new DrawMonster(this.m_context, this.m_wtc_tfm));
                    }
                } else if(data_type == DATA.MONSTERS_TO_DELETE) {
                    for(let t = 0; t < data_count; t++) {
                        const del_entity = game_state[data_iterator + t];
                        if(this.m_monsters.has(del_entity)) {
                            this.m_monsters.delete(del_entity);
                        }
                    }
                }
            }

            data_iterator += data_count;
            if(data_iterator >= game_state.length) {
                is_finish = true;
            }
        }

        // calculate fps
        this.m_fps_accumulator += dt;
        this.m_fps_ticks += 1;

        this.draw();
        this.update_ui();

        if(this.m_fps_accumulator > 2.0) {
            this.m_fps_value = this.m_fps_ticks / this.m_fps_accumulator;

            // reset fps value
            this.m_fps_accumulator = 0.0;
            this.m_fps_ticks = 0;
        }
    }
}
