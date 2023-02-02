import { CLICK_CURSOR_RADIUS, CLICK_CURSOR_TIME, MAP_TILE_PIXELS_SIZES } from "./constants";
import { Transform } from "./transform";
import { CLICK_CURSOR_CENTER_SIZE, CLICK_CURSOR_COLOR, CLICK_CURSOR_STROKE_COLOR, CLICK_CURSOR_STROKE_WIDTH, MAP_PLAYER_SIZE, PLAYER_IDLE_COLOR, PLAYER_MOVE_COLOR, PLAYER_IS_STROKE, PLAYER_STROKE_COLOR, PLAYER_STROKE_WIDTH, TILE_IS_STROKE, TILE_STROKE_COLOR, TILE_STROKE_WIDTH, TILE_WALKABLE_COLOR, MONSTER_STROKE_WIDTH, MONSTER_MOVE_COLOR, MONSTER_IDLE_COLOR, MONSTER_STROKE_COLOR, MONSTER_IS_STROKE, MAP_COLOR } from "./visual_styles";

abstract class Drawable {
    m_wtc_tfm: Transform;  // wtc - world to canvas
    m_context: CanvasRenderingContext2D;

    constructor(in_ctxt: CanvasRenderingContext2D, in_wtc_tfm: Transform) {
        this.m_wtc_tfm = in_wtc_tfm;
        this.m_context = in_ctxt;
    }

    abstract draw(): void;
}

export class DrawTile extends Drawable {
    m_posx_x: number = 0.0;
    m_posx_y: number = 0.0;

    m_size: number = 0.0;
    m_type: number = 1;  // 1 - non-walkable tile

    constructor(in_ctxt: CanvasRenderingContext2D, 
                in_wtc_tfm: Transform, 
                in_x: number, // these are a world position of the start tile corner (not integer coordinates)
                in_y: number, 
                in_size: number,
                in_type: number) {
        super(in_ctxt, in_wtc_tfm);

        this.m_posx_x = in_x;
        this.m_posx_y = in_y;
        this.m_size = in_size;
        this.m_type = in_type;
    }

    draw(): void {
        const c_corner = this.m_wtc_tfm.multiply(this.m_posx_x, this.m_posx_y);
        const c_size = this.m_wtc_tfm.apply_scale(this.m_size);
        this.m_context.save();
        this.m_context.lineWidth = TILE_STROKE_WIDTH;
        this.m_context.fillStyle = TILE_WALKABLE_COLOR;
        this.m_context.strokeStyle = TILE_STROKE_COLOR;

        this.m_context.beginPath();

        if(this.m_type == 0) {
            // walkable
            this.m_context.rect(c_corner[0], c_corner[1], c_size, c_size);            
        } else if(this.m_type == 2) {
            this.m_context.rect(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2, c_size / 2, c_size / 2);
        } else if(this.m_type == 3) {
            this.m_context.rect(c_corner[0], c_corner[1] + c_size / 2, c_size / 2, c_size / 2);
        } else if(this.m_type == 4) {
            this.m_context.rect(c_corner[0] + c_size / 2, c_corner[1], c_size / 2, c_size / 2);
        } else if(this.m_type == 5) {
            this.m_context.rect(c_corner[0], c_corner[1], c_size / 2, c_size / 2);
        } else if(this.m_type == 6) {
            this.m_context.rect(c_corner[0], c_corner[1] + c_size / 2, c_size, c_size / 2);
        } else if(this.m_type == 7) {
            this.m_context.rect(c_corner[0], c_corner[1], c_size / 2, c_size);
        } else if(this.m_type == 8) {
            this.m_context.rect(c_corner[0], c_corner[1], c_size, c_size / 2);
        } else if(this.m_type == 9) {
            this.m_context.rect(c_corner[0] + c_size / 2, c_corner[1], c_size / 2, c_size);
        } else if(this.m_type == 10) {
            this.m_context.moveTo(c_corner[0], c_corner[1]);
            this.m_context.lineTo(c_corner[0], c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1]);
        } else if(this.m_type == 11) {
            this.m_context.moveTo(c_corner[0], c_corner[1]);
            this.m_context.lineTo(c_corner[0], c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1]);
        } else if(this.m_type == 12) {
            this.m_context.moveTo(c_corner[0], c_corner[1]);
            this.m_context.lineTo(c_corner[0], c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1]);
        } else if(this.m_type == 13) {
            this.m_context.moveTo(c_corner[0], c_corner[1] + c_size / 2);
            this.m_context.lineTo(c_corner[0], c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1] + c_size);
            this.m_context.lineTo(c_corner[0] + c_size, c_corner[1]);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1]);
            this.m_context.lineTo(c_corner[0] + c_size / 2, c_corner[1] + c_size / 2);
        }

        this.m_context.fill();
        if(TILE_IS_STROKE) {
            this.m_context.stroke();
        }
        this.m_context.restore();
    }    
}

