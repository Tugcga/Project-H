import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";

import { ASSERT_ERRORS, CAST_ACTION, COOLDAWN, START_CAST_STATUS, STATE, TARGET_ACTION, UPDATE_TARGET_ACTION_STATUS, WEAPON_DAMAGE_TYPE, BULLET_TYPE } from "./constants";
import { distance } from "./utilities";

import { PositionComponent } from "./components/position";
import { RadiusComponent,
         RadiusSelectComponent } from "./components/radius";
import { StateComponent, 
         StateWalkToPointComponent,
         StateShiftComponent,
         StateCastComponent,
         StateShieldComponent,
         StateStunComponent } from "./components/state";
import { TargetActionComponent } from "./components/target_action";
import { AtackDistanceComponent } from "./components/atack_distance";
import { AttackCooldawnComponent } from "./components/attack_cooldawn";
import { DamageDistanceComponent,
         DamageSpreadComponent,
         DamageDamageComponent,
         DamageSpeedComponent,
         DamageBulletTypeComponent,
         ShadowDamageDistanceComponent } from "./components/damage";
import { CastMeleeDamageComponent,
         CastShadowDamageComponent,
         CastRangeDamageComponent } from "./components/cast";
import { HideModeComponent } from "./components/hide_mode";
import { ShadowAttackCooldawnComponent } from "./components/shadow_attack_cooldawn";
import { ShadowAttackDistanceComponent } from "./components/shadow_attack_distance";
import { ShadowAttackTimeComponent } from "./components/shadow_attack_time";
import { LifeComponent } from "./components/life";
import { ShieldComponent } from "./components/shield";
import { AtackTimeComponent } from "./components/atack_time";
import { DeadComponent } from "./components/tags";

import { BuffMeleeAttackCooldawnComponent,
         BuffRangeAttackCooldawnComponent,
         BuffHandAttackCooldawnComponent,
         BuffHideCooldawnComponent,
         BuffShadowAttackCooldawnComponent } from "./skills/buffs";
import { get_weapon_damage_type } from "./rpg";

