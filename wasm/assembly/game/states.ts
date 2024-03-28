import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";

import { CAST_ACTION, COOLDAWN, START_CAST_STATUS, STATE, TARGET_ACTION, UPDATE_TARGET_ACTION_STATUS } from "./constants";
import { distance } from "./utilities";

import { PositionComponent } from "./components/position";
import { RadiusComponent } from "./components/radius";
import { StateComponent, 
         StateWalkToPointComponent,
         StateShiftComponent,
         StateCastComponent,
         StateShieldComponent,
         StateStunComponent } from "./components/state";
import { TargetActionComponent } from "./components/target_action";
import { AtackDistanceComponent } from "./components/atack_distance";
import { MeleeAttackCooldawnComponent } from "./components/melee_attack_cooldawn";
import { MeleeDamageDistanceComponent,
         MeleeDamageSpreadComponent,
         MeleeDamageDamageComponent,
         ShadowDamageDistanceComponent } from "./components/damage";
import { CastMeleeDamageComponent,
         CastShadowDamageComponent } from "./components/cast";
import { HideModeComponent } from "./components/hide_mode";
import { ShadowAttackCooldawnComponent } from "./components/shadow_attack_cooldawn";

import { BuffMeleeAttackCooldawnComponent,
         BuffHideCooldawnComponent,
         BuffShadowAttackCooldawnComponent } from "./skills/buffs";

import { external_entity_start_melee_attack,
         external_entity_finish_melee_attack,
         external_entity_start_shadow_attack,
         external_entity_finish_shadow_attack,
         external_entity_start_cooldawn,
         external_entity_release_shield,
         external_entity_finish_hide } from "../external";

export function clear_state_components(ecs: ECS, state_value: STATE, entity: Entity): void {
    if (state_value == STATE.WALK_TO_POINT) {
        ecs.remove_component<StateWalkToPointComponent>(entity);
    } else if (state_value == STATE.SHIFTING) {
        ecs.remove_component<StateShiftComponent>(entity);
    } else if (state_value == STATE.CASTING) {
        ecs.remove_component<StateCastComponent>(entity);
    } else if (state_value == STATE.SHIELD) {
        ecs.remove_component<StateShieldComponent>(entity);
    } else if(state_value == STATE.STUN) {
        ecs.remove_component<StateStunComponent>(entity);
    }
}

export function assign_cast_state(ecs: ECS,
                           entity: Entity,
                           cast_time: f32,
                           state: StateComponent,
                           cast_type: CAST_ACTION): START_CAST_STATUS {
    if (cast_type == CAST_ACTION.MELEE_ATTACK) {
        // check is there exist buff cooldawn
        const buff_melee: BuffMeleeAttackCooldawnComponent | null = ecs.get_component<BuffMeleeAttackCooldawnComponent>(entity);
        if (buff_melee) {
            // component exists, cooldawn is not over, fail to start the cast
            return START_CAST_STATUS.FAIL_COOLDAWN;
        }
    } else if (cast_type == CAST_ACTION.HIDE_ACTIVATION) {
        const buff_hide: BuffHideCooldawnComponent | null = ecs.get_component<BuffHideCooldawnComponent>(entity);
        if (buff_hide) {
            return START_CAST_STATUS.FAIL_COOLDAWN;
        }
    } else if (cast_type == CAST_ACTION.SHADOW_ATTACK) {
        const buff_shadow: BuffShadowAttackCooldawnComponent | null = ecs.get_component<BuffShadowAttackCooldawnComponent>(entity);
        if (buff_shadow) {
            return START_CAST_STATUS.FAIL_COOLDAWN;
        }
    } else if (cast_type == CAST_ACTION.RANGE_ATTACK) {
        return START_CAST_STATUS.FAIL_WRONG_CAST;
    } else {
        return START_CAST_STATUS.FAIL_WRONG_CAST;
    }

    ecs.add_component(entity, new StateCastComponent(cast_type, cast_time));
    state.set_state(STATE.CASTING);
    return START_CAST_STATUS.OK;
}

function check_attack_condition(ecs: ECS,
                                entity: Entity,
                                target_entity: Entity,
                                cast_time: f32,
                                cast_action: CAST_ACTION): START_CAST_STATUS {
    const entity_state = ecs.get_component<StateComponent>(entity);
    const entity_position = ecs.get_component<PositionComponent>(entity);
    const entity_attack_distance = ecs.get_component<AtackDistanceComponent>(entity);

    const target_position = ecs.get_component<PositionComponent>(target_entity);
    const target_state = ecs.get_component<StateComponent>(target_entity);
    const target_radius = ecs.get_component<RadiusComponent>(target_entity);

    if (entity_state && entity_position && entity_attack_distance &&
        target_position && target_state && target_radius) {
        const entity_state_value = entity_state.state();
        if (entity_state_value == STATE.SHIFTING ||
            entity_state_value == STATE.CASTING ||
            entity_state_value == STATE.SHIELD ||
            entity_state_value == STATE.DEAD ||
            entity_state_value == STATE.STUN) {
            return START_CAST_STATUS.FAIL_FORBIDDEN;
        }

        // calculate the distance from entity to the target
        const to_target_distance = distance(entity_position.x(), entity_position.y(), target_position.x(), target_position.y());
        const distance_limit = entity_attack_distance.value() + target_radius.value();
        // here we use target action = attack, so, check the distance with attack distance value
        // for other action (talk or use item, use another distance value)
        if (to_target_distance < distance_limit && target_state.state() != STATE.SHIFTING) {
            // come to the active cast distance
            // we should delete the walk state and assign cast state
            const cast_state: START_CAST_STATUS = assign_cast_state(ecs, entity, cast_time, entity_state, cast_action);

            return cast_state;
        }  else {
            return START_CAST_STATUS.FAIL_DISTANCE;
        }
    } else {
        return START_CAST_STATUS.FAIL;
    }
}

