import { Entity } from "../../simple_ecs/types";
import { WEAPON_DAMAGE_TYPE } from "../constants";

export class CastWeaponDamageComponent {
    private m_target: Entity;
    private m_distance: f32;
    private m_spread: f32;
    private m_damage: u32;
    private m_weapon_damage_type: WEAPON_DAMAGE_TYPE;

    constructor(in_target: Entity, in_distance: f32, in_spread: f32, in_damage: u32, weapon_type: WEAPON_DAMAGE_TYPE) {
        this.m_target = in_target;
        this.m_distance = in_distance;
        this.m_spread = in_spread;
        this.m_damage = in_damage;
        this.m_weapon_damage_type = weapon_type;
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

    weapon_type(): WEAPON_DAMAGE_TYPE {
        return this.m_weapon_damage_type;
    }
}

export class CastShadowDamageComponent {
    private m_target: Entity;
    private m_distance: f32;

    constructor(in_target: Entity, in_distance: f32) {
        this.m_target = in_target;
        this.m_distance = in_distance;
    }

    target(): Entity {
        return this.m_target;
    }

    distance(): f32 {
        return this.m_distance;
    }
}