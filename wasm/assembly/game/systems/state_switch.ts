import { Navmesh } from "../../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../../promethean/pseudo_random"
import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ECS } from "../../simple_ecs/simple_ecs";
import { EPSILON, STATE, ACTOR, COOLDAWN, TARGET_ACTION, CAST_ACTION, START_CAST_STATUS } from "../constants";
import { direction_to_angle, get_navmesh_path, distance } from "../utilities";
import { try_start_melee_attack, clear_state_components, command_init_attack } from "../ecs_setup";

import { ActorTypeComponent } from "../components/actor_type";
import { StateComponent, StateIddleWaitComponent, StateWalkToPointComponent, StateShiftComponent, StateCastComponent } from "../components/state";
import { PositionComponent } from "../components/position";
import { BuffShiftCooldawnComponent, BuffMeleeAttackCooldawnComponent } from "../components/buffs";
import { ShiftCooldawnComponent } from "../components/shift_cooldawn";
import { TargetActionComponent } from "../components/target_action";
import { RadiusComponent } from "../components/radius";
import { AtackDistanceComponent } from "../components/atack_distance";
import { AtackTimeComponent } from "../components/atack_time";
import { MeleeAttackCooldawnComponent } from "../components/melee_attack_cooldawn";
import { MeleeDamageDistanceComponent, MeleeDamageSpreadComponent } from "../components/damage";
import { CastMeleeDamageComponent } from "../components/cast";
import { TargetAngleComponent } from "../components/target_angle";
import { PreferredVelocityComponent } from "../components/preferred_velocity";

import { external_entity_finish_shift,
         external_entity_start_cooldawn,
         external_entity_finish_melee_attack } from "../../external";

function assign_iddle_state(system: System,
                            random: PseudoRandom,
                            monster_iddle_timers: Array<f32>,
                            entity: Entity,
                            actor_type: ActorTypeComponent,
                            state: StateComponent): void {
    // change the state
    const actor_value = actor_type.type();
    if (actor_value == ACTOR.PLAYER) {
        // does not create any special component for the player
        state.set_state(STATE.IDDLE);
    } else if(actor_value == ACTOR.MONSTER) {
        state.set_state(STATE.IDDLE_WAIT);
        // generate random wait time
        const wait_time = <f32>random.next_float(monster_iddle_timers[0], monster_iddle_timers[1]);
        // assign the state component
        system.add_component(entity, new StateIddleWaitComponent(wait_time));
    }
}

// several systems from this file controll the switch between different states of entitites
// this system controlls when the actor comes to the finall target point
export class WalkToPointSwitchSystem extends System {
    private m_random: PseudoRandom;
    private m_monster_iddle_start: f32;
    private m_monster_iddle_end: f32;

    constructor(in_random: PseudoRandom, in_monster_iddle_time: Array<f32>) {
        super();

        this.m_random = in_random;
        this.m_monster_iddle_start = in_monster_iddle_time[0];
        this.m_monster_iddle_end = in_monster_iddle_time[1];
    }

    monster_iddle_start(): f32 {
        return this.m_monster_iddle_start;
    }

    monster_iddle_end(): f32 {
        return this.m_monster_iddle_end;
    }

    random(): PseudoRandom {
        return this.m_random;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const local_random = this.m_random;

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const walk_to_point: StateWalkToPointComponent | null = this.get_component<StateWalkToPointComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const attack_distance: AtackDistanceComponent | null = this.get_component<AtackDistanceComponent>(entity);
            const attack_time: AtackTimeComponent | null = this.get_component<AtackTimeComponent>(entity);
            const entity_target_action: TargetActionComponent | null = this.get_component<TargetActionComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);
            
            const damage_distance: MeleeDamageDistanceComponent | null = this.get_component<MeleeDamageDistanceComponent>(entity);
            const damage_spread: MeleeDamageSpreadComponent | null = this.get_component<MeleeDamageSpreadComponent>(entity);

