import { CURSOR_TYPE, ClickCursor } from "../scene/click_cursor";
import { EFFECT, CLICK_CURSOR_RADIUS, CLICK_CURSOR_TIME, COOLDAWN, MOVE_STATUS } from "../constants";
import { SceneTile } from "../scene/scene_tile";
import { Transform } from "../transform";
import { CLICK_CURSOR_CENTER_SIZE, CLICK_CURSOR_COLOR, CLICK_CURSOR_STROKE_COLOR, CLICK_CURSOR_STROKE_WIDTH, COOLDAWN_SHIFT_COLOR, COOLDAWN_SHIFT_RADIUS, COOLDAWN_SHIFT_WIDTH, DEBUG_CLOSEST_PAIR_COLOR, DEBUG_CLOSEST_PAIR_WIDTH, DEBUG_NEIGHBOURHOOD_RECT_COLOR, DEBUG_RECT_LINE_WIDTH, DEBUG_TRAJECTORY_COLOR, DEBUG_TRAJECTORY_POINT_COLOR, DEBUG_TRAJECTORY_POINT_RADIUS, DEBUG_TRAJECTORY_WIDTH, DEBUG_VISIBILITY_RECT_COLOR, MONSTER_IDLE_COLOR, MONSTER_IS_STROKE, MONSTER_MOVE_COLOR, MONSTER_SECONDARY_STROKE_COLOR, MONSTER_SHIFT_COLOR, MONSTER_STROKE_COLOR, MONSTER_STROKE_WIDTH, PLAYER_IDLE_COLOR, PLAYER_IS_STROKE, PLAYER_MOVE_COLOR, PLAYER_SHIFT_COLOR, PLAYER_STROKE_COLOR, PLAYER_STROKE_WIDTH, TILE_IS_STROKE, TILE_NONWALKABLE_COLOR, TILE_STROKE_COLOR, TILE_STROKE_WIDTH, TILE_WALKABLE_COLOR, PLAYER_SECONDARY_STROKE_COLOR, COOLDAWN_MELEE_ATTACK_WIDTH, COOLDAWN_MELEE_ATTACK_COLOR, COOLDAWN_MELEE_ATTACK_RADIUS, EFFECT_MELEE_ATTACK_COLOR, SELECT_RADIUS_COLOR, SELECT_CURSOR_STROKE_WIDTH, SELECT_CURSOR_COLOR, SELECT_CURSOR_STROKE_COLOR, SHIELD_ACTIVE_COLOR, SHIELD_PASSIVE_COLOR, SHIELD_ACTIVE_WIDTH, SHIELD_PASSIVE_WIDTH, ENTITY_DEAD_BACK_COLOR, PLAYER_LIVE_BACK_COLOR, MONSTER_LIVE_BACK_COLOR, ENTITY_LIFE_CIRCLE_DELTA, EFFECT_STUN_COLOR, EFFECT_STUN_STROKE_COLOR, EFFECT_STUN_RADIUS_MULTIPLIER, DEBUG_SEARCH_RADIUS_COLOR, DEBUG_ENEMIES_TARGET_LINE_WIDTH, DEBUG_ENEMIES_TARGET_LINE_COLOR, PLAYER_HIDE_COLOR, MONSTER_HIDE_COLOR, SEARCH_CONE_COLOR, SEARCH_CONE_STROKE, SEARCH_CONE_STROKE_WIDTH } from "./visual_styles";
import { Person } from "../scene/person";
import { Player } from "../scene/player";
import { Monster } from "../scene/monster";
import { EffectBase, MeleeAttackEffect } from "../scene/effect";

export function draw_background(draw_ctx: CanvasRenderingContext2D, width: number, height: number) {
    draw_ctx.save();
    draw_ctx.fillStyle = TILE_NONWALKABLE_COLOR;
    draw_ctx.fillRect(0, 0, width, height);
    draw_ctx.restore();
}

