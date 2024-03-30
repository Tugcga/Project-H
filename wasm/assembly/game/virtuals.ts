import { INVENTORY_ITEM_TYPE, WEAPON_TYPE } from "./constants";

class VirtualItem {
    private m_item_type: INVENTORY_ITEM_TYPE = INVENTORY_ITEM_TYPE.UNKNOWN;

    constructor() {

    }
}

export class VirtualWeapon extends VirtualItem {
    private m_attack_distance: f32;
    private m_attack_time: f32;
    private m_attack_cooldawn: f32;

    private m_shield: f32;
    private m_damage: u32;

    private m_weapon_type: WEAPON_TYPE = WEAPON_TYPE.UNKNOWN;

    constructor(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32) {
        super();

        this.m_attack_distance = attack_distance;
        this.m_attack_time = attack_time;
        this.m_attack_cooldawn = attack_cooldawn;

        this.m_shield = shield;
        this.m_damage = damage;

        this.m_item_type = INVENTORY_ITEM_TYPE.WEAPON;
    }

    attack_distance(): f32 { return this.m_attack_distance; }
    attack_time(): f32 { return this.m_attack_time; }
    attack_cooldawn(): f32 { return this.m_attack_cooldawn; }
    shield(): f32 { return this.m_shield; }
    damage(): u32 { return this.m_damage; }
    type(): WEAPON_TYPE { return this.m_weapon_type; }
}

export class VirtualWeaponEmpty extends VirtualWeapon {
    private m_damage_distance: f32

    constructor(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32,
                damage_distance: f32) {
        super(attack_distance, attack_time, attack_cooldawn, shield, damage);
        this.m_damage_distance = damage_distance;

        this.m_weapon_type = WEAPON_TYPE.UNKNOWN;
    }

    damage_distance(): f32 { return this.m_damage_distance; }
}

export class VirtualWeaponSword extends VirtualWeapon {
    private m_damage_distance: f32
    private m_damage_spread: f32;

    constructor(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32,
                damage_distance: f32, damage_spread: f32) {
        super(attack_distance, attack_time, attack_cooldawn, shield, damage);
        this.m_damage_distance = damage_distance;
        this.m_damage_spread = damage_spread;

        this.m_weapon_type = WEAPON_TYPE.SWORD;
    }

    damage_distance(): f32 { return this.m_damage_distance; }
    damage_spread(): f32 { return this.m_damage_spread; }
}

export class VirtualWeaponBow extends VirtualWeapon {
    constructor(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32) {
        super(attack_distance, attack_time, attack_cooldawn, shield, damage);

        this.m_weapon_type = WEAPON_TYPE.BOW;
    }
}