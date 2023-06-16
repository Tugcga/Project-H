import { ClientBase } from "../client_base";
import { ACTION, CAMERA_LERP_COEFFICIENT, COOLDAWN, MOVE_STATUS, TILE_PIXELS_SIZE } from "../constants";
import { TILE_NONWALKABLE_COLOR } from "./visual_styles";
import { draw_background, draw_cursor, draw_level_tile, draw_monster, draw_neighborhood_rect, draw_pairs, draw_player, draw_trajectory, draw_visibility_rect } from "./draws";

// this version of the client application
// use 2d canvas as draw device
// it use simple procedural shapes for visualise all game items
export class ClientDataCanvas extends ClientBase {
    m_canvas_width: number;
    m_canvas_height: number;

    m_camera_position_x: number = 0.0;
    m_camera_position_y: number = 0.0;

    m_debug_trajectories: Map<number, Float32Array> = new Map<number, Float32Array>();
    m_debug_pairs: Array<number>;

    m_is_draw_visible_rect: boolean = false;
    m_debug_visible_rect: Float32Array = new Float32Array(4);
    m_is_draw_neighborhood_rect: boolean = false;
    m_debug_neighborhood_rect: Float32Array = new Float32Array(4);

    constructor() {
        super();

        this.m_canvas_width = this.m_scene_canvas.width;
        this.m_canvas_height = this.m_scene_canvas.height;

        this.m_debug_trajectories.clear();
        this.m_debug_pairs = new Array<number>();
    }

    start(): void {
        this.update_process();
    }

    point_to_world(in_x: number, in_y: number) : number[] {
        // in this implementaion we use m_wtc_tfm as transform from canvas to world
        // this transform is also used for the map
        const ctw_tfm = this.m_wtc_tfm.inverse();
        const pos = ctw_tfm.multiply(in_x, in_y);
        return pos;
    }

    // in this implementation we does not need this
    scene_tile_delete(index: number): void { }
    scene_tile_create(pos_x: number, pos_y: number, index: number, type: number): void { }
    scene_create_player(radius: number): void { }
    mouse_click(inc_x: number, inc_y: number, inw_x: number, inw_y: number): void { }
    // when define player position, we should update camera to output shapes to the canvas
    scene_define_player_changes(pos_x: number, pos_y: number, angle: number, move_status: MOVE_STATUS): void { 
        // update wtc transform
        this.m_camera_position_x = CAMERA_LERP_COEFFICIENT * pos_x + (1 - CAMERA_LERP_COEFFICIENT) * this.m_camera_position_x;
        this.m_camera_position_y = CAMERA_LERP_COEFFICIENT * pos_y + (1 - CAMERA_LERP_COEFFICIENT) * this.m_camera_position_y;

        this.m_wtc_tfm.set_translation(this.m_canvas_width / 2 - this.m_camera_position_x * this.m_wtc_scale, this.m_canvas_height / 2 - this.m_camera_position_y * this.m_wtc_scale);
    }
    scene_create_monster(entity: number, radius: number): void { }
    scene_define_entity_changes(entity: number, pos_x: number, pos_y: number, angle: number, move_status: MOVE_STATUS): void { }
    scene_remove_monster(entity: number): void {}
    scene_entity_start_action(entity: number, action_id: ACTION): void {}
    scene_entity_finish_action(entity: number, action_id: ACTION): void {}
    scene_entity_start_cooldawn(entity: number, cooldawn_id: COOLDAWN, time: number): void {}

    debug_entity_trajectory(entity: number, coordinates: Float32Array): void {
        // store coordinates in temporary map
        // draw these trajectories at draw method
        this.m_debug_trajectories.set(entity, coordinates);
    }

    debug_close_entity_pair(entity_a: number, a_pos_x: number, a_pos_y: number, entity_b: number, b_pos_x: number, b_pos_y: number): void {
        this.m_debug_pairs.push(a_pos_x);
        this.m_debug_pairs.push(a_pos_y);

        this.m_debug_pairs.push(b_pos_x);
        this.m_debug_pairs.push(b_pos_y);
    }

    debug_player_visible_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        this.m_debug_visible_rect[0] = start_x;
        this.m_debug_visible_rect[1] = start_y;
        this.m_debug_visible_rect[2] = end_x;
        this.m_debug_visible_rect[3] = end_y;
        this.m_is_draw_visible_rect = true;
    }

    debug_player_neighborhood_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        this.m_debug_neighborhood_rect[0] = start_x;
        this.m_debug_neighborhood_rect[1] = start_y;
        this.m_debug_neighborhood_rect[2] = end_x;
        this.m_debug_neighborhood_rect[3] = end_y;
        this.m_is_draw_neighborhood_rect = true;
    }

    update_process() {
        // clear debug before update
        // because at update it calls callbacks and fill this map
        this.m_debug_trajectories.clear();
        this.m_debug_pairs.length = 0;

        this.update();

        // in this client we should draw the scene
        this.draw_scene();

        window.requestAnimationFrame(this.update_process.bind(this));
    }

    draw_scene() {
        // clear the background
        this.m_scene_ctx.clearRect(0, 0, this.m_canvas_width, this.m_canvas_height);
        draw_background(this.m_scene_ctx, this.m_scene_canvas.width, this.m_scene_canvas.height)

        // draw scene items
        // tiles
        const level_tiles = this.m_scene.get_level_tiles();
        for(let [tile_index, tile] of level_tiles) {
            draw_level_tile(this.m_scene_ctx, this.m_wtc_tfm, tile)
        }

        // draw the cursor
        const click_cursor = this.m_scene.get_click_cursor();
        draw_cursor(this.m_scene_ctx, this.m_wtc_tfm, click_cursor);

        // player
        const player = this.m_scene.get_player();
        draw_player(this.m_scene_ctx, this.m_wtc_tfm, player, this.m_scene.get_person_cooldawns(player.get_id()));

        // monsters
        const monsters = this.m_scene.get_monsters();
        for(let [entity, monster] of monsters) {
            draw_monster(this.m_scene_ctx, this.m_wtc_tfm, monster, this.m_scene.get_person_cooldawns(monster.get_id()));
        }

        // draw debug trajectories
        for(let [entity, coordinates] of this.m_debug_trajectories) {
            draw_trajectory(this.m_scene_ctx, this.m_wtc_tfm, coordinates);
        }

        // closest pairs
        draw_pairs(this.m_scene_ctx, this.m_wtc_tfm, this.m_debug_pairs);

        // visible quad
        if (this.m_is_draw_visible_rect) {
            draw_visibility_rect(this.m_scene_ctx, this.m_wtc_tfm, this.m_debug_visible_rect);
        }
        // neighborhood rect
        if (this.m_is_draw_neighborhood_rect) {
            draw_neighborhood_rect(this.m_scene_ctx, this.m_wtc_tfm, this.m_debug_neighborhood_rect);
        }
    }
}