export function draw_cursor(draw_ctx: CanvasRenderingContext2D, 
                            wtc_tfm: Transform, 
                            cursor: ClickCursor) {
    if(cursor.get_active()) {
        const cursor_type = cursor.get_type();
        if (cursor_type == CURSOR_TYPE.POSITION) {
            const prop: number = Math.pow(Math.min(cursor.get_proportion(), 1.0), 0.15);

            // actual draw
            draw_ctx.save();
            draw_ctx.lineWidth = CLICK_CURSOR_STROKE_WIDTH;
            draw_ctx.fillStyle = CLICK_CURSOR_COLOR;
            draw_ctx.strokeStyle = CLICK_CURSOR_STROKE_COLOR;
            draw_ctx.beginPath();
            const c_center = wtc_tfm.multiply_array(cursor.get_translation());
            const c_radius = wtc_tfm.apply_scale(CLICK_CURSOR_RADIUS) * prop;
            draw_ctx.arc(c_center[0], c_center[1], c_radius, 0, 2 * Math.PI);
            draw_ctx.fill();
            draw_ctx.stroke();

            // draw center dot
            draw_ctx.beginPath();
            draw_ctx.fillStyle = CLICK_CURSOR_STROKE_COLOR;
            draw_ctx.arc(c_center[0], c_center[1], CLICK_CURSOR_CENTER_SIZE, 0, 2 * Math.PI);
            draw_ctx.fill();
            draw_ctx.restore();
        } else if(cursor_type == CURSOR_TYPE.ENEMY_ENTITY) {
            draw_ctx.save();
            draw_ctx.lineWidth = SELECT_CURSOR_STROKE_WIDTH;
            draw_ctx.fillStyle = SELECT_CURSOR_COLOR;
            draw_ctx.strokeStyle = SELECT_CURSOR_STROKE_COLOR;
            draw_ctx.beginPath();
            const c_center = wtc_tfm.multiply_array(cursor.get_translation());
            const c_radius = wtc_tfm.apply_scale(cursor.get_size());
            draw_ctx.arc(c_center[0], c_center[1], c_radius, 0, 2 * Math.PI);
            draw_ctx.fill();
            draw_ctx.stroke();
        }
    }
}

export function draw_level_tile(draw_ctx: CanvasRenderingContext2D, 
                                wtc_tfm: Transform,
                                tile: SceneTile) {
    const c_corner = wtc_tfm.multiply_array(tile.get_translation());
    const c_size = wtc_tfm.apply_scale(tile.get_tile_size());
    const type = tile.get_type();
    draw_ctx.save();
    draw_ctx.lineWidth = TILE_STROKE_WIDTH;
    draw_ctx.fillStyle = TILE_WALKABLE_COLOR;
    draw_ctx.strokeStyle = TILE_STROKE_COLOR;

    draw_ctx.beginPath();

    if(type == 0) {
        // walkable
        draw_ctx.rect(c_corner[0], c_corner[1], c_size, c_size);            
    } else if(type == 2) {
        draw_ctx.rect(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2, c_size / 2, c_size / 2);
    } else if(type == 3) {
        draw_ctx.rect(c_corner[0], c_corner[1] + c_size / 2, c_size / 2, c_size / 2);
    } else if(type == 4) {
        draw_ctx.rect(c_corner[0] + c_size / 2, c_corner[1], c_size / 2, c_size / 2);
    } else if(type == 5) {
        draw_ctx.rect(c_corner[0], c_corner[1], c_size / 2, c_size / 2);
    } else if(type == 6) {
        draw_ctx.rect(c_corner[0], c_corner[1] + c_size / 2, c_size, c_size / 2);
    } else if(type == 7) {
        draw_ctx.rect(c_corner[0], c_corner[1], c_size / 2, c_size);
    } else if(type == 8) {
        draw_ctx.rect(c_corner[0], c_corner[1], c_size, c_size / 2);
    } else if(type == 9) {
        draw_ctx.rect(c_corner[0] + c_size / 2, c_corner[1], c_size / 2, c_size);
    } else if(type == 10) {
        draw_ctx.moveTo(c_corner[0], c_corner[1]);
        draw_ctx.lineTo(c_corner[0], c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1]);
    } else if(type == 11) {
        draw_ctx.moveTo(c_corner[0], c_corner[1]);
        draw_ctx.lineTo(c_corner[0], c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1]);
    } else if(type == 12) {
        draw_ctx.moveTo(c_corner[0], c_corner[1]);
        draw_ctx.lineTo(c_corner[0], c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1]);
    } else if(type == 13) {
        draw_ctx.moveTo(c_corner[0], c_corner[1] + c_size / 2);
        draw_ctx.lineTo(c_corner[0], c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1] + c_size);
        draw_ctx.lineTo(c_corner[0] + c_size, c_corner[1]);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1]);
        draw_ctx.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
    }

    draw_ctx.fill();
    if(TILE_IS_STROKE) {
        draw_ctx.stroke();
    }
    draw_ctx.restore();
}

