import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { List } from "../../pathfinder/common/list";

import { VisibleQuadGridTrackingSystem } from "./visible_quad_grid_tracking";
import { PositionComponent } from "../components/position";
import { VisibleQuadGridNeighborhoodComponent } from "../components/visible_quad_grid_neighborhood";
import { AngleComponent } from "../components/angle";
import { RadiusComponent } from "../components/radius";
import { PositionComponent } from "../components/position";
import { MoveTagComponent } from "../components/tags";
import { UpdateToClientComponent } from "../components/update_to_client";

import { external_remove_monster,
         external_create_monster } from "../../external";

// this system applies only for the player
// because it requires player tag, position and neighborhood components
export class VisibleQuadGridNeighborhoodSystem extends System {
    private m_tracking_system: VisibleQuadGridTrackingSystem;

    constructor(in_tracking: VisibleQuadGridTrackingSystem) {
        super();

        this.m_tracking_system = in_tracking;
    }

    update(dt: f32): void {
        const entity: Entity = this.singleton();
        const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
        const quad_neight: VisibleQuadGridNeighborhoodComponent | null = this.get_component<VisibleQuadGridNeighborhoodComponent>(entity);

        if (position && quad_neight) {
            const pos_x = position.x();
            const pos_y = position.y();

            const neight_entities: List<Entity> = this.m_tracking_system.get_items_from_position(pos_x, pos_y);
            quad_neight.set_entities(neight_entities);

            // next we should output data about neighborhood monsters to the client
            const to_delete = quad_neight.to_delete();
            for (let i = 0, len = to_delete.length; i < len; i++) {
                external_remove_monster(to_delete.get(i));
            }

            const to_create = quad_neight.to_create();
            for (let i = 0, len = to_create.length; i < len; i++) {
                const e = to_create.get(i);
                const should_update: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(e);

                if (should_update) {
                    should_update.set_value(true);
                    const e_radius = this.get_component<RadiusComponent>(e);
                    if (e_radius) {
                        external_create_monster(e, e_radius.value());
                    }
                }
            }
        }
    }
}
