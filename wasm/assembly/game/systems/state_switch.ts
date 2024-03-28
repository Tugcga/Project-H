import { Navmesh } from "../../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../../promethean/pseudo_random"
import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ECS } from "../../simple_ecs/simple_ecs";
import { EPSILON, STATE, ACTOR, COOLDAWN, TARGET_ACTION, CAST_ACTION, START_CAST_STATUS, DAMAGE_TYPE } from "../constants";
import { direction_to_angle, get_navmesh_path, distance } from "../utilities";
import { try_start_attack, clear_state_components, command_init_attack, interrupt_to_iddle, command_move_to_point } from "../ecs_setup";

import { ActorTypeComponent } from "../components/actor_type";
import { StateComponent, StateWalkToPointComponent, StateShiftComponent, StateCastComponent, StateStunComponent } from "../components/state";
import { PositionComponent } from "../components/position";
import { BuffShiftCooldawnComponent, BuffMeleeAttackCooldawnComponent } from "../components/buffs";
import { ShiftCooldawnComponent } from "../components/shift_cooldawn";
import { TargetActionComponent } from "../components/target_action";
import { RadiusComponent } from "../components/radius";
import { AtackDistanceComponent } from "../components/atack_distance";
import { AtackTimeComponent } from "../components/atack_time";
import { MeleeAttackCooldawnComponent } from "../components/melee_attack_cooldawn";
import { MeleeDamageDistanceComponent, MeleeDamageSpreadComponent, MeleeDamageDamageComponent } from "../components/damage";
import { CastMeleeDamageComponent,
         CastShadowDamageComponent } from "../components/cast";
import { TargetAngleComponent } from "../components/target_angle";
import { PreferredVelocityComponent } from "../components/preferred_velocity";
import { ApplyDamageComponent } from "../components/apply_damage";
import { HideModeComponent } from "../components/hide_mode";
import { EnemiesListComponent } from "../components/enemies_list";
import { SpeedComponent } from "../components/speed";

import { NeighborhoodQuadGridTrackingSystem } from "./neighborhood_quad_grid_tracking";
import { SearchEnemiesSystem } from "./search_enemies"

import { external_entity_finish_shift,
         external_entity_start_cooldawn,
         external_entity_finish_melee_attack,
         external_entity_finish_shadow_attack,
         external_entity_finish_stun,
         external_entity_finish_hide,
         external_entity_switch_hide } from "../../external";

// several systems from this file controll the switch between different states of entitites
// this system controlls when the actor comes to the finall target point
export class WalkToPointSwitchSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const walk_to_point: StateWalkToPointComponent | null = this.get_component<StateWalkToPointComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const entity_target_action: TargetActionComponent | null = this.get_component<TargetActionComponent>(entity);
            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);
            
            if (pref_velocity && walk_to_point && state && entity_target_action) {
                if (entity_target_action.type() == TARGET_ACTION.ATTACK) {
                    const local_ecs: ECS | null = this.get_ecs();
                    const target_entity: Entity = entity_target_action.entity();

                    const target_state: StateComponent | null = this.get_component<StateComponent>(target_entity);

                    if (local_ecs && target_state) {
                        const target_state_value = target_state.state();
                        if (target_state_value == STATE.DEAD) {
                            // target is dead
                            // stop walking to the target
                            const is_iddle = interrupt_to_iddle(local_ecs, entity, state);
                            pref_velocity.set(0.0, 0.0);
                        } else {
                            const prev_state_value = state.state();
                            const attack_status = try_start_attack(local_ecs, entity, target_entity);
                            if (attack_status == START_CAST_STATUS.OK) {
                                pref_velocity.set(0.0, 0.0);
                                clear_state_components(local_ecs, prev_state_value, entity);
                            } else {
                                // there are several reasons to fial the cast start
                                if(attack_status == START_CAST_STATUS.FAIL_COOLDAWN) {
                                    // distance is ok, but the cast is not ready
                                    // wait at place, reset the velocity
                                    pref_velocity.set(0.0, 0.0);
                                    // we are not casting, the state is still walk to point
                                    // in this case in rvo actual velocity can be changed
                                } else {
                                    // in all other cases simply make a step
                                    // nothing to do special
                                }
                            }
                        }
                    }
                } else if (!walk_to_point.active() || walk_to_point.target_point_index() >= walk_to_point.path_points_count()) {
                    // the actor comes to the finall target point
                    this.remove_component<StateWalkToPointComponent>(entity);
                    state.set_state(STATE.IDDLE);
                }
            }
        }
    }
}

