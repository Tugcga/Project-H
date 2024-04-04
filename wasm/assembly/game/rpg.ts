import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";

import { DefaultWeapons } from "./settings";
import { WEAPON_TYPE, WEAPON_DAMAGE_TYPE, ACTOR, BULLET_TYPE } from "./constants"

import { EquipmentComponent } from "./components/inventar/equipment";
import { InventarWeaponTypeComponent } from "./components/inventar/type";
import { WeaponAttackDistanceComponent,
         WeaponAttackTimeComponent,
         WeaponAttackCooldawnComponent,
         WeaponDamageComponent,
         WeaponShieldeComponent,
         WeaponDamageSpreadComponent,
         WeaponDamageDistanceComponent,
         WeaponDamageSpeedComponent } from "./components/inventar/weapon";
import { ShieldComponent } from "./components/shield";
import { AtackTimeComponent } from "./components/atack_time";
import { AtackDistanceComponent } from "./components/atack_distance";
import { AttackCooldawnComponent } from "./components/attack_cooldawn";
import { DamageDistanceComponent,
         DamageSpreadComponent,
         DamageDamageComponent,
         DamageSpeedComponent,
         DamageBulletTypeComponent } from "./components/damage";
import { ActorTypeComponent } from "./components/actor_type";
import { WeaponDamageTypeComponent } from "./components/weapon_damage_type";

function get_item_shield(ecs: ECS, entity: Entity): f32 {
    const shield = ecs.get_component<WeaponShieldeComponent>(entity);
    if (shield) {
        return shield.value();
    } else {
        return 0.0;
    }
}

function get_item_attack_time(ecs: ECS, entity: Entity): f32 {
    const attack_time = ecs.get_component<WeaponAttackTimeComponent>(entity);
    if (attack_time) {
        return attack_time.value();
    } else {
        return Infinity;
    }
}

function get_item_attack_distance(ecs: ECS, entity: Entity): f32 {
    const attack_distance = ecs.get_component<WeaponAttackDistanceComponent>(entity);
    if (attack_distance) {
        return attack_distance.value();
    } else {
        return 0.0;
    }
}

function get_item_attack_cooldawn(ecs: ECS, entity: Entity): f32 {
    const attack_cooldawn = ecs.get_component<WeaponAttackCooldawnComponent>(entity);
    if (attack_cooldawn) {
        return attack_cooldawn.value();
    } else {
        return Infinity;
    }
}

function get_item_damage(ecs: ECS, entity: Entity): u32 {
    const damage = ecs.get_component<WeaponDamageComponent>(entity);
    if (damage) {
        return damage.value();
    } else {
        return 0;
    }
}

function get_item_distance(ecs: ECS, entity: Entity): f32 {
    const damage_distance = ecs.get_component<WeaponDamageDistanceComponent>(entity);
    if (damage_distance) {
        return damage_distance.value();
    } else {
        return 0.0;
    }
}

function get_item_spread(ecs: ECS, entity: Entity): f32 {
    const damage_spread = ecs.get_component<WeaponDamageSpreadComponent>(entity);
    if (damage_spread) {
        return damage_spread.value();
    } else {
        return 0.0;
    }
}

function get_item_bullet_speed(ecs: ECS, entity: Entity): f32 {
    const damage_speed = ecs.get_component<WeaponDamageSpeedComponent>(entity);
    if (damage_speed) {
        return damage_speed.value();
    } else {
        return 0.0;
    }
}

function define_shield(ecs: ECS, empty_value: f32, entity: Entity, equipment: EquipmentComponent): void {
    // define shield as sum of shields for main and secondary weapon
    // for empty weapon use default value
    const shield = ecs.get_component<ShieldComponent>(entity);

    if (shield) {
        if (equipment.is_main_weapon() || equipment.is_secondary_weapon()) {
            let value: f32 = 0.0;

            if (equipment.is_main_weapon()) {
                value += get_item_shield(ecs, equipment.get_main_weapon());
            }

            if (equipment.is_secondary_weapon()) {
                value += get_item_shield(ecs, equipment.get_secondary_weapon());
            }

            shield.define_max_value(value);
        } else {
            // empty weapon
            shield.define_max_value(empty_value);
        }        
    }
}