function draw_person(draw_ctx: CanvasRenderingContext2D, 
                     wtc_tfm: Transform, 
                     person: Person,
                     cooldawns: Map<COOLDAWN, [number, number]>,
                     effects: Array<EffectBase>,
                     stroke_width: number,
                     back_color: string,
                     walk_color: string,
                     idle_color: string,
                     shift_color: string,
                     hide_color: string,
                     stroke_color: string,
                     secondary_stroke_color: string,
                     is_stroke: boolean) {
    // construct transform from local to canvas
    const person_tfm = person.get_tfm();
    const is_dead = person.get_is_dead();
    const tfm = wtc_tfm.compose_tfms(person_tfm);
    // calculate center on canvas
    const c_center = tfm.multiply(0.0, 0.0);
    const search_radius = person.get_search_radius();
    const c_search_radius = tfm.apply_scale(search_radius);

    // start draw
    if (person.get_debug_draw()) {
        if (!is_dead) {
            draw_ctx.save();
            draw_ctx.strokeStyle = SELECT_RADIUS_COLOR;
            const select_radius = person.get_select_radius();
            const c_select_radius = wtc_tfm.apply_scale(select_radius);
            draw_ctx.beginPath();
            draw_ctx.arc(c_center[0], c_center[1], c_select_radius, 0.0, 2 * Math.PI);
            draw_ctx.stroke();
            draw_ctx.restore();
        }

        // draw attack radius
        draw_ctx.save();
        draw_ctx.strokeStyle = is_dead ? ENTITY_DEAD_BACK_COLOR : secondary_stroke_color;
        draw_ctx.beginPath();
        const attack_radius = person.get_attack_distance();
        const c_attack_radius = tfm.apply_scale(attack_radius);
        draw_ctx.arc(c_center[0], c_center[1], c_attack_radius, 0.0, 2 * Math.PI);
        draw_ctx.stroke();
        draw_ctx.restore();

        // search radius
        draw_ctx.save();
        draw_ctx.strokeStyle = is_dead ? ENTITY_DEAD_BACK_COLOR : DEBUG_SEARCH_RADIUS_COLOR;
        draw_ctx.beginPath();
        draw_ctx.arc(c_center[0], c_center[1], c_search_radius, 0.0, 2 * Math.PI);
        draw_ctx.stroke();
        draw_ctx.restore();
    }

    // calculate radius of the character
    const radius = person.get_radius();
    const c_radius = tfm.apply_scale(radius);
    const p2 = tfm.multiply(radius * Math.SQRT2, 0.0);
    const a = person_tfm.rotation();

    // draw main character
    // search cone
    if (person.get_is_visible_search_cone() && !is_dead) {
        const search_start_angle = a + person.get_search_spread() / 2.0;
        const search_end_angle = a - person.get_search_spread() / 2.0;

        draw_ctx.save();
        draw_ctx.fillStyle = SEARCH_CONE_COLOR;
        draw_ctx.strokeStyle = SEARCH_CONE_STROKE;
        draw_ctx.lineWidth = SEARCH_CONE_STROKE_WIDTH;

        draw_ctx.beginPath();
        draw_ctx.arc(c_center[0], c_center[1], c_search_radius, search_start_angle, search_end_angle, true);
        draw_ctx.lineTo(c_center[0], c_center[1]);
        draw_ctx.closePath()
        draw_ctx.fill();
        draw_ctx.stroke();

        draw_ctx.restore();
    }

    draw_ctx.save();
    // at first base circle
    draw_ctx.lineWidth = stroke_width;
    draw_ctx.fillStyle = is_dead ? ENTITY_DEAD_BACK_COLOR : back_color;
    draw_ctx.strokeStyle = stroke_color;
    draw_ctx.beginPath();
    draw_ctx.arc(c_center[0], c_center[1], c_radius, a + Math.PI / 4, 2 * Math.PI + a - Math.PI / 4);
    draw_ctx.lineTo(p2[0], p2[1]);
    draw_ctx.fill();
    if(is_stroke) {
        draw_ctx.stroke();
    }

    // next life part
    if (!is_dead) {
        draw_ctx.fillStyle = person.get_move() == MOVE_STATUS.NONE ? (person.get_is_hide() ? hide_color : idle_color) : 
                            (person.get_move() == MOVE_STATUS.WALK ? (person.get_is_hide() ? hide_color : walk_color) : 
                            (shift_color));
        draw_ctx.beginPath();
        const life_prop = person.get_life_proportion();
        if (life_prop >= 1.0) {
            draw_ctx.arc(c_center[0], c_center[1], tfm.apply_scale(radius * ENTITY_LIFE_CIRCLE_DELTA), 0.0, Math.PI * 2.0);
        } else {
            draw_ctx.arc(c_center[0], c_center[1], tfm.apply_scale(radius * ENTITY_LIFE_CIRCLE_DELTA), a - (1.0 - life_prop) * Math.PI, a + (1.0 - life_prop) * Math.PI, true);
        }
        
        draw_ctx.lineTo(c_center[0], c_center[1]);
        draw_ctx.fill();
        if(is_stroke) {
            draw_ctx.stroke();
        }
    }
    draw_ctx.restore();

    // shield
    const is_active = person.get_shield_active();
    const shield_prop = person.get_shield_proportion();
    // does not draw full non-active shield
    if (is_active || shield_prop < 1.0) {
        draw_ctx.save();
        draw_ctx.strokeStyle = is_active ? SHIELD_ACTIVE_COLOR : SHIELD_PASSIVE_COLOR;
        draw_ctx.lineWidth = is_active ? SHIELD_ACTIVE_WIDTH : SHIELD_PASSIVE_WIDTH;
        draw_ctx.beginPath();
        draw_ctx.arc(c_center[0], c_center[1], tfm.apply_scale(radius * Math.SQRT2), a - shield_prop * Math.PI / 2, a + shield_prop * Math.PI / 2);
        draw_ctx.stroke();
        draw_ctx.restore();
    }

    // draw cooldawns
    // only for alive persons
    if (!is_dead) {
        for (let [cooldawn, times] of cooldawns) {
            draw_ctx.save();
            let cooldawn_radius = 0;
            if (cooldawn == COOLDAWN.SHIFT) {
                draw_ctx.lineWidth = COOLDAWN_SHIFT_WIDTH;
                draw_ctx.strokeStyle = COOLDAWN_SHIFT_COLOR;
                cooldawn_radius = COOLDAWN_SHIFT_RADIUS;
            } else if (cooldawn == COOLDAWN.MELEE_ATTACK) {
                draw_ctx.lineWidth = COOLDAWN_MELEE_ATTACK_WIDTH;
                draw_ctx.strokeStyle = COOLDAWN_MELEE_ATTACK_COLOR;
                cooldawn_radius = COOLDAWN_MELEE_ATTACK_RADIUS;
            }
            draw_ctx.beginPath();
            draw_ctx.arc(c_center[0], c_center[1], cooldawn_radius, a, 2.0 * Math.PI * (1.0 - times[1] / times[0]) + a);
            draw_ctx.stroke();
            draw_ctx.restore();
        }
    
        // draw effects
        for (const effect of effects) {
            const effect_type = effect.type();
            if (effect_type == EFFECT.MELEE_ATTACK) {
                const melee_effect: MeleeAttackEffect = effect as MeleeAttackEffect;
                const distance: number = melee_effect.distance();
                const spread: number = melee_effect.spread();
                const proportion: number = melee_effect.proportion();
    
                const c_distance = tfm.apply_scale(distance);
                const start_angle = a + spread / 2.0;
                const end_angle = start_angle - spread * proportion;
    
                draw_ctx.save();
                draw_ctx.fillStyle = EFFECT_MELEE_ATTACK_COLOR;
                draw_ctx.strokeStyle = EFFECT_MELEE_ATTACK_COLOR;
    
                draw_ctx.beginPath();
                draw_ctx.arc(c_center[0], c_center[1], c_distance, start_angle, end_angle, true);
                draw_ctx.arc(c_center[0], c_center[1], c_radius, end_angle, start_angle, false);
                draw_ctx.closePath();
                draw_ctx.fill();
    
                draw_ctx.beginPath();
                draw_ctx.arc(c_center[0], c_center[1], c_distance, start_angle, start_angle - spread, true);
                draw_ctx.arc(c_center[0], c_center[1], c_radius, start_angle - spread, start_angle, false);
                draw_ctx.closePath();
                draw_ctx.stroke();
                draw_ctx.restore();
            } else if (effect_type == EFFECT.STUN) {
                const proportion = 1.0 - effect.proportion();
                // draw as circle with changed inner circle
                draw_ctx.save();
                draw_ctx.fillStyle = EFFECT_STUN_COLOR;
                draw_ctx.strokeStyle = EFFECT_STUN_STROKE_COLOR;
    
                draw_ctx.beginPath();
                draw_ctx.arc(c_center[0], c_center[1], tfm.apply_scale(radius * EFFECT_STUN_RADIUS_MULTIPLIER), 0.0, Math.PI * 2.0);
                draw_ctx.fill();
    
                draw_ctx.beginPath();
                draw_ctx.arc(c_center[0], c_center[1], tfm.apply_scale(radius * EFFECT_STUN_RADIUS_MULTIPLIER * proportion), 0.0, Math.PI * 2.0);
                draw_ctx.stroke();
                draw_ctx.restore();
            }
        }
    }
}

