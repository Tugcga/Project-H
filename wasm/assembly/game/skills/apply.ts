import { ECS } from "../../simple_ecs/simple_ecs";
import { Entity } from "../../simple_ecs/types";

import { DAMAGE_TYPE, TARGET_ACTION, EPSILON, WEAPON_DAMAGE_TYPE } from "../constants";
import { distance } from "../utilities";

import { CastWeaponDamageComponent,
         CastShadowDamageComponent } from "../components/cast";
import { RadiusComponent } from "../components/radius";
import { PositionComponent } from "../components/position";
import { ApplyDamageComponent } from "../components/apply_damage";
import { HideModeComponent } from "../components/hide_mode";
import { EnemiesListComponent } from "../components/enemies_list";
import { TargetActionComponent } from "../components/target_action";
import { SpeedComponent } from "../components/speed";

import { NeighborhoodQuadGridTrackingSystem } from "../systems/neighborhood_quad_grid_tracking";
import { SearchEnemiesSystem } from "../systems/search_enemies"

import { external_entity_switch_hide } from "../../external";


export function apply_melee_attack(ecs: ECS, entity: Entity, cast_duration: f32, tracking_system: NeighborhoodQuadGridTrackingSystem): void {
    const cast_melee: CastWeaponDamageComponent | null = ecs.get_component<CastWeaponDamageComponent>(entity);
    const position = ecs.get_component<PositionComponent>(entity);
    if (cast_melee && position) {
        const cast_melee_weapon_type = cast_melee.weapon_type();
        if (cast_melee_weapon_type == WEAPON_DAMAGE_TYPE.MELEE) {
            const cast_target = cast_melee.target();
            const target_position: PositionComponent | null = ecs.get_component<PositionComponent>(cast_target);
            if (target_position) {
                const position_x = position.x();
                const position_y = position.y();
                // find direction to the target
                let to_target_x = target_position.x() - position_x;
                let to_target_y = target_position.y() - position_y;
                // normalize
                const to_target_length = Mathf.sqrt(to_target_x * to_target_x + to_target_y * to_target_y);
                if (to_target_length > EPSILON) {
                    to_target_x /= to_target_length;
                    to_target_y /= to_target_length;
                }

                const melee_damage = cast_melee.damage();
                const melee_spread = cast_melee.spread();
                const melee_distance = cast_melee.distance();
                const spread_limit = Mathf.cos(melee_spread / 2.0);
                // we should find all close entities
                // for melee attack we get entities from current attacker position
                const closed_entities = tracking_system.get_items_from_position(position_x, position_y);
                for (let j = 0, j_len = closed_entities.length; j < j_len; j++) {
                    const neigh_entity = closed_entities[j];
                    if (neigh_entity != entity) {
                        const neigh_entity_position: PositionComponent | null = ecs.get_component<PositionComponent>(neigh_entity);
                        const neigh_entity_radius: RadiusComponent | null = ecs.get_component<RadiusComponent>(neigh_entity);
                        if (neigh_entity_position && neigh_entity_radius) {
                            const neigh_entity_radius_value = neigh_entity_radius.value();
                            // find to entity vector
                            let to_x = neigh_entity_position.x() - position_x;
                            let to_y = neigh_entity_position.y() - position_y;
                            // normalize
                            const to_length = Mathf.sqrt(to_x * to_x + to_y * to_y);
                            if (to_length > EPSILON) {
                                to_x /= to_length;
                                to_y /= to_length;
                            }

                            // calculate dot-product between to target and to entity vectors
                            const to_entity_dot = to_x * to_target_x + to_y * to_target_y;
                            // if this product is greater than cos(spread / 2), then entity in the cone
                            if ((to_entity_dot >= spread_limit) && (to_length <= melee_distance + neigh_entity_radius_value)) {
                                // entity inside the cone
                                // add damage component
                                const neigh_entity_damage: ApplyDamageComponent | null = ecs.get_component<ApplyDamageComponent>(neigh_entity);
                                if (neigh_entity_damage) {
                                    neigh_entity_damage.extend(entity, melee_damage, DAMAGE_TYPE.MELEE, cast_duration);
                                } else {
                                    ecs.add_component<ApplyDamageComponent>(neigh_entity, new ApplyDamageComponent(entity, melee_damage, DAMAGE_TYPE.MELEE, cast_duration));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// common function for shadow and hand attack (because both of them use only damage distance)
function apply_one_target_damage(ecs: ECS, entity: Entity, target_entity: Entity,
                                 position_x: f32, position_y: f32, damage_distance: f32,
                                 damage_value: u32, damage_type: DAMAGE_TYPE, cast_duration: f32): void {
    const target_position = ecs.get_component<PositionComponent>(target_entity);
    const target_radius = ecs.get_component<RadiusComponent>(target_entity);
    if (target_position && target_radius) {
        const target_pos_x = target_position.x();
        const target_pos_y = target_position.y();
        const d = distance(position_x, position_y, target_pos_x, target_pos_y);

        if (d < damage_distance + target_radius.value()) {
            const target_apply_damage: ApplyDamageComponent | null = ecs.get_component<ApplyDamageComponent>(target_entity);
            if (target_apply_damage) {
                target_apply_damage.extend(entity, damage_value, damage_type, cast_duration);
            } else {
                ecs.add_component<ApplyDamageComponent>(target_entity, new ApplyDamageComponent(entity, damage_value, damage_type, cast_duration));
            }
        }
    }
}

export function apply_hand_attack(ecs: ECS, entity: Entity, cast_duration: f32): void {
    const cast_weapon: CastWeaponDamageComponent | null = ecs.get_component<CastWeaponDamageComponent>(entity);
    const position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
    if (position && cast_weapon) {
        const cast_weapon_type = cast_weapon.weapon_type();
        if (cast_weapon_type == WEAPON_DAMAGE_TYPE.EMPTY) {
            const target_entity = cast_weapon.target();
            const damage_distance = cast_weapon.distance();
            const damage = cast_weapon.damage();
            const position_x = position.x();
            const position_y = position.y();

            apply_one_target_damage(ecs, entity, target_entity, position_x, position_y, damage_distance, damage, DAMAGE_TYPE.MELEE, cast_duration);
        }
    }
}

export function apply_hide(ecs: ECS, entity: Entity): void {
    const hide_mode: HideModeComponent | null = ecs.get_component<HideModeComponent>(entity);
    if (hide_mode) {
        hide_mode.activate();

        // remove this entity from the enemies list for all search enemies
        // also if it contains active target action, then reset it
        const search_entities = ecs.get_entities<SearchEnemiesSystem>();
        for (let i = 0, len = search_entities.length; i < len; i++) {
            const search_entity = search_entities[i];
            const search_list = ecs.get_component<EnemiesListComponent>(search_entity);
            const target_action = ecs.get_component<TargetActionComponent>(search_entity);
            if (search_list && target_action) {
                search_list.remove_target(entity);

                const action_type = target_action.type();
                const action_entity = target_action.entity();
                if (action_entity == entity && action_type != TARGET_ACTION.NONE) {
                    target_action.reset();
                }
            }
        }

        // change the move speed
        const speed_multiplier = hide_mode.speed_multiplier();
        const speed: SpeedComponent | null = ecs.get_component<SpeedComponent>(entity);
        if (speed) {
            const speed_value = speed.value();
            speed.set_value(speed_value * speed_multiplier);
        }

        external_entity_switch_hide(entity, true);
    }
}

export function apply_shadow_attack(ecs: ECS, entity: Entity): void {
    const cast_shadow: CastShadowDamageComponent | null = ecs.get_component<CastShadowDamageComponent>(entity);
    const position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
    if (position && cast_shadow) {
        const target_entity = cast_shadow.target();
        const damage_distance = cast_shadow.distance();
        const position_x = position.x();
        const position_y = position.y();

        apply_one_target_damage(ecs, entity, target_entity, position_x, position_y, damage_distance, 0, DAMAGE_TYPE.ULTIMATE, 0.0);

        ecs.remove_component<CastShadowDamageComponent>(entity);
    }
}