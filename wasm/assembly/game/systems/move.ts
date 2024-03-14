import { Navmesh } from "../../pathfinder/navmesh/navmesh";

import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { STATE } from "../constants";

import { PositionComponent } from "../components/position";
import { VelocityComponent } from "../components/velocity";
import { StateComponent } from "../components/state";

export class MoveSystem extends System {
    private m_navmesh: Navmesh;
    private m_snap_to_navmesh: bool;

    constructor(in_nvamesh: Navmesh, in_snap_to_navmesh: bool) {
        super();

        this.m_navmesh = in_nvamesh;
        this.m_snap_to_navmesh = in_snap_to_navmesh;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const is_snap = this.m_snap_to_navmesh;
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const velocity: VelocityComponent | null = this.get_component<VelocityComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);

            if (velocity && position && state) {
                const state_state = state.state();
                if (state_state != STATE.CASTING) {
                    const x = position.x();
                    const y = position.y();

                    const new_x = x + velocity.x() * dt;
                    const new_y = y + velocity.y() * dt;

                    // snap to the navigation mesh
                    if (is_snap) {
                        const sample = this.m_navmesh.sample(new_x, 0.0, new_y);
                        if (sample[3] > 0.5) {
                            position.set(sample[0], sample[2]);
                        } else {
                            position.set(new_x, new_y);
                        }
                    } else {
                        position.set(new_x, new_y);
                    }
                }
            }
        }
    }
}