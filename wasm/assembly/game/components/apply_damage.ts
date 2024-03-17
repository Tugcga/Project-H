import { Entity } from "../../simple_ecs/types";
import { List } from "../../pathfinder/common/list";

import { DAMAGE_TYPE } from "../constants";

export class ApplyDamageComponent { 
    private m_attackers: List<Entity>;
    private m_damages: List<u32>;
    private m_types: List<DAMAGE_TYPE>;
    private m_count: u32;

    constructor(in_attacker: Entity = 0, in_damage: u32 = 0, in_type: DAMAGE_TYPE = DAMAGE_TYPE.UNKNOWN) {
        this.m_attackers = new List<Entity>(16);
        this.m_damages = new List<u32>(16);
        this.m_types = new List<DAMAGE_TYPE>(16);

        this.m_attackers.push(in_attacker);
        this.m_damages.push(in_damage);
        this.m_types.push(in_type);

        this.m_count = 1;
    }

    count(): u32 {
        return this.m_count;
    }

    attacker(index: u32): Entity {
        return this.m_attackers[index];
    }

    damage(index: u32): u32 {
        return this.m_damages[index];
    }

    type(index: u32): DAMAGE_TYPE {
        return this.m_types[index];
    }

    extend(attacker: Entity, damage: u32, type: DAMAGE_TYPE): void {
        this.m_attackers.push(attacker);
        this.m_damages.push(damage);
        this.m_types.push(type);

        this.m_count += 1;
    }

    toString(): string {
        const parts = new StaticArray<string>(this.m_count);
        for (let i = 0, len = this.m_count; i < len; i++) {
            parts[i] = "[" + this.m_attackers[i].toString() + ", " + this.m_damages[i].toString() + ", " + this.m_types.toString() + "]";
        }
        return parts.join(", ");
    }
}