function post_check_melee_attack(ecs: ECS,
                                 entity: Entity,
                                 target_entity: Entity,
                                 attack_time_value: f32): boolean {
    const entity_target_action = ecs.get_component<TargetActionComponent>(entity);
    const damage_distance = ecs.get_component<MeleeDamageDistanceComponent>(entity);
    const damage_spread = ecs.get_component<MeleeDamageSpreadComponent>(entity);
    const damage_damage = ecs.get_component<MeleeDamageDamageComponent>(entity);

    if (entity_target_action && damage_distance && damage_spread && damage_damage) {
        // ready to start cast
        // make target action = None
        entity_target_action.reset();
        const damage_distance_value = damage_distance.value();
        const damage_spread_value = damage_spread.value();
        const damage_damage_value = damage_damage.value();
        external_entity_start_melee_attack(entity, attack_time_value, damage_distance_value, damage_spread_value);
        // add component with post-cast data
        ecs.add_component(entity, new CastMeleeDamageComponent(target_entity, damage_distance_value, damage_spread_value, damage_damage_value));

        // add melee cooldawn
        const melee_cooldawn: MeleeAttackCooldawnComponent | null = ecs.get_component<MeleeAttackCooldawnComponent>(entity);
        if (melee_cooldawn) {
            const melee_cooldawn_value = melee_cooldawn.value();
            ecs.add_component(entity, new BuffMeleeAttackCooldawnComponent(melee_cooldawn_value));
            external_entity_start_cooldawn(entity, COOLDAWN.MELEE_ATTACK, melee_cooldawn_value);
        }

        return true;
    }

    return false;
}

function post_check_shadow_attack(ecs: ECS,
                                  entity: Entity,
                                  target_entity: Entity,
                                  attack_time_value: f32): boolean {
    const entity_target_action = ecs.get_component<TargetActionComponent>(entity);
    const entity_shadow_damage_distance = ecs.get_component<ShadowDamageDistanceComponent>(entity);
    if (entity_target_action && entity_shadow_damage_distance) {
        const entity_shadow_damage_distance_value = entity_shadow_damage_distance.value();

        entity_target_action.reset();
        external_entity_start_shadow_attack(entity, attack_time_value, entity_shadow_damage_distance_value);
        // here we does not require additional component
        ecs.add_component(entity, new CastShadowDamageComponent(target_entity, entity_shadow_damage_distance_value));

        const shadow_cooldawn: ShadowAttackCooldawnComponent | null = ecs.get_component<ShadowAttackCooldawnComponent>(entity);
        if (shadow_cooldawn) {
            const shadow_cooldawn_value = shadow_cooldawn.value();
            ecs.add_component(entity, new BuffShadowAttackCooldawnComponent(shadow_cooldawn_value));
            external_entity_start_cooldawn(entity, COOLDAWN.SHADOW_ATTACK, shadow_cooldawn_value);
        }

        return true;
    }

    return false;
}

export function try_start_melee_attack(ecs: ECS, entity: Entity, target_entity: Entity, attack_time_value: f32): START_CAST_STATUS {
    const cast_state = check_attack_condition(ecs, entity, target_entity, attack_time_value, CAST_ACTION.MELEE_ATTACK);

    if (cast_state == START_CAST_STATUS.OK) {
        const is_success = post_check_melee_attack(ecs, entity, target_entity, attack_time_value);

        if (is_success) {
            return START_CAST_STATUS.OK;
        } else {
            return START_CAST_STATUS.FAIL;
        }
    } else {
        return cast_state;
    }
}

export function try_start_shadow_attack(ecs: ECS, entity: Entity, target_entity: Entity, attack_time_value: f32): START_CAST_STATUS {
    const cast_state = check_attack_condition(ecs, entity, target_entity, attack_time_value, CAST_ACTION.SHADOW_ATTACK);

    if (cast_state == START_CAST_STATUS.OK) {
        const is_success = post_check_shadow_attack(ecs, entity, target_entity, attack_time_value);

        if (is_success) {
            return START_CAST_STATUS.OK;
        } else {
            return START_CAST_STATUS.FAIL;
        }
    } else {
        return cast_state;
    }
}

export function is_entity_in_hide(ecs: ECS, entity: Entity): boolean {
    const hide_mode: HideModeComponent | null = ecs.get_component<HideModeComponent>(entity);
    if (hide_mode) {
        return hide_mode.is_active();
    } else {
        // entity does not contains hide mode component
        return false;
    }
}


