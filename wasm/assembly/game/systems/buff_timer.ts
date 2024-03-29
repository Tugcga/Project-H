import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { BuffShiftCooldawnComponent } from "../components/buffs";

export class BuffTimerShiftCooldawnSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const cooldawn: BuffShiftCooldawnComponent | null = this.get_component<BuffShiftCooldawnComponent>(entity);
            if (cooldawn) {
                cooldawn.increase_time(dt);

                if (cooldawn.is_over()) {
                    this.remove_component<BuffShiftCooldawnComponent>(entity);
                }
            }
        }
    }
}