import { Navmesh } from "../../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../../promethean/pseudo_random"
import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { STATE, ACTOR, ACTION, COOLDAWN } from "../constants";
import { get_navmesh_path } from "../utilities";

import { ActorTypeComponent } from "../components/actor_type";
import { StateComponent, StateIddleWaitComponent, StateWalkToPointComponent, StateShiftComponent } from "../components/state";
import { PositionComponent } from "../components/position";
import { BuffShiftCooldawnComponent } from "../components/buffs";
import { ShiftCooldawnComponent } from "../components/shift_cooldawn";

import { external_entity_finish_action,
         external_entity_start_cooldawn } from "../../external";

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

    update(dt: f32): void {
        const entities = this.entities();
        const local_random = this.m_random;
        const monster_iddle_start = this.m_monster_iddle_start;
        const monster_iddle_end = this.m_monster_iddle_end;

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const walk_to_point: StateWalkToPointComponent | null = this.get_component<StateWalkToPointComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);

            if (walk_to_point && actor_type && state) {
                if (!walk_to_point.active() || walk_to_point.target_point_index() >= walk_to_point.path_points_count()) {
                    // the actor comes to the finall target
                    // delete the StateWalkToPointComponent component
                    this.remove_component<StateWalkToPointComponent>(entity);

                    // change the state
                    const actor_value = actor_type.type();
                    if (actor_value == ACTOR.PLAYER) {
                        // does not create any special component for the player
                        state.set_state(STATE.IDDLE);
                    } else if(actor_value == ACTOR.MONSTER) {
                        state.set_state(STATE.IDDLE_WAIT);
                        // generate random wait time
                        const wait_time = <f32>local_random.next_float(monster_iddle_start, monster_iddle_end);
                        // assign the state component
                        this.add_component(entity, new StateIddleWaitComponent(wait_time));
                    }
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
                    external_entity_finish_action(entity, ACTION.SHIFT);

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