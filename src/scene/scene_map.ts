import { MAP_TILE_PIXELS_SIZES } from "../constants";
import { Transform } from "../transform";
import { MAP_COLOR, MAP_PLAYER_SIZE, PLAYER_IDLE_COLOR } from "../client_data_canvas/visual_styles";

export class SceneMap {
    m_context: CanvasRenderingContext2D;
    m_wtc_tfm: Transform;
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

    constructor(in_ctxt: CanvasRenderingContext2D, 
                in_wtc_tfm: Transform,
                in_tile_size: number,
                in_vertices: Float32Array, 
                in_polygons: Int32Array, 
                in_sizes: Int32Array) {
        this.m_context = in_ctxt;
        this.m_wtc_tfm = in_wtc_tfm;

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
        this.m_context.clearRect(0, 0, this.m_canvas_width, this.m_canvas_height);
        
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