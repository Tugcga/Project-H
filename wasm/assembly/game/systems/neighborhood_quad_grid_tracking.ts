import { System } from "../../simple_ecs/system_manager";
import { List } from "../../pathfinder/common/list";
import { Entity } from "../../simple_ecs/types";
import { is_element_new } from "../utilities";

import { PositionComponent } from "../components/position";
import { NeighborhoodQuadGridIndexComponent } from "../components/neighborhood_quad_grid_index";
import { VisibleQuadGridTrackingSystem } from "./visible_quad_grid_tracking";

// the process is the simmilar as in VisibleQuadGridTrackingSystem
// the only difference is use of NeighborhoodQuadGridIndexComponent instead of VisibleQuadGridIndexComponent
export class NeighborhoodQuadGridTrackingSystem extends VisibleQuadGridTrackingSystem {
    update(dt: f32): void {
        const items_map = this.m_items_map;
        const items_map_length = items_map.length;
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const quad_index: NeighborhoodQuadGridIndexComponent | null = this.get_component<NeighborhoodQuadGridIndexComponent>(entity);

            if (position && quad_index) {
                const x = position.x();
                const y = position.y();

                const prev_quad = quad_index.value();
                // update quad index
                quad_index.set_from_position(x, y);
                const current_quad = quad_index.value();

                if (current_quad >= 0 && current_quad < items_map_length && prev_quad != current_quad) {  // new index different for the last index
                    // os, we should update the map for the old and new quad
                    if(prev_quad >= 0 && prev_quad < items_map_length) {
                        items_map[prev_quad].pop_value(entity);
                    }
                    items_map[current_quad].push(entity);
                }
            }
        }
    }
}