export class ShiftSwitchSystem extends System {
    update(dt: f32): void {
        const local_ecs = this.get_ecs();

        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const shift: StateShiftComponent | null = this.get_component<StateShiftComponent>(entity);

            if (state && shift && local_ecs) {
                const state_value = state.state();
                const shift_active = shift.active();

                if (state_value == STATE.SHIFTING && shift_active == false) {
                    external_entity_finish_shift(entity);

                    // add cooldawn component
                    const cooldawn: ShiftCooldawnComponent | null = this.get_component<ShiftCooldawnComponent>(entity);
                    if (cooldawn) {
                        const cooldawn_value = cooldawn.value();
                        this.add_component<BuffShiftCooldawnComponent>(entity, new BuffShiftCooldawnComponent(cooldawn_value));
                        external_entity_start_cooldawn(entity, COOLDAWN.SHIFT, cooldawn_value);
                    }
                    clear_state_components(local_ecs, STATE.SHIFTING, entity);
                    state.set_state(STATE.IDDLE);
                }
            }
        }
    }
}

function allign_to_target(ecs: ECS, entity: Entity, target_entity: Entity, position_x: f32, position_y: f32, target_angle: TargetAngleComponent): void {
    if (target_entity != entity) {
        // get position of the target entity
        const target_position: PositionComponent | null = ecs.get_component<PositionComponent>(target_entity);
        if (target_position) {
            let dir_x = target_position.x() - position_x;
            let dir_y = target_position.y() - position_y;
            const dir_length = Mathf.sqrt(dir_x * dir_x + dir_y * dir_y);
            if (dir_length > EPSILON) {
                dir_x /= dir_length;
                dir_y /= dir_length;
                // define target angle
                target_angle.set_value(direction_to_angle(dir_x, dir_y));
            }
        }
    }
}

export class CastSwitchSystem extends System {
    private m_navmesh: Navmesh;  // used to call attack after cast is finish
    private m_tracking_system: NeighborhoodQuadGridTrackingSystem;

    constructor(in_tracking_system: NeighborhoodQuadGridTrackingSystem, in_navmesh: Navmesh) {
        super();

        this.m_navmesh = in_navmesh;
        this.m_tracking_system = in_tracking_system;
    }

    update(dt: f32): void {
        const tracking_system = this.m_tracking_system;
        const local_ecs = this.get_ecs();

        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const cast: StateCastComponent | null = this.get_component<StateCastComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
            const target_angle: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);