function define_attack_time(ecs: ECS, empty_value: f32, entity: Entity, equipment: EquipmentComponent): void {
    // attack time get only from main weapon
    // if it empty, then use default settings
    const attack_time = ecs.get_component<AtackTimeComponent>(entity);
    if (attack_time) {
        if (equipment.is_main_weapon()) {
            const main_weapon = equipment.get_main_weapon();
            attack_time.set_value(get_item_attack_time(ecs, main_weapon));
        } else {
            // no main weapon, use default
            attack_time.set_value(empty_value);
        }
    }
}

function define_attack_distance(ecs: ECS, empty_value: f32, entity: Entity, equipment: EquipmentComponent): void {
    const attack_distance = ecs.get_component<AtackDistanceComponent>(entity);
    if (attack_distance) {
        if (equipment.is_main_weapon()) {
            const main_weapon = equipment.get_main_weapon();
            attack_distance.set_value(get_item_attack_distance(ecs, main_weapon));
        } else {
            attack_distance.set_value(empty_value);
        }
    }
}

function define_attack_cooldawn(ecs: ECS, empty_value: f32, entity: Entity, equipment: EquipmentComponent): void {
    const attack_cooldawn = ecs.get_component<AttackCooldawnComponent>(entity);
    if (attack_cooldawn) {
        if (equipment.is_main_weapon()) {
            const main_weapon = equipment.get_main_weapon();
            attack_cooldawn.set_value(get_item_attack_cooldawn(ecs, main_weapon));
        } else {
            attack_cooldawn.set_value(empty_value);
        }
    }
}

// here we define all damage related properties from the weapon
function define_damage(ecs: ECS, entity: Entity, equipment: EquipmentComponent, default_weapons: DefaultWeapons): void {
    // remove from entity all damage component
    // and then add only required ones
    if (ecs.has_component<DamageDamageComponent>(entity)) {
        ecs.remove_component<DamageDamageComponent>(entity);
    }
    if (ecs.has_component<DamageDistanceComponent>(entity)) {
        ecs.remove_component<DamageDistanceComponent>(entity);
    }
    if (ecs.has_component<DamageSpreadComponent>(entity)) {
        ecs.remove_component<DamageSpreadComponent>(entity);
    }
    if (ecs.has_component<DamageSpeedComponent>(entity)) {
        ecs.remove_component<DamageSpeedComponent>(entity);
    }
    if (ecs.has_component<DamageBulletTypeComponent>(entity)) {
        ecs.remove_component<DamageBulletTypeComponent>(entity);
    }

    if (equipment.is_main_weapon()) {
        const main_weapon = equipment.get_main_weapon();
        // get weapon type
        const main_weapon_type = ecs.get_component<InventarWeaponTypeComponent>(main_weapon);
        if (main_weapon_type) {
            const main_weapon_type_value = main_weapon_type.type();
            if (main_weapon_type_value == WEAPON_TYPE.SWORD) {
                // define distance, damage and spread
                ecs.add_component(entity, new DamageDistanceComponent(get_item_distance(ecs, main_weapon)));
                ecs.add_component(entity, new DamageDamageComponent(get_item_damage(ecs, main_weapon)));
                ecs.add_component(entity, new DamageSpreadComponent(get_item_spread(ecs, main_weapon)));
            } else if (main_weapon_type_value == WEAPON_TYPE.BOW) {
                ecs.add_component(entity, new DamageSpeedComponent(get_item_bullet_speed(ecs, main_weapon)));
                ecs.add_component(entity, new DamageBulletTypeComponent(BULLET_TYPE.ARROW));
                ecs.add_component(entity, new DamageDamageComponent(get_item_damage(ecs, main_weapon)));
            } else {
                // unknown type of the main weapon
            }
        }
    } else {
        // weapon is empty
        // define only damage and distance parameters from default settings
        ecs.add_component(entity, new DamageDamageComponent(default_weapons.empty_weapon_damage));
        ecs.add_component(entity, new DamageDistanceComponent(default_weapons.empty_weapon_damage_distance));
    }
}