import { external_entity_start_melee_attack,
         external_entity_finish_melee_attack,
         external_entity_start_range_attack,
         external_entity_finish_range_attack,
         external_entity_start_hand_attack,
         external_entity_finish_hand_attack,
         external_entity_start_shadow_attack,
         external_entity_finish_shadow_attack,
         external_entity_start_cooldawn,
         external_entity_release_shield,
         external_entity_finish_hide,
         external_update_entity_params,
         external_entity_resurrect } from "../external";

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
    } else if (state_value == STATE.DEAD) {
        ecs.remove_component<DeadComponent>(entity);
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
    } else if (cast_type == CAST_ACTION.HANDS_ATTACK) {
        const buff_hand: BuffHandAttackCooldawnComponent | null = ecs.get_component<BuffHandAttackCooldawnComponent>(entity);
        if (buff_hand) {
            return START_CAST_STATUS.FAIL_COOLDAWN;
        }
    } else if (cast_type == CAST_ACTION.RANGE_ATTACK) {
        const buff_range: BuffRangeAttackCooldawnComponent | null = ecs.get_component<BuffRangeAttackCooldawnComponent>(entity);
        if (buff_range) {
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
    } else {
        assert(!ASSERT_ERRORS, "assign_cast_state -> unknown cast action " + cast_type.toString());
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
                                attack_distance: f32,
                                cast_action: CAST_ACTION): START_CAST_STATUS {
    const entity_state = ecs.get_component<StateComponent>(entity);
    const entity_position = ecs.get_component<PositionComponent>(entity);

    const target_position = ecs.get_component<PositionComponent>(target_entity);
    const target_state = ecs.get_component<StateComponent>(target_entity);
    const target_radius = ecs.get_component<RadiusComponent>(target_entity);

    if (entity_state && entity_position && target_position && target_state && target_radius) {
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
        const distance_limit = attack_distance + target_radius.value();
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
        assert(!ASSERT_ERRORS, "check_attack_condition -> entity does not contains required components: StateComponent, PositionComponent. Target does not contains required components: PositionComponent, StateComponent, RadiusComponent");
        return START_CAST_STATUS.FAIL;
    }
}

function post_check_melee_attack(ecs: ECS,
                                 entity: Entity,
                                 target_entity: Entity,
                                 attack_time_value: f32): boolean {
    const entity_target_action = ecs.get_component<TargetActionComponent>(entity);

    // each melee weapon (like sword) should contains all these three components
    const damage_distance = ecs.get_component<DamageDistanceComponent>(entity);
    const damage_spread = ecs.get_component<DamageSpreadComponent>(entity);
    const damage_damage = ecs.get_component<DamageDamageComponent>(entity);

    if (entity_target_action && damage_distance && damage_spread && damage_damage) {
        // ready to start cast
        // make target action = None
        entity_target_action.reset();
        const damage_distance_value = damage_distance.value();
        const damage_spread_value = damage_spread.value();
        const damage_damage_value = damage_damage.value();
        external_entity_start_melee_attack(entity, attack_time_value, damage_distance_value, damage_spread_value);
        // add component with post-cast data
        ecs.add_component(entity, new CastMeleeDamageComponent(target_entity, damage_distance_value, damage_spread_value, damage_damage_value, WEAPON_DAMAGE_TYPE.MELEE));

        // add melee cooldawn
        const attack_cooldawn: AttackCooldawnComponent | null = ecs.get_component<AttackCooldawnComponent>(entity);
        if (attack_cooldawn) {
            const attack_cooldawn_value = attack_cooldawn.value();
            ecs.add_component(entity, new BuffMeleeAttackCooldawnComponent(attack_cooldawn_value));
            external_entity_start_cooldawn(entity, COOLDAWN.MELEE_ATTACK, attack_cooldawn_value);
        } else {
            assert(!ASSERT_ERRORS, "post_check_melee_attack -> entity does not contains AttackCooldawnComponent");
        }

        return true;
    } else {
        assert(!ASSERT_ERRORS, "post_check_melee_attack -> entity does not contains required components: TargetActionComponent, DamageDistanceComponent, DamageSpreadComponent, DamageDamageComponent");
    }

    return false;
}

function post_check_range_attack(ecs: ECS,
                                 entity: Entity,
                                 target_entity: Entity,
                                 attack_time_value: f32): boolean {
    const entity_target_action = ecs.get_component<TargetActionComponent>(entity);
    
    // range attack require only damage component
    const damage_damage = ecs.get_component<DamageDamageComponent>(entity);
    const damage_speed = ecs.get_component<DamageSpeedComponent>(entity);
    const damage_bullet_type = ecs.get_component<DamageBulletTypeComponent>(entity);
    if (entity_target_action && damage_damage && damage_speed && damage_bullet_type) {
        entity_target_action.reset();
        const damage_damage_value = damage_damage.value();
        const damage_speed_value = damage_speed.value();

        external_entity_start_range_attack(entity, attack_time_value);
        ecs.add_component(entity, new CastRangeDamageComponent(target_entity, damage_damage_value, damage_speed_value, damage_bullet_type.type(), WEAPON_DAMAGE_TYPE.RANGE));

        const attack_cooldawn: AttackCooldawnComponent | null = ecs.get_component<AttackCooldawnComponent>(entity);
        if (attack_cooldawn) {
            const attack_cooldawn_value = attack_cooldawn.value();
            ecs.add_component<BuffRangeAttackCooldawnComponent>(entity, new BuffRangeAttackCooldawnComponent(attack_cooldawn_value));
            external_entity_start_cooldawn(entity, COOLDAWN.RANGE_ATTACK, attack_cooldawn_value);
        } else {
            assert(!ASSERT_ERRORS, "post_check_range_attack -> entity does not contains AttackCooldawnComponent");
        }

        return true;
    } else {
        assert(!ASSERT_ERRORS, "post_check_range_attack -> entity does not contains DamageDamageComponent");
    }

    return false;
}

function post_check_hands_attack(ecs: ECS,
                                 entity: Entity,
                                 target_entity: Entity,
                                 attack_time_value: f32): boolean {
    const entity_target_action = ecs.get_component<TargetActionComponent>(entity);
    
    // hand attack require damage and distance component
    const damage_damage = ecs.get_component<DamageDamageComponent>(entity);
    const damage_distance = ecs.get_component<DamageDistanceComponent>(entity);
    if (entity_target_action && damage_damage && damage_distance) {
        entity_target_action.reset();
        const damage_damage_value = damage_damage.value();
        const damage_distance_value = damage_distance.value();

        external_entity_start_hand_attack(entity, attack_time_value, damage_distance_value);
        ecs.add_component(entity, new CastMeleeDamageComponent(target_entity, damage_distance_value, 0.0, damage_damage_value, WEAPON_DAMAGE_TYPE.EMPTY));

        const attack_cooldawn: AttackCooldawnComponent | null = ecs.get_component<AttackCooldawnComponent>(entity);
        if (attack_cooldawn) {
            const attack_cooldawn_value = attack_cooldawn.value();
            ecs.add_component<BuffHandAttackCooldawnComponent>(entity, new BuffHandAttackCooldawnComponent(attack_cooldawn_value));
            external_entity_start_cooldawn(entity, COOLDAWN.HAND_ATTACK, attack_cooldawn_value);
        } else {
            assert(!ASSERT_ERRORS, "post_check_hands_attack -> entity does not contains AttackCooldawnComponent");
        }

        return true;
    } else {
        assert(!ASSERT_ERRORS, "post_check_hands_attack -> entity does not contains required components: TargetActionComponent, DamageDamageComponent, DamageDistanceComponent");
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
        } else {
            assert(!ASSERT_ERRORS, "post_check_shadow_attack -> entity does not contains ShadowAttackCooldawnComponent");
        }

        return true;
    } else {
        assert(!ASSERT_ERRORS, "post_check_shadow_attack -> entity does not contains required components: TargetActionComponent, ShadowDamageDistanceComponent");
    }

    return false;
}

