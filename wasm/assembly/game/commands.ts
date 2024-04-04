import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";

import { TARGET_ACTION_TYPE, SKILL, WEAPON_TYPE, SKILL, ASSERT_ERRORS, STATE, EPSILON, TARGET_ACTION, CAST_ACTION, START_CAST_STATUS, COOLDAWN, UPDATE_TARGET_ACTION_STATUS } from "./constants";
import { DefaultWeapons } from "./settings";

import { get_navmesh_path, direction_to_angle, distance, points_to_angle } from "./utilities";

// import components
import { AngleComponent } from "./components/angle";
import { PositionComponent } from "./components/position";
import { SpeedComponent } from "./components/speed";
import { StateComponent, 
         StateWalkToPointComponent,
         StateShiftComponent,
         StateShieldComponent,
         StateStunComponent } from "./components/state";
import { TargetAngleComponent } from "./components/target_angle";
import { ShiftDistanceComponent } from "./components/shift_distance";
import { TargetActionComponent } from "./components/target_action";
import { AtackTimeComponent } from "./components/atack_time";
import { HideModeComponent } from "./components/hide_mode";
import { ShadowAttackTimeComponent } from "./components/shadow_attack_time";
import { CastSkillRoundAttackComponent,
         CastSkillStunConeComponent } from "./components/cast";

import { BuffShiftCooldawnComponent,
         BuffHideCooldawnComponent,
         BuffSkillRoundAttackCooldawnComponent,
         BuffSkillStunConeCooldawnComponent } from "./skills/buffs";
import { SkillCollectionComponent } from "./skills/skill_collection";
import { SkillParameterCastTimeComponent,
         SkillParameterCooldawnComponent,
         SkillParameterDistanceComponent,
         SkillParameterConeSpreadComponent,
         SkillParameterConeSizeComponent,
         SkillParameterAreaRadiusComponent,
         SkillParameterDamageComponent,
         SkillParameterStunTimeComponent } from "./skills/skill";

import { InventarComponent } from "./components/inventar/inventar";
import { EquipmentComponent } from "./components/inventar/equipment";
import { InventarWeaponTypeComponent } from "./components/inventar/type";

import { external_entity_start_shift,
         external_entity_start_cooldawn,
         external_entity_activate_shield,
         external_entity_start_stun,
         external_entity_switch_hide,
         external_entity_start_hide,
         external_entity_start_skill_round_attack,
         external_entity_start_skill_stun_cone } from "../external";

import { assign_cast_state, 
         interrupt_to_iddle, 
         is_entity_in_hide, 
         resurrect,
         is_state_cast_action,
         should_redefine_target_action,
         try_start_weapon_attack, 
         try_start_shadow_attack } from "./states";
 import { update_entity_parameters,
          is_weapon_doublehanded,
          is_weapon_equiped } from "./rpg";

function command_move_to_target(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity, target_x: f32, target_y: f32, action_type: TARGET_ACTION, skill: SKILL): boolean {
    const entity_state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    const entity_target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);

    if (entity_state && entity_target_action) {
        const entity_state_value = entity_state.state();

        // check, may be nothing to do special
        const should_update_status = should_redefine_target_action(ecs, entity, target_entity, entity_target_action, entity_state_value, skill);
        if (should_update_status == UPDATE_TARGET_ACTION_STATUS.FORBIDDEN) {
            return false;
        }

        // entity make the same, nothing to do
        if (should_update_status == UPDATE_TARGET_ACTION_STATUS.NO) {
            return true;
        }

        // we prefer another action for the entity
        // it should skip current action and start the new one
        const is_interrupt = interrupt_to_iddle(ecs, entity, entity_state);
        // if it false, then something is wrong
        if (is_interrupt == false) {
            return false;
        }

        let start_status = START_CAST_STATUS.FAIL;
        if (action_type == TARGET_ACTION.ATTACK) {
            start_status = try_start_attack(ecs, entity, target_entity);
        } else if (action_type == TARGET_ACTION.SKILL_POSITION || TARGET_ACTION.SKILL_ENTITY) {
            start_status = try_start_skill(ecs, entity, target_entity, target_x, target_y, action_type, skill);
        }

        if (start_status == START_CAST_STATUS.OK) {
            // we switch the state to cast
            // here we should not clear state component, because it start from iddle

            return true;
        } else {
            // fail to start the cast
            // may be the distance or cooldawn
            // create the path to the point
            const is_create_path = command_move_to_point(ecs, navmesh, entity, target_x, target_y);
            if (is_create_path) {
                // we create path and switch the state
                // next we should define target action
                // to track that the entity moves to the target, not just to point
                // we should define target action with respect what we shold do after entity comes to the required distance
                if (action_type == TARGET_ACTION.ATTACK) {
                    entity_target_action.set_target_entity(target_entity, TARGET_ACTION.ATTACK);
                } else if (action_type == TARGET_ACTION.SKILL_ENTITY) {
                    entity_target_action.set_target_entity(target_entity, TARGET_ACTION.SKILL_ENTITY);
                    entity_target_action.set_target_skill(skill);
                } else if (action_type == TARGET_ACTION.SKILL_POSITION) {
                    entity_target_action.set_target_position(target_x, target_y, TARGET_ACTION.SKILL_POSITION);
                    entity_target_action.set_target_skill(skill);
                }
                return true;
            } else {
                // fail to create path to target position
            }
        }
    } else {
        assert(!ASSERT_ERRORS, "command_move_to_target -> entity does not contains StateComponent, TargetActionComponent");
        // some component is invalid
        return false;
    }

    return false;
}

