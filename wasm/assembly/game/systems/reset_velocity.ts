import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { PreferredVelocityComponent } from "../components/preferred_velocity";

// this system executes at the sater of update
// it reset all velocities to zero
// if the actor is moved, then other systems will change pref velocity and next actual velocity
// but if the actor is in iddle, then rvo can also change the velocity
// so we should reset this change at every frame
export class ResetVelocitySystem extends System {
    update(dt: f32): void {
        const entities = this.entities();
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);

            if (pref_velocity) {
                pref_velocity.set(0.0, 0.0);
            }
        }
    }
}