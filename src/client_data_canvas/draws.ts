import { ClickCursor } from "../scene/click_cursor";
import { CLICK_CURSOR_RADIUS, CLICK_CURSOR_TIME } from "../constants";
import { SceneTile } from "../scene/scene_tile";
import { Transform } from "../transform";
import { CLICK_CURSOR_CENTER_SIZE, CLICK_CURSOR_COLOR, CLICK_CURSOR_STROKE_COLOR, CLICK_CURSOR_STROKE_WIDTH, DEBUG_CLOSEST_PAIR_COLOR, DEBUG_CLOSEST_PAIR_WIDTH, DEBUG_NEIGHBORHOOD_RECT_COLOR, DEBUG_RECT_LINE_WIDTH, DEBUG_TRAJECTORY_COLOR, DEBUG_TRAJECTORY_WIDTH, DEBUG_VISIBILITY_RECT_COLOR, MONSTER_IDLE_COLOR, MONSTER_IS_STROKE, MONSTER_MOVE_COLOR, MONSTER_STROKE_COLOR, MONSTER_STROKE_WIDTH, PLAYER_IDLE_COLOR, PLAYER_IS_STROKE, PLAYER_MOVE_COLOR, PLAYER_STROKE_COLOR, PLAYER_STROKE_WIDTH, TILE_IS_STROKE, TILE_NONWALKABLE_COLOR, TILE_STROKE_COLOR, TILE_STROKE_WIDTH, TILE_WALKABLE_COLOR } from "./visual_styles";
import { Person } from "../scene/person";
import { Player } from "../scene/player";

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
                     stroke_width: number,
                     move_color: string,
                     iddle_color: string,
                     stroke_color: string,
                     is_stroke: boolean) {
    draw_ctx.save();
    draw_ctx.lineWidth = stroke_width;
    draw_ctx.fillStyle = person.get_move() ? move_color : iddle_color;
    draw_ctx.strokeStyle = stroke_color;
    draw_ctx.beginPath();
    // constuct transform from local to canvas
    const person_tfm = person.get_tfm();
    const tfm = wtc_tfm.compose_tfms(person_tfm);
    // calculate center on canvas
    const c_center = tfm.multiply(0.0, 0.0);
    // calculate radius on canvas
    const radius = person.get_radius();
    const c_radius = tfm.apply_scale(radius);
    const p2 = tfm.multiply(radius * Math.SQRT2, 0.0);
    const a = person_tfm.rotation();
    draw_ctx.arc(c_center[0], c_center[1], c_radius, a + Math.PI / 4, 2 * Math.PI + a - Math.PI / 4);
    draw_ctx.lineTo(p2[0], p2[1]);
    draw_ctx.fill();
    
    if(is_stroke) {
        draw_ctx.stroke();
    }
    draw_ctx.restore();
}

export function draw_player(draw_ctx: CanvasRenderingContext2D, 
                            wtc_tfm: Transform, 
                            player: Player) {
    
    draw_person(draw_ctx,
        wtc_tfm,
        player,
        PLAYER_STROKE_WIDTH,
        PLAYER_MOVE_COLOR,
        PLAYER_IDLE_COLOR,
        PLAYER_STROKE_COLOR,
        PLAYER_IS_STROKE);
}

export function draw_monster(draw_ctx: CanvasRenderingContext2D, 
                             wtc_tfm: Transform, 
                             player: Player) {
    
    draw_person(draw_ctx,
        wtc_tfm,
        player,
        MONSTER_STROKE_WIDTH,
        MONSTER_MOVE_COLOR,
        MONSTER_IDLE_COLOR,
        MONSTER_STROKE_COLOR,
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
    draw_rect(draw_ctx, wtc_tfm, coordinates, DEBUG_VISIBILITY_RECT_COLOR, DEBUG_RECT_LINE_WIDTH);
}

export function draw_neighborhood_rect(draw_ctx: CanvasRenderingContext2D, 
                                       wtc_tfm: Transform,
                                       coordinates: Float32Array) {
    draw_rect(draw_ctx, wtc_tfm, coordinates, DEBUG_NEIGHBORHOOD_RECT_COLOR, DEBUG_RECT_LINE_WIDTH);
}