export function try_start_weapon_attack(ecs: ECS, entity: Entity, target_entity: Entity, attack_time_value: f32): START_CAST_STATUS {
    // we should check is the equiped weapon is ranged or not
    const weapon_damage_type = get_weapon_damage_type(ecs, entity);
    if (weapon_damage_type == WEAPON_DAMAGE_TYPE.UNKNOWN) {
        return START_CAST_STATUS.FAIL;
    } else {
        const attack_distance = ecs.get_component<AtackDistanceComponent>(entity);

        if (attack_distance) {
            const cast_state = check_attack_condition(ecs, entity, target_entity, attack_time_value, attack_distance.value(), 
                                                      weapon_damage_type == WEAPON_DAMAGE_TYPE.MELEE ? CAST_ACTION.MELEE_ATTACK : 
                                                     (weapon_damage_type == WEAPON_DAMAGE_TYPE.RANGE ? CAST_ACTION.RANGE_ATTACK : CAST_ACTION.HANDS_ATTACK));

            if (cast_state == START_CAST_STATUS.OK) {
                const is_success = weapon_damage_type == WEAPON_DAMAGE_TYPE.MELEE ?
                                   post_check_melee_attack(ecs, entity, target_entity, attack_time_value) :
                                  (weapon_damage_type == WEAPON_DAMAGE_TYPE.RANGE ? post_check_range_attack(ecs, entity, target_entity, attack_time_value) : post_check_hands_attack(ecs, entity, target_entity, attack_time_value));

                if (is_success) {
                    return START_CAST_STATUS.OK;
                } else {
                    return START_CAST_STATUS.FAIL;
                }
            } else {
                return cast_state;
            }
        } else {
            assert(!ASSERT_ERRORS, "try_start_weapon_attack -> entity does not contains AtackDistanceComponent");
            return START_CAST_STATUS.FAIL;
        }
    }

    return START_CAST_STATUS.FAIL;
}

export function try_start_shadow_attack(ecs: ECS, entity: Entity, target_entity: Entity, attack_time_value: f32): START_CAST_STATUS {
    // get attack distance value
    // for shadow mode from shadow component
    const shadow_attack_distance = ecs.get_component<ShadowAttackDistanceComponent>(entity);
    if (shadow_attack_distance) {
        const cast_state = check_attack_condition(ecs, entity, target_entity, attack_time_value, shadow_attack_distance.value(), CAST_ACTION.SHADOW_ATTACK);

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
    } else {
        assert(!ASSERT_ERRORS, "try_start_shadow_attack -> entity does not contains ShadowAttackDistanceComponent");
        START_CAST_STATUS.FAIL;
    }

    return START_CAST_STATUS.FAIL;
}

export function is_entity_in_hide(ecs: ECS, entity: Entity): boolean {
    const hide_mode: HideModeComponent | null = ecs.get_component<HideModeComponent>(entity);
    if (hide_mode) {
        return hide_mode.is_active();
    } else {
        // entity does not contains hide mode component
        assert(!ASSERT_ERRORS, "is_entity_in_hide -> entity does not contains HideModeComponent");
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
            if (entity_cast_type == CAST_ACTION.MELEE_ATTACK || 
                entity_cast_type == CAST_ACTION.HANDS_ATTACK) {
                ecs.remove_component<CastMeleeDamageComponent>(entity);
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);

                // notify client about cast interruption
                if (entity_cast_type == CAST_ACTION.MELEE_ATTACK) {
                    external_entity_finish_melee_attack(entity, true);
                } else if (entity_cast_type == CAST_ACTION.HANDS_ATTACK) {
                    external_entity_finish_hand_attack(entity, true);
                }
            } else if (entity_cast_type == CAST_ACTION.RANGE_ATTACK) {
                ecs.remove_component<CastRangeDamageComponent>(entity);
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);

                external_entity_finish_range_attack(entity, true);
            } else if (entity_cast_type == CAST_ACTION.HIDE_ACTIVATION) {
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);
                external_entity_finish_hide(entity, true);
            } else if (entity_cast_type == CAST_ACTION.SHADOW_ATTACK) {
                ecs.remove_component<CastShadowDamageComponent>(entity);
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);
                external_entity_finish_shadow_attack(entity, true);
            } else {
                assert(!ASSERT_ERRORS, "interrupt_to_iddle -> unknown CAST_ACTION = " + entity_cast_type.toString());
                // unsupported cast type
                return false;
            }
        } else {
            assert(!ASSERT_ERRORS, "interrupt_to_iddle -> entity in CASTING state but does not contains StateCastComponent");
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
        assert(!ASSERT_ERRORS, "interrupt_to_iddle -> unknown state = " + state_value.toString());
        return false;
    }

    return true;
}

