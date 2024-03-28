import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { BuffShiftCooldawnComponent,
         BuffMeleeAttackCooldawnComponent,
         BuffHideCooldawnComponent,
         BuffShadowAttackCooldawnComponent } from "../components/buffs";

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

export class BuffTimerMeleeAttackCooldawnSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const cooldawn: BuffMeleeAttackCooldawnComponent | null = this.get_component<BuffMeleeAttackCooldawnComponent>(entity);
            if (cooldawn) {
                cooldawn.increase_time(dt);

                if (cooldawn.is_over()) {
                    this.remove_component<BuffMeleeAttackCooldawnComponent>(entity);
                }
            }
        }
    }
}

export class BuffTimerHideCooldawnSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const cooldawn: BuffHideCooldawnComponent | null = this.get_component<BuffHideCooldawnComponent>(entity);
            if (cooldawn) {
                cooldawn.increase_time(dt);

                if (cooldawn.is_over()) {
                    this.remove_component<BuffHideCooldawnComponent>(entity);
                }
            }
        }
    }
}

export class BuffTimerShadowAttackCooldawnSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const cooldawn: BuffShadowAttackCooldawnComponent | null = this.get_component<BuffShadowAttackCooldawnComponent>(entity);
            if (cooldawn) {
                cooldawn.increase_time(dt);

                if (cooldawn.is_over()) {
                    this.remove_component<BuffShadowAttackCooldawnComponent>(entity);
                }
            }
        }
    }
}