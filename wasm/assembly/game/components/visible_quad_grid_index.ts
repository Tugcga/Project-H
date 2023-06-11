import { OneIntComponent } from "./one_value";

// this component assigned only to monsters
// it allows to track the visible quad index for each monster entity
export class VisibleQuadGridIndexComponent extends OneIntComponent {
    private m_width_count: i32 = 0;  // the number of quads in one horisontal line
    private m_quad_size: f32 = 0.0;

    constructor(in_level_width: f32, in_quad_size: f32) {
        super();

        this.m_quad_size = in_quad_size;
        this.m_width_count = <i32>(in_level_width / in_quad_size) + 1;  // this value can be actual greater than in real
    }

    set_from_position(pos_x: f32, pos_y: f32): void {
        const quad_size = this.m_quad_size;
        const x_index = <i32>(pos_x / quad_size);
        const y_index = <i32>(pos_y / quad_size);

        this.m_value = y_index * this.m_width_count + x_index;
    }

    width_count(): i32 {
        return this.m_width_count;
    }

    quad_size(): f32 {
        return this.m_quad_size;
    }
}