export function resurrect(ecs: ECS, entity: Entity): void {
    const state = ecs.get_component<StateComponent>(entity);
    if (state) {
        clear_state_components(ecs, STATE.DEAD, entity);
        state.set_state(STATE.IDDLE);

        const life = ecs.get_component<LifeComponent>(entity);
        if (life) {
            life.heal(life.max_life());

            external_entity_resurrect(entity, life.life(), life.max_life());
        }

        output_update_entity_params(ecs, entity);
    } else {
        assert(!ASSERT_ERRORS, "resurrect -> entity does not contains StateComponent");
    }
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
            const entity_cast_type = entity_cast.type();
            if (entity_cast_type == CAST_ACTION.MELEE_ATTACK ||
                entity_cast_type == CAST_ACTION.HANDS_ATTACK) {
                const entity_cast_melee: CastMeleeDamageComponent | null = ecs.get_component<CastMeleeDamageComponent>(entity);
                if (entity_cast_melee) {
                    if (entity_cast_melee.target() == target_entity) {
                        // already make melee cast to the same entity, nothing to do
                        return UPDATE_TARGET_ACTION_STATUS.NO;
                    } else {
                        // another target, interrupt it
                        return UPDATE_TARGET_ACTION_STATUS.YES;
                    }
                } else {
                    // something wrong, cast is melee attack but there is no component
                    assert(!ASSERT_ERRORS, "should_redefine_target_action -> CAST_ACTION is attack, but entity does not contains CastMeleeDamageComponent");
                    return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
                }
            } else if (entity_cast_type == CAST_ACTION.RANGE_ATTACK) {
                // the same for range attack
                const entity_cast_range: CastRangeDamageComponent | null = ecs.get_component<CastRangeDamageComponent>(entity);
                if (entity_cast_range) {
                    if (entity_cast_range.target() == target_entity) {
                        return UPDATE_TARGET_ACTION_STATUS.NO;
                    } else {
                        return UPDATE_TARGET_ACTION_STATUS.YES;
                    }
                } else {
                    assert(!ASSERT_ERRORS, "should_redefine_target_action -> CAST_ACTION is attack, but entity does not contains CastRangeDamageComponent");
                    return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
                }
            } else if (entity_cast_type == CAST_ACTION.HIDE_ACTIVATION) {
                // currently cast hide activation, interrupt it
                return UPDATE_TARGET_ACTION_STATUS.YES;
            } else if (entity_cast_type == CAST_ACTION.SHADOW_ATTACK) {
                const entity_cast_shadow: CastShadowDamageComponent | null = ecs.get_component<CastShadowDamageComponent>(entity);
                if (entity_cast_shadow) {
                    if (entity_cast_shadow.target() == target_entity) {
                        UPDATE_TARGET_ACTION_STATUS.NO;
                    } else {
                        return UPDATE_TARGET_ACTION_STATUS.YES;
                    }
                } else {
                    return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
                }
            } else {
                // unknown type of cast action
                assert(!ASSERT_ERRORS, "should_redefine_target_action -> unknown cast action " + entity_cast_type.toString());
                return UPDATE_TARGET_ACTION_STATUS.FORBIDDEN;
            }
        } else {
            // something wrong, no cast component (but state is CAST)
            assert(!ASSERT_ERRORS, "should_redefine_target_action -> state is CASTING, but entity does not contains StateCastComponent");
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

export function output_update_entity_params(ecs: ECS, entity: Entity): void {
    const select_radius: RadiusSelectComponent | null = ecs.get_component<RadiusSelectComponent>(entity);
    const life: LifeComponent | null = ecs.get_component<LifeComponent>(entity);
    const shield = ecs.get_component<ShieldComponent>(entity);
    const attack_distance = ecs.get_component<AtackDistanceComponent>(entity);
    const attack_time = ecs.get_component<AtackTimeComponent>(entity);
    const state = ecs.get_component<StateComponent>(entity);

    if (select_radius && life && shield && attack_distance && attack_time && state) {
        external_update_entity_params(entity, state.state() == STATE.DEAD, life.life(), life.max_life(), shield.shield(), shield.max_shield(), select_radius.value(), attack_distance.value(), attack_time.value());
    } else {
        assert(!ASSERT_ERRORS, "output_update_entity_params -> Entity does not contains required components: RadiusSelectComponent, LifeComponent, ShieldComponent, AtackDistanceComponent, AtackTimeComponent, StateComponent");
    }
}
