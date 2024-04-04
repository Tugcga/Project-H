import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

class BuffCooldawn {
    private m_cooldawn_time: f32;
    private m_spend_time: f32;

    constructor(in_cooldawn: f32) {
        this.m_cooldawn_time = in_cooldawn;
        this.m_spend_time = 0.0;
    }

    increase_time(dt: f32): void {
        this.m_spend_time += dt;
    }

    is_over(): bool {
        if (this.m_spend_time >= this.m_cooldawn_time) {
            return true;
        }

        return false;
    }
}

function timer_update<T>(dt: f32, system: System): void {
    const entities = system.entities();

    for (let i = 0, len = entities.length; i < len; i++) {
        const entity: Entity = entities[i];

        const cooldawn: T | null = system.get_component<T>(entity);
        if (cooldawn) {
            cooldawn.increase_time(dt);

            if (cooldawn.is_over()) {
                system.remove_component<T>(entity);
            }
        }
    }
}

/* 
** For each new skill we should create a default pair of component/timer
** call the component Buff...CooldawnComponents and system BuffTimer...CooldawnSystem
** the set of these pairs is the same as COOLDAWN enum in constants
*/

export class BuffShiftCooldawnComponent extends BuffCooldawn {}
export class BuffTimerShiftCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffShiftCooldawnComponent>(dt, this);
    }
}

export class BuffMeleeAttackCooldawnComponent extends BuffCooldawn {}
export class BuffTimerMeleeAttackCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffMeleeAttackCooldawnComponent>(dt, this);
    }
}

export class BuffRangeAttackCooldawnComponent extends BuffCooldawn {}
export class BuffTimerRangeAttackCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffRangeAttackCooldawnComponent>(dt, this);
    }
}

export class BuffHandAttackCooldawnComponent extends BuffCooldawn {}
export class BuffTimerHandAttackCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffHandAttackCooldawnComponent>(dt, this);
    }
}

export class BuffHideCooldawnComponent extends BuffCooldawn {}
export class BuffTimerHideCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffHideCooldawnComponent>(dt, this);
    }
}

export class BuffShadowAttackCooldawnComponent extends BuffCooldawn {}
export class BuffTimerShadowAttackCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffShadowAttackCooldawnComponent>(dt, this);
    }
}

export class BuffSkillRoundAttackCooldawnComponent extends BuffCooldawn {}
export class BuffTimerSkillRoundAttackCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffSkillRoundAttackCooldawnComponent>(dt, this);
    }
}

export class BuffSkillStunConeCooldawnComponent extends BuffCooldawn {}
export class BuffTimerSkillStunConeCooldawnSystem extends System {
    update(dt: f32): void {
        timer_update<BuffSkillStunConeCooldawnComponent>(dt, this);
    }
}