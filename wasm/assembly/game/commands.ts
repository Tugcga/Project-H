import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";

import { STATE, EPSILON, TARGET_ACTION, CAST_ACTION, START_CAST_STATUS, COOLDAWN, UPDATE_TARGET_ACTION_STATUS } from "./constants";

import { get_navmesh_path, direction_to_angle } from "./utilities";

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

import { BuffShiftCooldawnComponent,
         BuffHideCooldawnComponent } from "./skills/buffs";

import { external_entity_start_shift,
         external_entity_start_cooldawn,
         external_entity_activate_shield,
         external_entity_start_stun,
         external_entity_switch_hide,
         external_entity_start_hide } from "../external";

import { assign_cast_state, 
         interrupt_to_iddle, 
         is_entity_in_hide, 
         should_redefine_target_action,
         try_start_melee_attack, 
         try_start_shadow_attack } from "./states";

function command_move_to_target(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity, target_x: f32, target_y: f32, action_type: TARGET_ACTION): boolean {
    if (action_type == TARGET_ACTION.ATTACK) {
        // at first we should check is we can start the attack cast
        const entity_state: StateComponent | null = ecs.get_component<StateComponent>(entity);
        const entity_target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);

        if (entity_state && entity_target_action) {
            const entity_state_value = entity_state.state();

            // TODO: find proper way to start shadow attack
            // also create additional data components to store shadow attack distance, attack time and cooldawn
            // check, may be nothing to do special
            const should_update_status = should_redefine_target_action(ecs, entity, target_entity, entity_target_action, entity_state_value);
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

            const start_status = try_start_attack(ecs, entity, target_entity);

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
                    const target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);
                    if (target_action) {
                        target_action.set_target_entity(target_entity, action_type);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    // fail to create path to target position
                }
            }
        } else {
            // some component is invalid
        }
    } else {
        // unknown target action
    }
    // other actions are not supported yet

    return false;
}

export function try_start_attack(ecs: ECS, entity: Entity, target_entity: Entity): START_CAST_STATUS {
    const entity_attack_time: AtackTimeComponent | null = ecs.get_component<AtackTimeComponent>(entity);

    if (entity_attack_time) {
        const attack_time_value = entity_attack_time.value();
        // with respect to different current entity mode we should start different type of attacks: melee, range or shadow

        if (is_entity_in_hide(ecs, entity)) {
            return try_start_shadow_attack(ecs, entity, target_entity, attack_time_value);
        } else {
            // TODO: here we should check the weapon
            // if it is a distance weapon, then start range attack
            // but for now we supports only melee weapon
            return try_start_melee_attack(ecs, entity, target_entity, attack_time_value);
        }
    } else {
        return START_CAST_STATUS.FAIL;
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
            return false;
        }
    } else {
        return false;
    }
}

// this method called by client and also by switching system when the cast is over
export function command_init_attack(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity): boolean {
    const target_position: PositionComponent | null = ecs.get_component<PositionComponent>(target_entity);
    if (target_position) {
        return command_move_to_target(ecs, navmesh, entity, target_entity, target_position.x(), target_position.y(), TARGET_ACTION.ATTACK);
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
                }
            }
        }
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
    }
}

export function command_release_shield(ecs: ECS, entity: Entity): void {
    const shield: StateShieldComponent | null = ecs.get_component<StateShieldComponent>(entity);
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (shield && state) {
        const state_value = state.state();
        if (state_value == STATE.SHIELD) {
            // should not require to send external call, because it already called from interrupt function
            interrupt_to_iddle(ecs, entity, state);
            command_entity_unhide(ecs, entity);
        }
        // if the state is another, then nothing to do
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
            }

            external_entity_switch_hide(entity, false);
        } else {
            //nothing to do, entity already on unhide mode
        }
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
    }
}