import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { PreferredVelocityComponent } from "../components/preferred_velocity";
import { VelocityComponent } from "../components/velocity";

// trivial system, which transfer preferred velocity to velocity component
// used instead of rvo (if it disabled)
export class PrefToVelocitySystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];
            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);
            const velocity: VelocityComponent | null = this.get_component<VelocityComponent>(entity);

            if (velocity && pref_velocity) {
                velocity.set(pref_velocity.x(), pref_velocity.y());
            }
        }
    }
}