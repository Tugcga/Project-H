import { System } from "../../simple_ecs/system_manager";
import { List } from "../../pathfinder/common/list";
import { Entity } from "../../simple_ecs/types";
import { is_element_new } from "../utilities";

import { PositionComponent } from "../components/position";
import { VisibleQuadGridIndexComponent } from "../components/visible_quad_grid_index";

// this system tracking entites and place it to the corresponding grid cell
// also store the corresponding cell index into special coomponent
// this system track only monsters (it inited with monster tag)
// each of them contains position and grid index component
export class VisibleQuadGridTrackingSystem extends System {
    private m_items_map: StaticArray<List<Entity>>;  // store here list of entities at every grid cell
    private m_width_count: i32;
    private m_quad_size: f32;
    private m_visited_buffer: List<u32> = new List<u32>(9);

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

    // return all movable entities in the quad with given position and also from the near quads
    get_items_from_position(pos_x: f32, pos_y: f32): List<Entity> {
        // get quad index
        const quad_size = this.m_quad_size;
        const x_index = <i32>(pos_x / quad_size);
        const y_index = <i32>(pos_y / quad_size);

        const width_count = this.m_width_count;
        const index = y_index * width_count + x_index;

        if (index >= 0) {
            const visited_buffer = this.m_visited_buffer;
            const items_map = this.m_items_map;

            visited_buffer.reset();

            const center = new List<Entity>();
            center.copy_from(items_map[index]);
            visited_buffer.push(index);
            
            // also we should add to the center list items from other near quads
            for (let x = -1; x <= 1; x++) {
                for (let y = -1; y <= 1; y++) {
                    if (!(x == 0 && y == 0)) {
                        const i = index + y * width_count + x;
                        if (i >= 0 && i < items_map.length && is_element_new(visited_buffer, i)) {
                            const addon = items_map[i];
                            center.extend(addon);
                            visited_buffer.push(i);
                        }
                    }
                }
            }
            return center;
        }

        return new List<Entity>();
    }

    update(dt: f32): void {
        const entities = this.entities();
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const quad_index: VisibleQuadGridIndexComponent | null = this.get_component<VisibleQuadGridIndexComponent>(entity);

            if (position && quad_index) {
                const x = position.x();
                const y = position.y();

                const prev_quad = quad_index.value();
                // update quad index
                quad_index.set_from_position(x, y);
                const current_quad = quad_index.value();

                if (prev_quad != current_quad) {  // new index different for the last index
                    // os, we should update the map for the old and new quad
                    if (prev_quad >= 0) {
                        this.m_items_map[prev_quad].pop_value(entity);
                    }
                    this.m_items_map[current_quad].push(entity);
                }
            }
        }
    }
}