export function draw_player(draw_ctx: CanvasRenderingContext2D, 
                            wtc_tfm: Transform, 
                            player: Player,
                            cooldawns: Map<COOLDAWN, [number, number]>,
                            effects: Array<EffectBase>) {
    
    draw_person(draw_ctx,
        wtc_tfm,
        player,
        cooldawns,
        effects,
        PLAYER_STROKE_WIDTH,
        PLAYER_LIVE_BACK_COLOR,
        PLAYER_MOVE_COLOR,
        PLAYER_IDLE_COLOR,
        PLAYER_SHIFT_COLOR,
        PLAYER_HIDE_COLOR,
        PLAYER_STROKE_COLOR,
        PLAYER_SECONDARY_STROKE_COLOR,
        PLAYER_IS_STROKE);
}

export function draw_monster(draw_ctx: CanvasRenderingContext2D, 
                             wtc_tfm: Transform, 
                             monster: Monster,
                             cooldawns: Map<COOLDAWN, [number, number]>,
                             effects: Array<EffectBase>) {
    
    draw_person(draw_ctx,
        wtc_tfm,
        monster,
        cooldawns,
        effects,
        MONSTER_STROKE_WIDTH,
        MONSTER_LIVE_BACK_COLOR,
        MONSTER_MOVE_COLOR,
        MONSTER_IDLE_COLOR,
        MONSTER_SHIFT_COLOR,
        MONSTER_HIDE_COLOR,
        MONSTER_STROKE_COLOR,
        MONSTER_SECONDARY_STROKE_COLOR,
        MONSTER_IS_STROKE);
}

