import { Navmesh } from "../../pathfinder/navmesh/navmesh";

import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { PositionComponent } from "../components/position";
import { VelocityComponent } from "../components/velocity";

export class MoveSystem extends System {
    private m_navmesh: Navmesh;

    constructor(in_nvamesh: Navmesh) {
        super();

        this.m_navmesh = in_nvamesh;
    }

    update(dt: f32): void {
        const entities = this.entities();
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const velocity: VelocityComponent | null = this.get_component<VelocityComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);

            if (velocity && position) {
                const x = position.x();
                const y = position.y();

                const new_x = x + velocity.x() * dt;
                const new_y = y + velocity.y() * dt;

                // snap to the navigation mesh
                const sample = this.m_navmesh.sample(new_x, 0.0, new_y);
                if (sample[3] > 0.5) {
                    position.set(sample[0], sample[2]);
                } else {
                    position.set(new_x, new_y);
                }
            }
        }
    }
}