export function try_start_skill(ecs: ECS, entity: Entity, target_entity: Entity, target_x: f32, target_y: f32, action_type: TARGET_ACTION, skill: SKILL): START_CAST_STATUS {
    let target_pos_x = target_x;
    let target_pos_y = target_y;
    if (action_type == TARGET_ACTION.SKILL_ENTITY) {
        const target_entity_position = ecs.get_component<PositionComponent>(target_entity);
        if (target_entity_position) {
            target_pos_x = target_entity_position.x();
            target_pos_y = target_entity_position.y();
        } else {
            return START_CAST_STATUS.FAIL;
        }
    }

    const skill_collection = ecs.get_component<SkillCollectionComponent>(entity);
    const state = ecs.get_component<StateComponent>(entity);
    const position = ecs.get_component<PositionComponent>(entity);
    if (skill_collection && state && position) {
        const entity_pos_x = position.x();
        const entity_pos_y = position.y();
        if (state.state() != STATE.DEAD && skill_collection.has_skill(skill)) {
            const skill_entity = skill_collection.skill_entity(skill);
            const skill_level = skill_collection.skill_level(skill);

            // check the distance between current position, target position and skill apply distance
            const cast_distance_parameter = ecs.get_component<SkillParameterDistanceComponent>(skill_entity);
            if (cast_distance_parameter) {
                const cast_distance_parameter_value = cast_distance_parameter.value(skill_level);

                const d = distance(entity_pos_x, entity_pos_y, target_pos_x, target_pos_y);
                if (d < cast_distance_parameter_value) {
                    // entity is close to the target (point or entity)
                    // we can start the skill cast
                    const target_action = ecs.get_component<TargetActionComponent>(entity);
                    if (target_action) {
                        target_action.reset();
                    }
                    command_entity_unhide(ecs, entity);
                    if (skill == SKILL.STUN_CONE) {
                        // check cooldawn baf
                        if (!ecs.has_component<BuffSkillStunConeCooldawnComponent>(entity)) {
                            if (is_weapon_equiped(ecs, entity, WEAPON_TYPE.SWORD)) {
                                const is_interrupt = interrupt_to_iddle(ecs, entity, state);
                                if (is_interrupt) {
                                    const cast_time_parameter = ecs.get_component<SkillParameterCastTimeComponent>(skill_entity);
                                    const cast_cooldawn_parameter = ecs.get_component<SkillParameterCooldawnComponent>(skill_entity);
                                    const cast_damage_parameter = ecs.get_component<SkillParameterDamageComponent>(skill_entity);

                                    const cast_cone_spread_parameter = ecs.get_component<SkillParameterConeSpreadComponent>(skill_entity);
                                    const cast_cone_size_parameter = ecs.get_component<SkillParameterConeSizeComponent>(skill_entity);
                                    const cast_stun_time_parameter = ecs.get_component<SkillParameterStunTimeComponent>(skill_entity);
                                    if (cast_time_parameter && cast_cooldawn_parameter && cast_damage_parameter &&
                                        cast_cone_spread_parameter && cast_cone_size_parameter && cast_stun_time_parameter) {
                                        const cast_time_value = cast_time_parameter.value(skill_level);
                                        const cast_cooldawn_value = cast_cooldawn_parameter.value(skill_level);
                                        const cast_damage_value = cast_damage_parameter.value(skill_level);

                                        const cast_cone_spread_value = cast_cone_spread_parameter.value(skill_level);
                                        const cast_cone_size_value = cast_cone_size_parameter.value(skill_level);
                                        const cast_stun_time_value = cast_stun_time_parameter.value(skill_level);

                                        const cast_status = assign_cast_state(ecs, entity, cast_time_value, state, CAST_ACTION.SKILL_STUN_CONE);
                                        if (cast_status == START_CAST_STATUS.OK) {
                                            // set target angle
                                            const entity_target_angle = ecs.get_component<TargetAngleComponent>(entity);
                                            if (entity_target_angle) {
                                                entity_target_angle.set_value(points_to_angle(entity_pos_x, entity_pos_y, target_pos_x, target_pos_y));
                                            }
                                            external_entity_start_skill_stun_cone(entity, cast_time_value, cast_cone_spread_value, cast_cone_size_value);

                                            // add cooldawn
                                            ecs.add_component<BuffSkillStunConeCooldawnComponent>(entity, new BuffSkillStunConeCooldawnComponent(cast_cooldawn_value));
                                            external_entity_start_cooldawn(entity, COOLDAWN.SKILL_STUN_CONE, cast_cooldawn_value);

                                            // add cast skill component
                                            ecs.add_component<CastSkillStunConeComponent>(entity, 
                                                new CastSkillStunConeComponent(action_type == TARGET_ACTION.SKILL_ENTITY ? TARGET_ACTION_TYPE.ENTITY : TARGET_ACTION_TYPE.POSITION,
                                                                               target_x, target_y, target_entity,
                                                                               cast_damage_value, cast_cone_spread_value, cast_cone_size_value, cast_stun_time_value));
                                        }

                                        return cast_status;
                                    }
                                }
                            }
                        } else {
                            return START_CAST_STATUS.FAIL_COOLDAWN;
                        }
                    }
                } else {
                    return START_CAST_STATUS.FAIL_DISTANCE;
                }
            }
        } else {
            return START_CAST_STATUS.FAIL_WRONG_CAST;
        }
    }
    return START_CAST_STATUS.FAIL;
}