// return true if correctly switch to iddle
// false if something is not ok
export function interrupt_to_iddle(ecs: ECS, entity: Entity, entity_state: StateComponent): boolean {
    const state_value = entity_state.state();
    if (state_value == STATE.IDDLE) {
        // nothing to do
        // start as usual
    } else if (state_value == STATE.WALK_TO_POINT) {
        // switch to iddle
        entity_state.set_state(STATE.IDDLE);  // iddle does not required any additional component
        clear_state_components(ecs, STATE.WALK_TO_POINT, entity);
    } else if (state_value == STATE.SHIFTING) {
        // under shift we can not do anything
        return false;
    } else if (state_value == STATE.CASTING) {
        // get casting component
        const entity_cast: StateCastComponent | null = ecs.get_component<StateCastComponent>(entity);
        if (entity_cast) {
            const entity_cast_type = entity_cast.type();
            if (entity_cast_type == CAST_ACTION.MELEE_ATTACK) {
                ecs.remove_component<CastMeleeDamageComponent>(entity);
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);

                // notify client about cast interruption
                external_entity_finish_melee_attack(entity, true);
            } else if (entity_cast_type == CAST_ACTION.HIDE_ACTIVATION) {
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);
                external_entity_finish_hide(entity, true);
            } else if (entity_cast_type == CAST_ACTION.SHADOW_ATTACK) {
                ecs.remove_component<CastShadowDamageComponent>(entity);
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);
                external_entity_finish_shadow_attack(entity, true);
            } else if (entity_cast_type == CAST_ACTION.RANGE_ATTACK) {
                // unsupported for now
                return false;
            } else {
                // unsupported cast type

                return false;
            }
        } else {
            // cast component is invalid
            // something wrong
            return false;
        }
    } else if (state_value == STATE.SHIELD) {
        entity_state.set_state(STATE.IDDLE);
        clear_state_components(ecs, STATE.SHIELD, entity);
        external_entity_release_shield(entity);
    } else if (state_value == STATE.DEAD) {
        // fail to switch dead state to iddle
        return false;
    } else if (state_value == STATE.STUN) {
        return false;
    } else {
        // unknown state
        return false;
    }

    return true;
}

export function should_redefine_target_action(ecs: ECS, entity: Entity, target_entity: Entity, entity_target_action: TargetActionComponent, entity_state_value: STATE): UPDATE_TARGET_ACTION_STATUS {
    // check what entity is doing
    if (entity_state_value == STATE.WALK_TO_POINT) {
        if (entity_target_action.type() == TARGET_ACTION.ATTACK) {
            if (entity_target_action.entity() == target_entity) {
                // it already goes to the same target, nothing to do
                return UPDATE_TARGET_ACTION_STATUS.NO;
            } else {
                // another target
                return UPDATE_TARGET_ACTION_STATUS.YES;
            }
        } else {
            // entity simply goes to the point, action is NONE
            return UPDATE_TARGET_ACTION_STATUS.YES;
        }
    } else if (entity_state_value == STATE.SHIFTING) {
        // forbidden do anything
        return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
    } else if (entity_state_value == STATE.CASTING) {
        const entity_cast: StateCastComponent | null = ecs.get_component<StateCastComponent>(entity);
        if (entity_cast) {
            // what type of the cast and what is target
            if (entity_cast.type() == CAST_ACTION.MELEE_ATTACK) {
                const entity_cast_melee: CastMeleeDamageComponent | null = ecs.get_component<CastMeleeDamageComponent>(entity);
                if (entity_cast_melee) {
                    if (entity_cast_melee.target() == target_entity) {
                        // already make melee cast to the same entity, nothing to do
                        UPDATE_TARGET_ACTION_STATUS.NO;
                    } else {
                        // another target, interrupt it
                        return UPDATE_TARGET_ACTION_STATUS.YES;
                    }
                } else {
                    // something wrong, cast is melee attack but there is no component
                    return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
                }
            } else if (entity_cast.type() == CAST_ACTION.HIDE_ACTIVATION) {
                // currently cast hide activation, interrupt it
                return UPDATE_TARGET_ACTION_STATUS.YES;
            } else if (entity_cast.type() == CAST_ACTION.RANGE_ATTACK) {
                // is not supported yet
                return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
            } else if (entity_cast.type() == CAST_ACTION.SHADOW_ATTACK) {
                // TODO: check the target, and if it the same, nothing to do
                return UPDATE_TARGET_ACTION_STATUS.YES;
            } else {
                // unknown type of cast action
                return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
            }
        } else {
            // something wrong, no cast component (but state is CAST)
            return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
        }
    } else if (entity_state_value == STATE.SHIELD) {
        // from shield we can start move action
        return UPDATE_TARGET_ACTION_STATUS.YES;
    } else if (entity_state_value == STATE.STUN) {
        // forbidden to start move at stun state
        return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
    } else {
        // iddle state
        return UPDATE_TARGET_ACTION_STATUS.YES;
    }

    return UPDATE_TARGET_ACTION_STATUS.YES;
}