class DrawPerson extends Drawable {
    m_radius: number = 0.0;
    m_is_move: boolean = false;

    m_tfm: Transform = new Transform();  // player in-scene transform (store position, rotation and scale)

    // visual constants
    m_stroke_width: number = 0.0;
    m_move_color: string = "";
    m_iddle_color: string = "";
    m_stroke_clor: string = "";
    m_is_stroke: boolean = false;

    constructor(in_ctxt: CanvasRenderingContext2D, 
                in_wtc_tfm: Transform) {
        super(in_ctxt, in_wtc_tfm);
    }

    set_move(in_value: boolean) {
        this.m_is_move = in_value;
    }

    set_position(in_x: number, in_y: number) {
        this.m_tfm.set_translation(in_x, in_y);
    }

    set_rotation(in_value: number) {
        this.m_tfm.set_rotation(in_value);
    }

    set_radius(in_r: number) {
        this.m_radius = in_r;
    }

    draw(): void {
        this.m_context.save();
        this.m_context.lineWidth = this.m_stroke_width;
        this.m_context.fillStyle = this.m_is_move ? this.m_move_color : this.m_iddle_color;
        this.m_context.strokeStyle = this.m_stroke_clor;
        this.m_context.beginPath();
        // constuct transform from local to canvas
        const tfm = this.m_wtc_tfm.compose_tfms(this.m_tfm);
        // calculate center on canvas
        const c_center = tfm.multiply(0.0, 0.0);
        // calculate radius on canvas
        const c_radius = tfm.apply_scale(this.m_radius);
        const p2 = tfm.multiply(this.m_radius * Math.SQRT2, 0.0);
        const a = this.m_tfm.rotation();
        this.m_context.arc(c_center[0], c_center[1], c_radius, a + Math.PI / 4, 2 * Math.PI + a - Math.PI / 4);
        this.m_context.lineTo(p2[0], p2[1]);
        this.m_context.fill();
        
        if(this.m_is_stroke) {
            this.m_context.stroke();
        }
        this.m_context.restore();
    }    
}

export class DrawPlayer extends DrawPerson {

    constructor(in_ctxt: CanvasRenderingContext2D, 
                in_wtc_tfm: Transform) {
        super(in_ctxt, in_wtc_tfm);

        this.m_stroke_width = PLAYER_STROKE_WIDTH;
        this.m_move_color = PLAYER_MOVE_COLOR;
        this.m_iddle_color = PLAYER_IDLE_COLOR;
        this.m_stroke_clor = PLAYER_STROKE_COLOR;
        this.m_is_stroke = PLAYER_IS_STROKE;
    }
}

export class DrawMonster extends DrawPerson {

    constructor(in_ctxt: CanvasRenderingContext2D, 
                in_wtc_tfm: Transform) {
        super(in_ctxt, in_wtc_tfm);

        this.m_stroke_width = MONSTER_STROKE_WIDTH;
        this.m_move_color = MONSTER_MOVE_COLOR;
        this.m_iddle_color = MONSTER_IDLE_COLOR;
        this.m_stroke_clor = MONSTER_STROKE_COLOR;
        this.m_is_stroke = MONSTER_IS_STROKE;
    }
}

export class DrawClickCursor extends Drawable {
    m_active: boolean = false;

    m_pos_x: number = 0.0;  // positions in world coordinates
    m_pos_y: number = 0.0;

    m_start_time: number = 0;

    constructor(in_ctxt: CanvasRenderingContext2D, 
                in_wtc_tfm: Transform) {
        super(in_ctxt, in_wtc_tfm);

    }

    activate(in_x: number, in_y: number) {
        this.m_pos_x = in_x;
        this.m_pos_y = in_y;

        this.m_start_time = performance.now();

        this.m_active = true;
    }