export function try_start_attack(ecs: ECS, entity: Entity, target_entity: Entity): START_CAST_STATUS {
    // get proper value for attack time
    // for shadow mode from special component
    // for general mode from general compoent (which is chnged by equiped weapon)
    if (is_entity_in_hide(ecs, entity)) {
        const shadow_attack_time = ecs.get_component<ShadowAttackTimeComponent>(entity);
        if (shadow_attack_time) {
            return try_start_shadow_attack(ecs, entity, target_entity, shadow_attack_time.value());
        } else {
            assert(!ASSERT_ERRORS, "try_start_attack -> entity does not contains ShadowAttackTimeComponent");
            return START_CAST_STATUS.FAIL;
        }
    } else {
        // it does not matter the type of the weapon
        // even it is a renged weapon, get attack time from the same component
        const attack_time = ecs.get_component<AtackTimeComponent>(entity);
        if (attack_time) {
            return try_start_weapon_attack(ecs, entity, target_entity, attack_time.value());
        } else {
            assert(!ASSERT_ERRORS, "try_start_attack -> entity does not contains AtackTimeComponent");
            return START_CAST_STATUS.FAIL;
        }
    }
}

export function command_move_to_point(ecs: ECS, navmesh: Navmesh, entity: Entity, in_x: f32, in_y: f32): boolean {
    // get state
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        const state_value = state.state();
        if (state_value == STATE.DEAD || state_value == STATE.STUN) {
            // can not move in dead or stun state
            return false;
        }

        const is_interrupt = interrupt_to_iddle(ecs, entity, state);
        if (is_interrupt == false) {
            return false;
        }

        const position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
        const target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);
        if (position && target_action) {
            const path = get_navmesh_path(navmesh, position.x(), position.y(), in_x, in_y);
            if (path.length > 0) {
                // find valid path
                // set neutral target
                target_action.reset();

                state.set_state(STATE.WALK_TO_POINT);
                const walk_to_point = new StateWalkToPointComponent();
                // assign path
                const is_define = walk_to_point.define_path(path);
                // add this component to the entity
                ecs.add_component<StateWalkToPointComponent>(entity, walk_to_point);
                return is_define;
            } else {
                // path is invalid
                return false;
            }
        } else {
            assert(!ASSERT_ERRORS, "command_move_to_point -> entity does not contains PositionComponent, TargetActionComponent");
            return false;
        }
    } else {
        assert(!ASSERT_ERRORS, "command_move_to_point -> entity does not contains StateComponent");
        return false;
    }
}

