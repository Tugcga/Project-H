import { Entity } from "../../simple_ecs/types";

export class CastMeleeDamageComponent {
    private m_target: Entity;
    private m_distance: f32;
    private m_spread: f32;
    private m_damage: u32;

    constructor(in_target: Entity, in_distance: f32, in_spread: f32, in_damage: u32) {
        this.m_target = in_target;
        this.m_distance = in_distance;
        this.m_spread = in_spread;
        this.m_damage = in_damage;
    }

    target(): Entity {
        return this.m_target;
    }

    distance(): f32 {
        return this.m_distance;
    }

    spread(): f32 {
        return this.m_spread;
    }

    damage(): u32 {
        return this.m_damage;
    }
}