export function draw_trajectory(draw_ctx: CanvasRenderingContext2D, 
                                wtc_tfm: Transform,
                                coordinates: Float32Array) {
    draw_ctx.save();
    draw_ctx.lineWidth = DEBUG_TRAJECTORY_WIDTH;
    draw_ctx.strokeStyle = DEBUG_TRAJECTORY_COLOR;
    draw_ctx.beginPath();
    const points_count = coordinates.length / 2;
    const c = wtc_tfm.multiply(coordinates[0], coordinates[1]);
    draw_ctx.moveTo(c[0], c[1]);
    for(let i = 1; i < points_count; i++) {
        const p = wtc_tfm.multiply(coordinates[2*i], coordinates[2*i+1]);
        draw_ctx.lineTo(p[0], p[1]);
    }
    draw_ctx.stroke();
    draw_ctx.restore();

    draw_ctx.save();
    draw_ctx.fillStyle = DEBUG_TRAJECTORY_POINT_COLOR;
    for(let i = 0; i < points_count; i++) {
        draw_ctx.beginPath();
        const p = wtc_tfm.multiply(coordinates[2*i], coordinates[2*i+1]);
        draw_ctx.arc(p[0], p[1], DEBUG_TRAJECTORY_POINT_RADIUS, 0.0, 2*Math.PI);
        draw_ctx.fill();
    }
    draw_ctx.restore();
}