// this method called by client and also by switching system when the cast is over
export function command_init_attack(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity): boolean {
    const target_position: PositionComponent | null = ecs.get_component<PositionComponent>(target_entity);
    if (target_position) {
        return command_move_to_target(ecs, navmesh, entity, target_entity, target_position.x(), target_position.y(), TARGET_ACTION.ATTACK, SKILL.NONE);
    } else {
        assert(!ASSERT_ERRORS, "command_init_attack -> entity does not contains PositionComponent");
    }

    return false;
}

export function command_shift(ecs: ECS, navmesh: Navmesh, entity: Entity, cursor_x: f32, cursor_y: f32): void {
    const delta: f32 = 0.1;
    // check the sate of the entity
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        // we can start the shift from any state, except the actual shift and dead
        const state_value = state.state();
        if (state_value != STATE.SHIFTING && state_value != STATE.DEAD && state_value != STATE.STUN) {
            // check is the player contains shift cooldawn
            const shift_cooldawn: BuffShiftCooldawnComponent | null = ecs.get_component<BuffShiftCooldawnComponent>(entity);
            if (!shift_cooldawn) {
                // there are no buff in the player
                // so, we can start the shift
                // get player angle
                // we will use it if fails to use the target (if it close to position)
                const angle: AngleComponent | null = ecs.get_component<AngleComponent>(entity);
                const target_angle: TargetAngleComponent | null = ecs.get_component<TargetAngleComponent>(entity);
                // and current position
                const position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
                const shift_distance: ShiftDistanceComponent | null = ecs.get_component<ShiftDistanceComponent>(entity);
                const target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);
                if (angle && target_angle && position && shift_distance && target_action) {
                    const pos_x = position.x();
                    const pos_y = position.y();
                    const a = angle.value();
                    let dir_x = Mathf.cos(a);
                    let dir_y = Mathf.sin(a);
                    const to_cursor_x = cursor_x - pos_x;
                    const to_cursor_y = cursor_y - pos_y;
                    const to_cursor_length = Mathf.sqrt(to_cursor_x*to_cursor_x + to_cursor_y*to_cursor_y);
                    if (to_cursor_length > EPSILON) {
                        dir_x = to_cursor_x / to_cursor_length;
                        dir_y = to_cursor_y / to_cursor_length;

                        // set angle and target angle
                        const new_a = direction_to_angle(dir_x, dir_y);
                        // it's question: should we immediately set the angle, or rotate it to target angle
                        angle.set_value(new_a);
                        target_angle.set_value(new_a);
                    }

                    // get distance from settings
                    const distance = shift_distance.value();
                    
                    // calculate target point
                    const target_x = pos_x + dir_x * distance;
                    const target_y = pos_y + dir_y * distance;

                    // check is the line from pos to target intersect the navmesh boundary
                    // use slightly bigger interval
                    const t = navmesh.intersect_boundary(pos_x - dir_x * delta, pos_y - dir_y * delta, target_x, target_y, true);
                    const mod_t = ((distance + delta) * t - delta) / distance;

                    // use actual target position defined by mod_t\in [0; 1]
                    const shift = new StateShiftComponent(pos_x + dir_x * (distance * mod_t - EPSILON), pos_y + dir_y * (distance * mod_t - EPSILON));

                    // switch the state
                    const is_interrupt = interrupt_to_iddle(ecs, entity, state);
                    if (is_interrupt) {
                        // assign new state
                        state.set_state(STATE.SHIFTING);
                        // add the component
                        ecs.add_component<StateShiftComponent>(entity, shift);
                        external_entity_start_shift(entity);
                        command_entity_unhide(ecs, entity);
                    }
                } else {
                    assert(!ASSERT_ERRORS, "command_shift -> entity does not contains AngleComponent, TargetAngleComponent, PositionComponent, ShiftDistanceComponent, TargetActionComponent");
                }
            }
        }
    } else {
        assert(!ASSERT_ERRORS, "command_shift -> entity does not contains StateComponent");
    }
}

