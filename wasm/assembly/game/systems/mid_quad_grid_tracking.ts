import { System } from "../../simple_ecs/system_manager";
import { List } from "../../pathfinder/common/list";
import { Entity } from "../../simple_ecs/types";
import { is_element_new } from "../utilities";

import { QuadGridTrackingSystem } from "./quad_grid_tracking";

import { PositionComponent } from "../components/position";
import { MidQuadGridIndexComponent } from "../components/mid_quad_grid_index";

export class MidQuadGridTrackingSystem extends QuadGridTrackingSystem {
    update(dt: f32): void {
        const entities = this.entities();
        const items_map = this.m_items_map;
        const items_map_length = items_map.length;

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const quad_index: MidQuadGridIndexComponent | null = this.get_component<MidQuadGridIndexComponent>(entity);

            if (position && quad_index) {
                const x = position.x();
                const y = position.y();

                const prev_quad = quad_index.value();
                quad_index.set_from_position(x, y);
                const current_quad = quad_index.value();

                if (current_quad >= 0 && current_quad < items_map_length && prev_quad != current_quad) {
                    if (prev_quad >= 0 && prev_quad < items_map_length) {
                        items_map[prev_quad].pop_value(entity);
                    }
                    items_map[current_quad].push(entity);
                }
            }
        }
    }
}