            if (local_ecs && state && cast && actor_type && target_angle && position) {
                const position_x = position.x();
                const position_y = position.y();

                cast.increase(dt);
                const cast_type = cast.type();

                // with respect of the cast type we should rotate the entity to the target
                if (cast_type == CAST_ACTION.MELEE_ATTACK) {
                    // rotate to the target
                    // target is stored in CastMeleeDamageComponent
                    const cast_damage: CastMeleeDamageComponent | null = this.get_component<CastMeleeDamageComponent>(entity);
                    if (cast_damage) {
                        const target_entity = cast_damage.target();
                        allign_to_target(local_ecs, entity, target_entity, position_x, position_y, target_angle);
                    }
                } else if (cast_type == CAST_ACTION.SHADOW_ATTACK) {
                    const cast_damage: CastShadowDamageComponent | null = this.get_component<CastShadowDamageComponent>(entity);
                    if (cast_damage) {
                        const target_entity = cast_damage.target();
                        allign_to_target(local_ecs, entity, target_entity, position_x, position_y, target_angle);
                    }
                }

                if (!cast.active()) {
                    // cast is finish
                    const cast_duration = cast.time_length();
                    // we should apply post cast action, delete cast action component and switch to the iddle state
                    if (cast_type == CAST_ACTION.MELEE_ATTACK) {
                        external_entity_finish_melee_attack(entity, false);
                        const cast_melee: CastMeleeDamageComponent | null = this.get_component<CastMeleeDamageComponent>(entity);
                        const cast_target = cast_melee ? cast_melee.target() : 0;
                        let cast_target_correct = cast_melee ? true : false;
                        if (cast_melee) {
                            const target_position: PositionComponent | null = this.get_component<PositionComponent>(cast_target);
                            if (target_position) {
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
                                        const neigh_entity_position: PositionComponent | null = this.get_component<PositionComponent>(neigh_entity);
                                        const neigh_entity_radius: RadiusComponent | null = this.get_component<RadiusComponent>(neigh_entity);
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
                                                const neigh_entity_damage: ApplyDamageComponent | null = this.get_component<ApplyDamageComponent>(neigh_entity);
                                                if (neigh_entity_damage) {
                                                    neigh_entity_damage.extend(entity, melee_damage, DAMAGE_TYPE.MELEE, cast_duration);
                                                } else {
                                                    this.add_component<ApplyDamageComponent>(neigh_entity, new ApplyDamageComponent(entity, melee_damage, DAMAGE_TYPE.MELEE, cast_duration));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // remove cast melee damage component
                        // it should exists
                        this.remove_component<CastMeleeDamageComponent>(entity);

                        // turn to iddle state
                        clear_state_components(local_ecs, STATE.CASTING, entity);
                        state.set_state(STATE.IDDLE);

                        // repeat the same action
                        const ecs = this.get_ecs();
                        if (cast_target_correct && ecs) {
                            const local_navmesh = this.m_navmesh;
                            // TODO: in this case we can start attack even if the target entity is dead
                            // but with cooldawns it is not the case
                            const is_attack = command_init_attack(ecs, local_navmesh, entity, cast_target);
                        } else {
                            // target is invalid, nothing to do
                        }

                    } else if (cast_type == CAST_ACTION.HIDE_ACTIVATION) {
                        external_entity_finish_hide(entity, false);

                        // make after cast action
                        const hide_mode: HideModeComponent | null = this.get_component<HideModeComponent>(entity);
                        if (hide_mode) {
                            hide_mode.activate();

                            // remove this entity from the enemies list for all search enemies
                            // also if it contains active target action, then reset it
                            const search_entities = local_ecs.get_entities<SearchEnemiesSystem>();
                            for (let i = 0, len = search_entities.length; i < len; i++) {
                                const search_entity = search_entities[i];
                                const search_list = this.get_component<EnemiesListComponent>(search_entity);
                                const target_action = this.get_component<TargetActionComponent>(search_entity);
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
                            const speed: SpeedComponent | null = this.get_component<SpeedComponent>(entity);
                            if (speed) {
                                const speed_value = speed.value();
                                speed.set_value(speed_value * speed_multiplier);
                            }

                            external_entity_switch_hide(entity, true);
                        }

                        clear_state_components(local_ecs, STATE.CASTING, entity);
                        state.set_state(STATE.IDDLE);
                    } else if (cast_type == CAST_ACTION.SHADOW_ATTACK) {
                        external_entity_finish_shadow_attack(entity, false);
                        const cast_shadow: CastShadowDamageComponent | null = this.get_component<CastShadowDamageComponent>(entity);
                        if (cast_shadow) {
                            const target_entity = cast_shadow.target();
                            const damage_distance = cast_shadow.distance();

                            const target_position = this.get_component<PositionComponent>(target_entity);
                            const target_radius = this.get_component<RadiusComponent>(target_entity);
                            if (target_position && target_radius) {
                                const target_pos_x = target_position.x();
                                const target_pos_y = target_position.y();
                                const d = distance(position_x, position_y, target_pos_x, target_pos_y);

                                if (d < damage_distance + target_radius.value()) {
                                    const target_apply_damage: ApplyDamageComponent | null = this.get_component<ApplyDamageComponent>(target_entity);
                                    if (target_apply_damage) {
                                        target_apply_damage.extend(entity, 0, DAMAGE_TYPE.ULTIMATE, 0.0);
                                    } else {
                                        this.add_component<ApplyDamageComponent>(target_entity, new ApplyDamageComponent(entity, 0, DAMAGE_TYPE.ULTIMATE, 0.0));
                                    }
                                }
                            }

                            this.remove_component<CastShadowDamageComponent>(entity);
                        }
                        // turn to iddle state
                        clear_state_components(local_ecs, STATE.CASTING, entity);
                        state.set_state(STATE.IDDLE);
                    } else {
                        // unknown cast action
                    }
                }
            }
        }
    }
}

export class StunSwitchSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();
        const local_ecs = this.get_ecs();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
            const stun: StateStunComponent | null = this.get_component<StateStunComponent>(entity);

            if (local_ecs && state && actor_type && stun) {
                const state_value = state.state();
                if (state_value == STATE.STUN) {
                    stun.update(dt);
                    if (stun.is_over()) {

                        clear_state_components(local_ecs, STATE.STUN, entity);
                        state.set_state(STATE.IDDLE);

                        external_entity_finish_stun(entity);
                    }
                }
            }
        }
    }
}
