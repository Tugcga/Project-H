import { Entity } from "../../simple_ecs/types";
import { WEAPON_DAMAGE_TYPE, BULLET_TYPE } from "../constants";

export class CastMeleeDamageComponent {
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

export class CastRangeDamageComponent {
    private m_target: Entity;
    private m_damage: u32;
    private m_bullet_speed: f32;
    private m_bullet_type: BULLET_TYPE;
    private m_weapon_damage_type: WEAPON_DAMAGE_TYPE;

    constructor(in_target: Entity, in_damage: u32, in_bullet_speed: f32, in_bullet_type: BULLET_TYPE, in_weapon_damage_type: WEAPON_DAMAGE_TYPE) {
        this.m_target = in_target;
        this.m_damage = in_damage;
        this.m_bullet_speed = in_bullet_speed;
        this.m_bullet_type = in_bullet_type;
        this.m_weapon_damage_type = in_weapon_damage_type;
    }

    target(): Entity {
        return this.m_target;
    }

    damage(): u32 {
        return this.m_damage;
    }

    bullet_speed(): f32 {
        return this.m_bullet_speed;
    }

    bullet_type(): BULLET_TYPE {
        return this.m_bullet_type;
    }

    weapon_type(): WEAPON_DAMAGE_TYPE {
        return this.m_weapon_damage_type;
    }
}