// recalculate entity parameters based on equipment, level, skills and so on
export function update_entity_parameters(ecs: ECS, entity: Entity, default_weapons: DefaultWeapons): void {
    // get equipment
    const equipment = ecs.get_component<EquipmentComponent>(entity);

    if (equipment) {
        define_shield(ecs, default_weapons.empty_weapon_shield, entity, equipment);
        define_attack_time(ecs, default_weapons.empty_weapon_attack_time, entity, equipment);
        define_attack_distance(ecs, default_weapons.empty_weapon_attack_distance, entity, equipment);
        define_attack_cooldawn(ecs, default_weapons.empty_weapon_attack_cooldawn, entity, equipment);

        // next damage properties
        define_damage(ecs, entity, equipment, default_weapons);
    }
}

// return true if the weapon is use two hands
export function is_weapon_doublehanded(type: WEAPON_TYPE): bool {
    if (type == WEAPON_TYPE.BOW) {
        return true;
    }

    return false;
}

// return is weapon is range (emit bullets) or not
// use equipment of the entity
export function get_weapon_damage_type(ecs: ECS, entity: Entity): WEAPON_DAMAGE_TYPE {
    // get actor type
    const actor = ecs.get_component<ActorTypeComponent>(entity);
    if (actor) {
        const actor_type = actor.type();
        if (actor_type == ACTOR.PLAYER) {
            // for player get equipment
            const equipment = ecs.get_component<EquipmentComponent>(entity);
            if (equipment) {
                if (equipment.is_main_weapon()) {
                    const main_weapon = equipment.get_main_weapon();
                    const main_weapon_type = ecs.get_component<InventarWeaponTypeComponent>(main_weapon);
                    if (main_weapon_type) {
                        const main_weapon_type_value = main_weapon_type.type();
                        if (main_weapon_type_value == WEAPON_TYPE.SWORD) {
                            return WEAPON_DAMAGE_TYPE.MELEE;
                        } else if (main_weapon_type_value == WEAPON_TYPE.BOW) {
                            return WEAPON_DAMAGE_TYPE.RANGE;
                        } else {
                            // unknown weapon type
                            return WEAPON_DAMAGE_TYPE.UNKNOWN;
                        }
                    } else {
                        return WEAPON_DAMAGE_TYPE.UNKNOWN;
                    }
                } else {
                    // weapon is empty
                    return WEAPON_DAMAGE_TYPE.EMPTY;
                }
            } else {
                return WEAPON_DAMAGE_TYPE.UNKNOWN;
            }
        } else if (actor_type == ACTOR.MONSTER) {
            // all mosnters contains special component which allows to define the weapon damage type
            const weapon_damage_type = ecs.get_component<WeaponDamageTypeComponent>(entity);
            if (weapon_damage_type) {
                return weapon_damage_type.type();
            } else {
                // no data component
                return WEAPON_DAMAGE_TYPE.UNKNOWN;
            }
        } else {
            // unknown actor
            return WEAPON_DAMAGE_TYPE.UNKNOWN;
        }
    }

    return WEAPON_DAMAGE_TYPE.UNKNOWN;
}

export function is_weapon_equiped(ecs: ECS, entity: Entity, weapon_type: WEAPON_TYPE): bool {
    const entity_equip = ecs.get_component<EquipmentComponent>(entity);
    if (entity_equip) {
        if (entity_equip.is_main_weapon()) {
            const entity_main_weapon = entity_equip.get_main_weapon();
            // get weapon type
            const entiy_weapon_type = ecs.get_component<InventarWeaponTypeComponent>(entity_main_weapon);
            if (entiy_weapon_type) {
                const weapon_type_value = entiy_weapon_type.type();
                if (weapon_type_value == weapon_type) {
                    return true;
                } else {
                    // another weapon type
                    return false;
                }
            } else {
                // component does not exist in the weapon entity, this is wrong
                return false;
            }
        } else {
            // no main weapon
            return false;
        }
    } else {
        // no equip
        return false;
    }
}