export function draw_pairs(draw_ctx: CanvasRenderingContext2D, 
                           wtc_tfm: Transform,
                           array: Array<number>) {
    draw_ctx.save();
    draw_ctx.lineWidth =  DEBUG_CLOSEST_PAIR_WIDTH;
    draw_ctx.strokeStyle = DEBUG_CLOSEST_PAIR_COLOR;
    draw_ctx.beginPath();
    const piars_count = array.length / 4;
    for(let i = 0; i < piars_count; i++) {
        const p_start = wtc_tfm.multiply(array[4*i], array[4*i + 1]);
        const p_finish = wtc_tfm.multiply(array[4*i + 2], array[4*i + 3]);
        draw_ctx.moveTo(p_start[0], p_start[1]);
        draw_ctx.lineTo(p_finish[0], p_finish[1]);
    }
    draw_ctx.stroke();
    draw_ctx.restore();
}

function draw_rect(draw_ctx: CanvasRenderingContext2D, 
                   wtc_tfm: Transform,
                   coordinates: Float32Array,
                   stroke_style: string,
                   stroke_width: number) {
    draw_ctx.save();
    draw_ctx.lineWidth =  stroke_width;
    draw_ctx.strokeStyle = stroke_style;
    draw_ctx.beginPath();

    const s = wtc_tfm.multiply(coordinates[0], coordinates[1]);
    const e = wtc_tfm.multiply(coordinates[2], coordinates[3]);

    draw_ctx.moveTo(s[0], s[1]);
    draw_ctx.lineTo(e[0], s[1]);
    draw_ctx.lineTo(e[0], e[1]);
    draw_ctx.lineTo(s[0], e[1]);
    draw_ctx.closePath();

    draw_ctx.stroke();
    draw_ctx.restore();
}

export function draw_visibility_rect(draw_ctx: CanvasRenderingContext2D, 
                                     wtc_tfm: Transform,
                                     coordinates: Float32Array) {
    // this the center rect which contains the player
    draw_rect(draw_ctx, wtc_tfm, coordinates, DEBUG_VISIBILITY_RECT_COLOR, DEBUG_RECT_LINE_WIDTH);
    // next draw outer rect
    // calculate new corners
    const width = coordinates[2] - coordinates[0];
    const height = coordinates[3] - coordinates[1];
    const outer_coordinates = new Float32Array(4);
    outer_coordinates[0] = coordinates[0] - width;
    outer_coordinates[1] = coordinates[1] - height;
    outer_coordinates[2] = coordinates[2] + width;
    outer_coordinates[3] = coordinates[3] + height;
    draw_rect(draw_ctx, wtc_tfm, outer_coordinates, DEBUG_VISIBILITY_RECT_COLOR, DEBUG_RECT_LINE_WIDTH);
}

export function draw_neighbourhood_rect(draw_ctx: CanvasRenderingContext2D, 
                                        wtc_tfm: Transform,
                                        coordinates: Float32Array) {
    draw_rect(draw_ctx, wtc_tfm, coordinates, DEBUG_NEIGHBOURHOOD_RECT_COLOR, DEBUG_RECT_LINE_WIDTH);
}

export function draw_lines(draw_ctx: CanvasRenderingContext2D, 
                           wtc_tfm: Transform,
                           lines: Array<number>) {
    draw_ctx.save();
    draw_ctx.lineWidth =  DEBUG_ENEMIES_TARGET_LINE_WIDTH;
    draw_ctx.strokeStyle = DEBUG_ENEMIES_TARGET_LINE_COLOR;
    for (let line_index = 0; line_index < lines.length / 4; line_index++) {
        draw_ctx.beginPath();
        const s = wtc_tfm.multiply(lines[4 * line_index], lines[4 * line_index + 1]);
        const e = wtc_tfm.multiply(lines[4 * line_index + 2], lines[4 * line_index + 3]);

        draw_ctx.moveTo(s[0], s[1]);
        draw_ctx.lineTo(e[0], e[1]);
        draw_ctx.stroke();
    }
    draw_ctx.restore();
}