            if (pref_velocity && walk_to_point && actor_type && state && entity_target_action && position && attack_distance && attack_time && damage_distance && damage_spread) {
                if (entity_target_action.type() == TARGET_ACTION.ATACK) {
                    const local_ecs: ECS | null = this.get_ecs();
                    const target_entity: Entity = entity_target_action.entity();

                    const target_position: PositionComponent | null = this.get_component<PositionComponent>(target_entity);
                    const target_radius: RadiusComponent | null = this.get_component<RadiusComponent>(target_entity);
                    const target_state: StateComponent | null = this.get_component<StateComponent>(target_entity);

                    if (local_ecs && target_position && target_radius && target_state) {
                        const prev_state_value = state.state();
                        const melee_status = try_start_melee_attack(local_ecs, entity, target_entity,
                                                                    position,
                                                                    attack_distance,
                                                                    attack_time,
                                                                    damage_distance,
                                                                    damage_spread,
                                                                    state,
                                                                    entity_target_action,
                                                                    target_position,
                                                                    target_radius,
                                                                    target_state);
                        if (melee_status == START_CAST_STATUS.OK) {
                            pref_velocity.set(0.0, 0.0);
                            clear_state_components(local_ecs, prev_state_value, entity);
                        } else {
                            // there are several reasons to fial the cast start
                            if(melee_status == START_CAST_STATUS.FAIL_COOLDAWN) {
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
                } else if (!walk_to_point.active() || walk_to_point.target_point_index() >= walk_to_point.path_points_count()) {
                    // the actor comes to the finall target point
                    this.remove_component<StateWalkToPointComponent>(entity);
                    assign_iddle_state(this,
                                       local_random,
                                       [this.m_monster_iddle_start, this.m_monster_iddle_end],
                                       entity,
                                       actor_type,
                                       state);
                }
            }
        }
    }
}

export class ShiftSwitchSystem extends System {
    private m_random: PseudoRandom;
    private m_monster_iddle_start: f32;
    private m_monster_iddle_end: f32;

    constructor(in_random: PseudoRandom, in_monster_iddle_time: Array<f32>) {
        super();

        this.m_random = in_random;
        this.m_monster_iddle_start = in_monster_iddle_time[0];
        this.m_monster_iddle_end = in_monster_iddle_time[1];
    }

    update(dt: f32): void {
        const local_random = this.m_random;
        const monster_iddle_start = this.m_monster_iddle_start;
        const monster_iddle_end = this.m_monster_iddle_end;

        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const shift: StateShiftComponent | null = this.get_component<StateShiftComponent>(entity);

            if (state && shift) {
                const state_value = state.state();
                const shift_active = shift.active();

                if (state_value == STATE.SHIFTING && shift_active == false) {
                    // switch state to iddle (for now and simplicity)
                    this.remove_component<StateShiftComponent>(entity);
                    external_entity_finish_shift(entity);

                    // add cooldawn component
                    const cooldawn: ShiftCooldawnComponent | null = this.get_component<ShiftCooldawnComponent>(entity);
                    if (cooldawn) {
                        const cooldawn_value = cooldawn.value();
                        this.add_component<BuffShiftCooldawnComponent>(entity, new BuffShiftCooldawnComponent(cooldawn_value));
                        external_entity_start_cooldawn(entity, COOLDAWN.SHIFT, cooldawn_value);
                    }

                    const actor: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
                    if (actor) {
                        const actor_value = actor.type();
                        if (actor_value == ACTOR.PLAYER) {
                            state.set_state(STATE.IDDLE);
                        } else if (actor_value == ACTOR.MONSTER) {
                            state.set_state(STATE.IDDLE_WAIT);
                            const wait_time = <f32>local_random.next_float(monster_iddle_start, monster_iddle_end);
                            this.add_component(entity, new StateIddleWaitComponent(wait_time));
                        }
                    }
                }
            }
        }
    }
}

export class CastSwitchSystem extends System {
    private m_random: PseudoRandom;
    private m_navmesh: Navmesh;  // used to call attack after cast is finish
    private m_monster_iddle_start: f32;
    private m_monster_iddle_end: f32;

    constructor(in_random: PseudoRandom, in_navmesh: Navmesh, in_monster_iddle_time: Array<f32>) {
        super();

        this.m_random = in_random;
        this.m_navmesh = in_navmesh;
        this.m_monster_iddle_start = in_monster_iddle_time[0];
        this.m_monster_iddle_end = in_monster_iddle_time[1];
    }

    update(dt: f32): void {
        const local_random = this.m_random;
        const monster_iddle_start = this.m_monster_iddle_start;
        const monster_iddle_end = this.m_monster_iddle_end;

        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const cast: StateCastComponent | null = this.get_component<StateCastComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
            const target_angle: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);

