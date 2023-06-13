import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { EPSILON } from "../constants";

import { Navmesh } from "../../pathfinder/navmesh/navmesh";
import { RTree } from "../../pathfinder/navmesh/rtree/rtree";
import { clamp } from "../../pathfinder/common/utilities";

import { VelocityComponent } from "../components/velocity";
import { PositionComponent } from "../components/position";

const delta: f32 = 0.1;  // used for shift start point in the edge intersection calculation

// in this system we modify velocity, obtained from rvo (or trivial transfered from preferred velocity)
// control velocity to prevent to move from walkable are
export class PostVelocitySystem extends System {
    private m_navmesh: Navmesh;

    constructor(in_navmesh: Navmesh) {
        super();

        this.m_navmesh = in_navmesh;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const navmesh = this.m_navmesh;
        const tree = navmesh.boundary_tree();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const velocity: VelocityComponent | null = this.get_component<VelocityComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);

            if (velocity && position) {
                const velocity_x = velocity.x();
                const velocity_y = velocity.y();

                const position_x = position.x();
                const position_y = position.y();

                const finish_x = position_x + velocity_x * dt;
                const finish_y = position_y + velocity_y * dt;

                // slightly shift the start point in opposite direction
                const velocity_length = velocity.length();
                const edge_length = velocity_length * dt;
                // process only for non-zero velocity
                if (velocity_length > EPSILON && edge_length > EPSILON) {
                    const velocity_normalized_x = velocity_x / velocity_length;
                    const velocity_normalized_y = velocity_y / velocity_length;

                    const start_x = position_x - velocity_normalized_x * delta;
                    const start_y = position_y - velocity_normalized_y * delta;

                    // check is edge froms tart to finish intersects with navmesh boundary
                    const t = tree.find_intersection_t(start_x, start_y,  finish_x, finish_y, true);
                    const unshift_t = ((edge_length + delta) * t - delta) / edge_length;

                    // scale the velocity
                    if (unshift_t > EPSILON) {
                        velocity.set(velocity_x * unshift_t, velocity_y * unshift_t);
                    } else {
                        velocity.set(0.0, 0.0);
                    }
                }
            }
        }
    }
}