    draw(): void {
        if(this.m_active) {
            const current_time = performance.now();
            const time_delta = current_time - this.m_start_time;

            const prop: number = Math.pow(Math.min(time_delta / CLICK_CURSOR_TIME, 1.0), 0.15);

            // actual draw
            this.m_context.save();
            this.m_context.lineWidth = CLICK_CURSOR_STROKE_WIDTH;
            this.m_context.fillStyle = CLICK_CURSOR_COLOR;
            this.m_context.strokeStyle = CLICK_CURSOR_STROKE_COLOR;
            this.m_context.beginPath();
            const c_center = this.m_wtc_tfm.multiply(this.m_pos_x, this.m_pos_y);
            const c_radius = this.m_wtc_tfm.apply_scale(CLICK_CURSOR_RADIUS) * prop;
            this.m_context.arc(c_center[0], c_center[1], c_radius, 0, 2 * Math.PI);
            this.m_context.fill();
            this.m_context.stroke();

            // draw center dot
            this.m_context.beginPath();
            this.m_context.fillStyle = CLICK_CURSOR_STROKE_COLOR;
            this.m_context.arc(c_center[0], c_center[1], CLICK_CURSOR_CENTER_SIZE, 0, 2 * Math.PI);
            this.m_context.fill();
            this.m_context.restore();

            if(time_delta > CLICK_CURSOR_TIME) {
                this.m_active = false;
            }
        }
    }
}

export class DrawMap extends Drawable {
    m_vertices: Float32Array;
    m_polygons: Int32Array;
    m_sizes: Int32Array;

    m_canvas_width: number;
    m_canvas_height: number;
    m_tile_size: number;

    m_active: boolean = false;
    m_tfm: Transform = new Transform();
    m_scale: number = 0.0;
    m_scale_index: number = 0;

    constructor(in_ctxt: CanvasRenderingContext2D, in_wtc_tfm: Transform,
        in_tile_size: number,
        in_vertices: Float32Array, in_polygons: Int32Array, in_sizes: Int32Array) {
        super(in_ctxt, in_wtc_tfm);

        this.m_canvas_width = in_ctxt.canvas.width;
        this.m_canvas_height = in_ctxt.canvas.height;

        this.m_tile_size = in_tile_size;

        this.m_vertices = in_vertices;
        this.m_polygons = in_polygons;
        this.m_sizes = in_sizes;

        this.m_scale_index = Math.floor(MAP_TILE_PIXELS_SIZES.length / 2);
        this._update_scale();
    }

    private _update_scale() {
        this.m_scale = MAP_TILE_PIXELS_SIZES[this.m_scale_index] / this.m_tile_size;
    }

    toggle_active() {
        this.m_active = !this.m_active;
    }

    scale_up() {
        if(this.m_active) {
            this.m_scale_index++;
            if(this.m_scale_index == MAP_TILE_PIXELS_SIZES.length) {
                this.m_scale_index--;
            }
            this._update_scale();
        }
    }

    scale_down() {
        if(this.m_active) {
            this.m_scale_index--;
            if(this.m_scale_index == -1) {
                this.m_scale_index++;
            }
            this._update_scale();
        }
    }

    draw(): void {
        if(this.m_active) {
            // get player world position from world-to-canvas transform
            const ctw_tfm = this.m_wtc_tfm.inverse();
            const pos = ctw_tfm.multiply(this.m_canvas_width / 2, this.m_canvas_height / 2);

            this.m_tfm.set_uniform_scale(this.m_scale);
            this.m_tfm.set_translation(this.m_canvas_width / 2 - pos[0] * this.m_scale, this.m_canvas_height / 2 - pos[1] * this.m_scale);

            this.m_context.save();
            this.m_context.fillStyle = MAP_COLOR;
            this.m_context.strokeStyle = MAP_COLOR;
            this.m_context.lineWidth = 0.125;
            let shift = 0;
            for(let i = 0; i < this.m_sizes.length; i++) {
                // i - polygon index
                const s = this.m_sizes[i];  // polygon size
                
                // start new poligon
                this.m_context.beginPath();
                // get polygon corners
                for(let j = 0; j < s; j++) {
                    const v = this.m_polygons[shift + j];  // v - vertex index
                    const x = this.m_vertices[3*v];
                    const y = this.m_vertices[3*v + 2];  // skip second coordinate, it always equal to 0

                    const c_position = this.m_tfm.multiply(x, y);
                    if(j == 0) {  // start polygon
                        this.m_context.moveTo(c_position[0], c_position[1]);
                    } else {  // continue polygon
                        this.m_context.lineTo(c_position[0], c_position[1]);
                    }
                }
                // finish the polygon
                this.m_context.fill();
                this.m_context.stroke();

                shift += s;
            }

            // next draw the player at the map
            this.m_context.beginPath();
            this.m_context.fillStyle = PLAYER_IDLE_COLOR;
            const c_center = this.m_tfm.multiply(pos[0], pos[1]);

            this.m_context.arc(c_center[0], c_center[1], MAP_PLAYER_SIZE, 0, 2 * Math.PI);
            this.m_context.fill();
            this.m_context.restore();
        }
    }
}