export function command_activate_shield(ecs: ECS, entity: Entity): void {
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        // entity can start shield state at iddle, walk and cast
        const state_value = state.state();
        if (state_value == STATE.IDDLE || state_value == STATE.WALK_TO_POINT || state_value == STATE.CASTING) {
            const is_interrupt = interrupt_to_iddle(ecs, entity, state);
            if (is_interrupt) {
                // now entity at iddle state
                state.set_state(STATE.SHIELD);
                const shield: StateShieldComponent = new StateShieldComponent();
                ecs.add_component<StateShieldComponent>(entity, shield);

                external_entity_activate_shield(entity);
                command_entity_unhide(ecs, entity);
            }
        }
    } else {
        assert(!ASSERT_ERRORS, "command_release_shield -> entity does not contains StateComponent");
    }
}

export function command_release_shield(ecs: ECS, entity: Entity): void {
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        const state_value = state.state();
        if (state_value == STATE.SHIELD) {
            const shield: StateShieldComponent | null = ecs.get_component<StateShieldComponent>(entity);
            if (shield) {
                const state_value = state.state();
                if (state_value == STATE.SHIELD) {
                    // should not require to send external call, because it already called from interrupt function
                    interrupt_to_iddle(ecs, entity, state);
                    command_entity_unhide(ecs, entity);
                }
                // if the state is another, then nothing to do
            } else {
                assert(!ASSERT_ERRORS, "command_release_shield -> entity does not contains StateShieldComponent");
            }
        }
    } else {
        assert(!ASSERT_ERRORS, "command_release_shield -> entity does not contains StateComponent");
    }
}

function command_entity_hide(ecs: ECS, entity: Entity): void {
    const hide_mode: HideModeComponent | null = ecs.get_component<HideModeComponent>(entity);
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (hide_mode && state) {
        const hide_mode_value = hide_mode.is_active();
        if (!hide_mode_value) {
            const hide_cooldawn = hide_mode.cooldawn();
            const hide_activate_time = hide_mode.activate_time();

            const is_interrupt = interrupt_to_iddle(ecs, entity, state);
            if (is_interrupt) {

                const cast_status = assign_cast_state(ecs, entity, hide_activate_time, state, CAST_ACTION.HIDE_ACTIVATION);
                if (cast_status == START_CAST_STATUS.OK) {
                    external_entity_start_hide(entity, hide_activate_time);

                    // add cooldawn
                    ecs.add_component(entity, new BuffHideCooldawnComponent(hide_cooldawn));
                    external_entity_start_cooldawn(entity, COOLDAWN.HIDE_ACTIVATION, hide_cooldawn);
                }
            }
        } else {
            // nothing to do, entity already in hide move
        }
    } else {
        assert(!ASSERT_ERRORS, "command_entity_hide -> entity does not contains HideModeComponent, StateComponent");
    }
}

// many actions force entity unhide: shift, stun, death, receive damage, activate the shield
export function command_entity_unhide(ecs: ECS, entity: Entity): void {
    const hide_mode: HideModeComponent | null = ecs.get_component<HideModeComponent>(entity);
    if (hide_mode) {
        const hide_mode_value = hide_mode.is_active();
        if (hide_mode_value) {
            hide_mode.deactivate();

            const speed_multiplier = hide_mode.speed_multiplier();
            const speed: SpeedComponent | null = ecs.get_component<SpeedComponent>(entity);
            if (speed) {
                const speed_value = speed.value();
                // increase the speed
                speed.set_value(speed_value / speed_multiplier);
            } else {
                assert(!ASSERT_ERRORS, "command_entity_unhide -> entity does not contains SpeedComponent");
            }

            external_entity_switch_hide(entity, false);
        } else {
            //nothing to do, entity already on unhide mode
        }
    } else {
        assert(!ASSERT_ERRORS, "command_entity_unhide -> entity does not contains HideModeComponent");
    }
}

