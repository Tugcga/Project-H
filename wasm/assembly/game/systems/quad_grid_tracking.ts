import { System } from "../../simple_ecs/system_manager";
import { List } from "../../pathfinder/common/list";
import { Entity } from "../../simple_ecs/types";
import { is_element_new } from "../utilities";

// base class for all quad grid systems
export class QuadGridTrackingSystem extends System {
    private m_items_map: StaticArray<List<Entity>>;  // store here list of entities at every grid cell
    private m_width_count: i32;
    private m_quad_size: f32;
    private m_visited_buffer: List<u32> = new List<u32>(9);
    private m_return_buffer: List<Entity> = new List<Entity>(12);

    constructor(in_level_width: f32, in_level_height: f32, quad_size: f32) {
        super();

        // calculate the number of quads for the map
        const x_size = <i32>(in_level_width / quad_size) + 1;
        const y_size = <i32>(in_level_height / quad_size) + 1;

        this.m_width_count = x_size;
        this.m_quad_size = quad_size;

        this.m_items_map = new StaticArray<List<Entity>>(x_size * y_size);
        for (let i = 0, len = x_size * y_size; i < len; i++) {
            this.m_items_map[i] = new List<Entity>();
        }
    }

    width_count(): i32 {
        return this.m_width_count;
    }

    quad_size(): f32 {
        return this.m_quad_size;
    }

    get_quad_index(pos_x: f32, pos_y: f32): i32 {
        const quad_size = this.m_quad_size;
        const x_index = <i32>(pos_x / quad_size);
        const y_index = <i32>(pos_y / quad_size);

        const width_count = this.m_width_count;
        return y_index * width_count + x_index;
    }

    remove_entity(entity: Entity, grid_cell: i32): void {
        const items_map = this.m_items_map;
        
        if (grid_cell >= 0 && grid_cell < items_map.length) {
            const cell_list = items_map[grid_cell];
            const v = cell_list.pop_value(entity);
        }
    }

    // return all movable entities in the quad with given position and also from the near quads
    get_items_from_position(pos_x: f32, pos_y: f32): List<Entity> {
        // get quad index
        const width_count = this.m_width_count;
        const index = this.get_quad_index(pos_x, pos_y);
        const items_map = this.m_items_map;
        const items_map_length = items_map.length;

        const center = this.m_return_buffer;
        center.reset();

        if (index >= 0 && index < items_map_length) {
            const visited_buffer = this.m_visited_buffer;

            visited_buffer.reset();
    
            center.copy_from(items_map[index]);
            visited_buffer.push(index);
            
            // also we should add to the center list items from other near quads
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (!(x == 0 && y == 0)) {
                        const i = index + y * width_count + x;
                        if (i >= 0 && i < items_map_length && is_element_new(visited_buffer, i)) {
                            const addon = items_map[i];
                            center.extend(addon);
                            visited_buffer.push(i);
                        }
                    }
                }
            }
        }

        return center;
    }
}
