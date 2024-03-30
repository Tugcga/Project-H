import { ClientBase } from "../client_base";
import { CAMERA_LERP_COEFFICIENT, COOLDAWN, DAMAGE_TYPE, MOVE_STATUS, TARGET_ACTION, TILE_PIXELS_SIZE } from "../constants";
import { draw_background, draw_cursor, draw_level_tile, draw_lines, draw_monster, draw_neighbourhood_rect, draw_pairs, draw_player, draw_trajectory, draw_visibility_rect } from "./draws";

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
    m_is_draw_neighbourhood_rect: boolean = false;
    m_debug_neighbourhood_rect: Float32Array = new Float32Array(4);
    m_debug_enemies_lines: Array<number>;  // for each enemy store 4 values: (x, y) of attacker and (x, y) of the target
    m_use_debug_draw: boolean = false;

    constructor() {
        super();

        this.m_canvas_width = this.m_scene_canvas.width;
        this.m_canvas_height = this.m_scene_canvas.height;

        this.m_debug_trajectories.clear();
        this.m_debug_pairs = new Array<number>();
        this.m_debug_enemies_lines = new Array<number>();
    }

    start(): void {
        this.update_process();
    }

    on_canvas_resize(in_width: number, in_height: number): void {
        this.m_canvas_width = in_width;
        this.m_canvas_height = in_height;

        this.m_wtc_tfm.set_translation(this.m_canvas_width / 2 - this.m_camera_position_x * this.m_wtc_scale, this.m_canvas_height / 2 - this.m_camera_position_y * this.m_wtc_scale);
    }

    point_to_world(in_x: number, in_y: number) : number[] {
        // in this implementation we use m_wtc_tfm as transform from canvas to world
        // this transform is also used for the map
        const ctw_tfm = this.m_wtc_tfm.inverse();
        const pos = ctw_tfm.multiply(in_x, in_y);
        return pos;
    }

    // in this implementation we does not need this
    scene_tile_delete(index: number): void { }
    scene_tile_create(pos_x: number, pos_y: number, index: number, type: number): void { }
    scene_create_player(radius: number): void { 
        this.m_scene.get_player().set_debug_draw(this.m_use_debug_draw);
    }
    scene_update_entity_params(id: number, is_dead: boolean, life: number, max_life: number, select_radius: number, attack_distance: number, attack_time: number): void { }
    // mouse_click(inc_x: number, inc_y: number, inw_x: number, inw_y: number): void { }
    // when define player position, we should update camera to output shapes to the canvas
    scene_update_entity_position(id: number, pos_x: number, pos_y: number): void {
        if (this.m_scene.is_player(id)) {
            // update wtc transform
            this.m_camera_position_x = CAMERA_LERP_COEFFICIENT * pos_x + (1 - CAMERA_LERP_COEFFICIENT) * this.m_camera_position_x;
            this.m_camera_position_y = CAMERA_LERP_COEFFICIENT * pos_y + (1 - CAMERA_LERP_COEFFICIENT) * this.m_camera_position_y;

            this.m_wtc_tfm.set_translation(this.m_canvas_width / 2 - this.m_camera_position_x * this.m_wtc_scale, this.m_canvas_height / 2 - this.m_camera_position_y * this.m_wtc_scale);
        }
    }
    scene_update_entity_angle(id: number, angle: number): void {}
    scene_update_entity_move_status(id: number, move_status: MOVE_STATUS): void {}
    scene_update_entity_life(id: number, life: number, max_life: number): void {}
    scene_update_entity_shield(id: number, shield: number, max_shield: number): void {}
    scene_create_monster(entity: number, pos_x: number, pos_y: number, radius: number, search_radius: number, search_spread: number, team: number): void {
        const p = this.m_scene.get_person(entity);
        if (p) {
            p.set_debug_draw(this.m_use_debug_draw);
        }
    }
    scene_remove_monster(entity: number): void {}
    scene_entity_start_shift(entity: number): void {}
    scene_entity_finish_shift(entity: number): void {}
    scene_entity_activate_shield(entity: number): void {}
    scene_entity_release_shield(entity: number): void {}
    scene_entity_start_melee_attack(entity: number, time: number, damage_distance: number, damage_spread: number): void {}
    scene_entity_finish_melee_attack(entity: number): void {}
    scene_entity_start_range_attack(entity: number, time: number): void {}
    scene_entity_finish_range_attack(entity: number): void {}
    scene_entity_start_hand_attack(entity: number, time: number, damage_distance: number): void {}
    scene_entity_finish_hand_attack(entity: number): void {}
    scene_entity_start_shadow_attack(entity: number, time: number, damage_distance: number): void {}
    scene_entity_finish_shadow_attack(entity: number): void {}
    scene_entity_start_cooldawn(entity: number, cooldawn_id: COOLDAWN, time: number): void {}
    scene_click_entity(entity: number, action_id: TARGET_ACTION): void {}
    scene_click_position(pos_x: number, pos_y: number): void {}
    scene_entity_damaged(attacker_entity: number, target_entity: number, damage: number, damage_type: DAMAGE_TYPE): void {}
    scene_entity_dead(entity: number): void {}
    scene_entity_start_stun(entity: number, duration: number): void {}
    scene_entity_finish_stun(entity: number): void {}
    scene_entity_start_hide_activation(entity: number, activation_time: number): void {}
    scene_entity_finish_hide_activation(entity: number, interrupt: boolean): void {}
    scene_entity_switch_hide(id: number, is_hide: boolean): void {}
    scene_player_activate_hide(): void {}
    scene_player_deactivate_hide(): void {}
    scene_entity_resurrect(entity: number, life: number, max_life: number): void {}

    debug_entity_trajectory(entity: number, coordinates: Float32Array): void {
        if (this.m_use_debug_draw) {
            // store coordinates in temporary map
            // draw these trajectories at draw method
            this.m_debug_trajectories.set(entity, coordinates);
        }
    }

    debug_close_entity_pair(entity_a: number, a_pos_x: number, a_pos_y: number, entity_b: number, b_pos_x: number, b_pos_y: number): void {
        if (this.m_use_debug_draw) {
            this.m_debug_pairs.push(a_pos_x);
            this.m_debug_pairs.push(a_pos_y);

            this.m_debug_pairs.push(b_pos_x);
            this.m_debug_pairs.push(b_pos_y);
        }
    }

    debug_player_visible_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        if (this.m_use_debug_draw) {
            this.m_debug_visible_rect[0] = start_x;
            this.m_debug_visible_rect[1] = start_y;
            this.m_debug_visible_rect[2] = end_x;
            this.m_debug_visible_rect[3] = end_y;
            this.m_is_draw_visible_rect = true;
        }
    }

    debug_player_neighbourhood_quad(start_x: number, start_y: number, end_x: number, end_y: number): void {
        if (this.m_use_debug_draw) {
            this.m_debug_neighbourhood_rect[0] = start_x;
            this.m_debug_neighbourhood_rect[1] = start_y;
            this.m_debug_neighbourhood_rect[2] = end_x;
            this.m_debug_neighbourhood_rect[3] = end_y;
            this.m_is_draw_neighbourhood_rect = true;
        }
    }

    debug_enemies_search(id: number, search_radius: number, enemy_ids: Int32Array): void {
        if (this.m_use_debug_draw) {
            const attacker = this.m_scene.get_person(id);
            if (attacker) {
                const attacker_position = attacker.get_translation();
                for (let target_id of enemy_ids) {
                    const target = this.m_scene.get_person(target_id);
                    if (target) {
                        const target_position = target.get_translation();
                        if (attacker_position.length >= 2 && target_position.length >= 2) {
                            this.m_debug_enemies_lines.push(attacker_position[0]);
                            this.m_debug_enemies_lines.push(attacker_position[1]);
                            this.m_debug_enemies_lines.push(target_position[0]);
                            this.m_debug_enemies_lines.push(target_position[1]);
                        }
                    }
                }
            }
        }
    }

    debug_define_draw_flag(output_debug: boolean): void {
        this.m_use_debug_draw = output_debug;
    }

    debug_toggle_draw_flag(): void {
        this.m_use_debug_draw = !this.m_use_debug_draw;

        if (!this.m_use_debug_draw) {
            this.m_is_draw_visible_rect = false;
            this.m_is_draw_neighbourhood_rect = false;

            // disable debug draw for all persons
            const player = this.m_scene.get_player();
            player.set_debug_draw(false);

            for (const [id, monster] of this.m_scene.get_monsters()) {
                monster.set_debug_draw(false);
            }
        } else {
            // enable debug draw for all persons
            const player = this.m_scene.get_player();
            player.set_debug_draw(true);
            
            for (const [id, monster] of this.m_scene.get_monsters()) {
                monster.set_debug_draw(true);
            }
        }
    }

    update_process() {
        // clear debug before update
        // because at update it calls callbacks and fill this map
        this.m_debug_trajectories.clear();
        this.m_debug_pairs.length = 0;
        this.m_debug_enemies_lines = new Array<number>();

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
        const player_id = player.get_id();
        draw_player(this.m_scene_ctx, this.m_wtc_tfm, player, this.m_scene.get_person_cooldawns(player_id), this.m_scene.get_person_effects(player_id));

        // monsters
        const monsters = this.m_scene.get_monsters();
        for(let [entity, monster] of monsters) {
            const monster_id = monster.get_id();
            draw_monster(this.m_scene_ctx, this.m_wtc_tfm, monster, this.m_scene.get_person_cooldawns(monster_id), this.m_scene.get_person_effects(monster_id));
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
        // neighbourhood rect
        if (this.m_is_draw_neighbourhood_rect) {
            draw_neighbourhood_rect(this.m_scene_ctx, this.m_wtc_tfm, this.m_debug_neighbourhood_rect);
        }

        draw_lines(this.m_scene_ctx, this.m_wtc_tfm, this.m_debug_enemies_lines);
    }
}