export function command_toggle_hide_mode(ecs: ECS, entity: Entity): void {
    const hide_mode: HideModeComponent | null = ecs.get_component<HideModeComponent>(entity);
    if (hide_mode) {
        const is_active = hide_mode.is_active();
        if (is_active) {
            command_entity_unhide(ecs, entity);
        } else {
            command_entity_hide(ecs, entity);
        }
    } else {
        assert(!ASSERT_ERRORS, "command_toggle_hide_mode -> entity does not contains HideModeComponent");
    }
}

export function command_stun(ecs: ECS, entity: Entity, duration: f32): void {
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        const state_value = state.state();

        if (state_value != STATE.STUN && state_value != STATE.DEAD) {
            const is_iddle = interrupt_to_iddle(ecs, entity, state);
            if (is_iddle) {
                state.set_state(STATE.STUN);
                ecs.add_component<StateStunComponent>(entity, new StateStunComponent(duration));

                external_entity_start_stun(entity, duration);
                command_entity_unhide(ecs, entity);
            }
        }
    } else {
        assert(!ASSERT_ERRORS, "command_stun -> entity does not contains StateComponent");
    }
}

export function command_use_nontarget_skill(ecs: ECS, entity: Entity, skill: SKILL): bool {
    // check that entity has this skill
    const skill_collection = ecs.get_component<SkillCollectionComponent>(entity);
    const state = ecs.get_component<StateComponent>(entity);
    let is_start = false;
    if (skill_collection && state) {
        if (state.state() != STATE.DEAD && skill_collection.has_skill(skill)) {
            const skill_entity = skill_collection.skill_entity(skill);
            const skill_level = skill_collection.skill_level(skill);
            if (skill_level > 0) {
                if (skill == SKILL.ROUND_ATTACK) {
                    // round attack we can use only when entity equiped by sword
                    // equip exists only for player
                    // for monsters we can check weapon type
                    if (is_weapon_equiped(ecs, entity, WEAPON_TYPE.SWORD) && 
                        !is_state_cast_action(ecs, entity, CAST_ACTION.SKILL_ROUND_ATTACK) &&
                        !ecs.has_component<BuffSkillRoundAttackCooldawnComponent>(entity)) {
                        // unhide the entity
                        command_entity_unhide(ecs, entity);
                        const is_interrupt = interrupt_to_iddle(ecs, entity, state);
                        if (is_interrupt) {
                            // get skill parameters
                            const cast_time_parameter = ecs.get_component<SkillParameterCastTimeComponent>(skill_entity);
                            const cast_cooldawn_parameter = ecs.get_component<SkillParameterCooldawnComponent>(skill_entity);
                            const cast_area_parameter = ecs.get_component<SkillParameterAreaRadiusComponent>(skill_entity);
                            const cast_damage_parameter = ecs.get_component<SkillParameterDamageComponent>(skill_entity);
                            if (cast_time_parameter && cast_cooldawn_parameter && cast_area_parameter && cast_damage_parameter) {
                                const cast_time_value = cast_time_parameter.value(skill_level);
                                const cast_cooldawn_value = cast_cooldawn_parameter.value(skill_level);
                                const cast_area_value = cast_area_parameter.value(skill_level);
                                const cast_damage_value = cast_damage_parameter.value(skill_level);

                                const cast_status = assign_cast_state(ecs, entity, cast_time_value, state, CAST_ACTION.SKILL_ROUND_ATTACK);
                                if (cast_status == START_CAST_STATUS.OK) {
                                    external_entity_start_skill_round_attack(entity, cast_time_value, cast_area_value);

                                    // add cooldawn
                                    ecs.add_component<BuffSkillRoundAttackCooldawnComponent>(entity, new BuffSkillRoundAttackCooldawnComponent(cast_cooldawn_value));
                                    external_entity_start_cooldawn(entity, COOLDAWN.SKILL_ROUND_ATTACK, cast_cooldawn_value);

                                    // add cast skill component
                                    ecs.add_component<CastSkillRoundAttackComponent>(entity, new CastSkillRoundAttackComponent(cast_area_value, cast_damage_value));

                                    is_start = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return is_start;
}

export function command_use_target_position_skill(ecs: ECS, navmesh: Navmesh, entity: Entity, pos_x: f32, pos_y: f32, skill: SKILL): bool {
    // check that entity has this skill
    const skill_collection = ecs.get_component<SkillCollectionComponent>(entity);
    const state = ecs.get_component<StateComponent>(entity);
    if (skill_collection && state) {
        if (state.state() != STATE.DEAD && skill_collection.has_skill(skill)) {
            return command_move_to_target(ecs, navmesh, entity, 0, pos_x, pos_y, TARGET_ACTION.SKILL_POSITION, skill);
        }
    }

    return false;
}

export function command_use_target_entity_skill(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity, skill: SKILL): bool {
    const skill_collection = ecs.get_component<SkillCollectionComponent>(entity);
    const state = ecs.get_component<StateComponent>(entity);
    if (skill_collection && state) {
        if (state.state() != STATE.DEAD && skill_collection.has_skill(skill)) {
            const target_position = ecs.get_component<PositionComponent>(target_entity);
            if (target_position) {
                return command_move_to_target(ecs, navmesh, entity, target_entity, target_position.x(), target_position.y(), TARGET_ACTION.SKILL_ENTITY, skill);
            }
        }
    }
    
    return false;
}

export function command_resurrect(ecs: ECS, entity: Entity): void {
    const state = ecs.get_component<StateComponent>(entity);
    if (state) {
        if (state.state() == STATE.DEAD) {
            resurrect(ecs, entity);
        }
    } else {
        assert(!ASSERT_ERRORS, "command_resurrect -> entity does not contains StateComponent");
    }
}

export function command_equip_main_weapon(ecs: ECS, player_entity: Entity, weapon_entity: Entity, default_weapons: DefaultWeapons): void {
    // get inventar
    const player_inventar = ecs.get_component<InventarComponent>(player_entity);
    const player_equip = ecs.get_component<EquipmentComponent>(player_entity);
    const weapon_type = ecs.get_component<InventarWeaponTypeComponent>(weapon_entity);

    if (player_inventar && player_equip && weapon_type) {
        const weapon_type_value = weapon_type.type();
        const is_double_handed = is_weapon_doublehanded(weapon_type_value);

        if (player_equip.is_main_weapon()) {
            const equiped_weapon = player_equip.remove_main_weapon();
            // add it to the inventar
            player_inventar.add_item(equiped_weapon);

            // also if the weapon is doublehanded, then remove the secondary equip (if it exists)
            if (is_double_handed) {
                if (player_equip.is_secondary_weapon()) {
                    const equiped_secondary_weapond = player_equip.remove_secondary_weapon();
                    player_inventar.add_item(equiped_secondary_weapond);
                }
            }
        }

        // remove from the inventar target weapon
        player_inventar.remove_item(weapon_entity);
        // add item to the equipment
        player_equip.equip_main_weapon(weapon_entity);

        // next recalculate player parameters with new equipment
        update_entity_parameters(ecs, player_entity, default_weapons);
    } else {
        assert(!ASSERT_ERRORS, "command_equip_main_weapon -> entity does not contains required components: InventarComponent, EquipmentComponent, InventarWeaponTypeComponent");
    }
}

export function command_free_equip_weapon(ecs: ECS, player_entity: Entity, default_weapons: DefaultWeapons): void {
    const player_inventar = ecs.get_component<InventarComponent>(player_entity);
    const player_equip = ecs.get_component<EquipmentComponent>(player_entity);

    if (player_inventar && player_equip) {
        if (player_equip.is_secondary_weapon()) {
            const secondary_entity = player_equip.remove_secondary_weapon();

            player_inventar.add_item(secondary_entity);
        }

        if (player_equip.is_main_weapon()) {
            const main_entity = player_equip.remove_main_weapon();

            player_inventar.add_item(main_entity);
        }

        update_entity_parameters(ecs, player_entity, default_weapons);
    } else {
        assert(!ASSERT_ERRORS, "command_free_equip_weapon -> entity does not contains required components: InventarComponent, EquipmentComponent");
    }
}