            if (state && cast && actor_type && target_angle && position/* && melee_cooldawn*/) {
                cast.increase(dt);
                const cast_type = cast.type();

                // with respect of the cast type we should rotate the entity to the target
                if (cast_type == CAST_ACTION.MELEE_ATACK) {
                    // rotate to the target
                    // target is stored in CastMeleeDamageComponent
                    const cast_damage: CastMeleeDamageComponent | null = this.get_component<CastMeleeDamageComponent>(entity);
                    if (cast_damage) {
                        const target_entity = cast_damage.target();
                        if (target_entity != entity) {
                            // get position of the target entity
                            const target_position: PositionComponent | null = this.get_component<PositionComponent>(target_entity);
                            if (target_position) {
                                let dir_x = target_position.x() - position.x();
                                let dir_y = target_position.y() - position.y();
                                const dir_length = <f32>Math.sqrt(dir_x * dir_x + dir_y * dir_y);
                                if (dir_length > EPSILON) {
                                    dir_x /= dir_length;
                                    dir_y /= dir_length;
                                    // define target angle
                                    target_angle.set_value(direction_to_angle(dir_x, dir_y));
                                }
                            }
                        }
                    }
                }

                if (!cast.active()) {
                    // cast is finish
                    // we should apply post cast action, delete cast action component and switch to the iddle state
                    if (cast_type == CAST_ACTION.MELEE_ATACK) {
                        external_entity_finish_melee_attack(entity, false);
                        const cast_melee: CastMeleeDamageComponent | null = this.get_component<CastMeleeDamageComponent>(entity);
                        const cast_target = cast_melee ? cast_melee.target() : 0;
                        let cast_target_correct = cast_melee ? true : false;  // if the target is ded after damage, make it false
                        if (cast_melee) {
                            // TODO: apply damage
                            const melee_damage = cast_melee.damage();

                        }

                        // remove cast melee damage component
                        // it should exists
                        this.remove_component<CastMeleeDamageComponent>(entity);

                        // turn to iddle state
                        this.remove_component<StateCastComponent>(entity);
                        assign_iddle_state(this,
                                           local_random,
                                           [monster_iddle_start, monster_iddle_end],
                                           entity,
                                           actor_type,
                                           state);

                        // repeat the same action
                        const ecs = this.get_ecs();
                        if (cast_target_correct && ecs) {
                            const local_navmesh = this.m_navmesh;
                            const is_attack = command_init_attack(ecs, local_navmesh, entity, cast_target);
                        } else {
                            // target is invalid, nothing to do
                        }

                    } else {
                        // unknown cast action
                    }
                }
            }
        }
    }
}

export class IddleWaitSwitchSystem extends System {
    private m_navmesh: Navmesh;
    private m_random: PseudoRandom;
    private m_random_target_radius: f32;

    constructor(in_navmesh: Navmesh, in_random: PseudoRandom, in_random_target_radius: f32) {
        super();

        this.m_navmesh = in_navmesh;
        this.m_random = in_random;
        this.m_random_target_radius = in_random_target_radius;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const local_navmesh = this.m_navmesh;
        const local_random = this.m_random;
        const random_target_radius = this.m_random_target_radius;

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const iddle_wait: StateIddleWaitComponent | null = this.get_component<StateIddleWaitComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);

            if (iddle_wait && actor_type && state && position) {
                iddle_wait.increase_time(dt);
                const actor_type_value = actor_type.type();
                if (iddle_wait.is_over() && actor_type_value == ACTOR.MONSTER) {
                    const pos_x = position.x();
                    const pos_y = position.y();
                    // select random target point
                    const target_x = <f32>local_random.next_float(pos_x - random_target_radius, pos_x + random_target_radius);
                    const target_y = <f32>local_random.next_float(pos_y - random_target_radius, pos_y + random_target_radius);

                    const path = get_navmesh_path(local_navmesh, pos_x, pos_y, target_x, target_y);
                    // check is the path is valid
                    // it can be invalid if we select random target point outside of the walkable area
                    if (path.length > 0) {
                        this.remove_component<StateIddleWaitComponent>(entity);
                        state.set_state(STATE.WALK_TO_POINT);
                        const walk_to_point = new StateWalkToPointComponent();
                        walk_to_point.define_path(path);
                        this.add_component<StateWalkToPointComponent>(entity, walk_to_point);
                    }
                }
            }
        }
    }
}