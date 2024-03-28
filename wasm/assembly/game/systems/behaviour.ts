import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ECS } from "../../simple_ecs/simple_ecs";
import { Navmesh } from "../../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../../promethean/pseudo_random"
import { List } from "../../pathfinder/common/list";

import { STATE } from "../constants";
import { distance } from "../utilities";

import { StateComponent } from "../components/state";
import { EnemiesListComponent } from "../components/enemies_list";
import { PositionComponent } from "../components/position";
import { BehaviourComponent } from "../components/behaviour";
import { command_init_attack, command_move_to_point } from "../commands";

export class BehaviourSystem extends System {
    private m_to_delete_buffer: List<u32>;  // store here indices in the enemies list which should be delete from it (when the entity is dead, for example)
    private m_navmesh: Navmesh;
    private m_random: PseudoRandom;
    private m_iddle_wait_min: f32;
    private m_iddle_wait_max: f32;
    private m_random_walk_radius: f32;

    constructor(in_navmesh: Navmesh, in_random: PseudoRandom, in_iddle_wait_min: f32, in_iddle_wait_max: f32, in_random_walk_radius: f32) {
        super();

        this.m_to_delete_buffer = new List<u32>(4);
        this.m_navmesh = in_navmesh;
        this.m_random = in_random;
        this.m_iddle_wait_min = in_iddle_wait_min;
        this.m_iddle_wait_max = in_iddle_wait_max;
        this.m_random_walk_radius = in_random_walk_radius;
    }

    update(dt: f32): void {
        const local_delete = this.m_to_delete_buffer;
        const local_ecs = this.get_ecs();
        const local_navmesh = this.m_navmesh;
        const local_random = this.m_random;
        const local_iddle_wait_min = this.m_iddle_wait_min;
        const local_iddle_wait_max = this.m_iddle_wait_max;
        const local_random_walk_radius = this.m_random_walk_radius;

        if (local_ecs) {
            const entities = this.entities();
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity: Entity = entities[i];
                local_delete.reset();

                const enemies_list: EnemiesListComponent | null = this.get_component<EnemiesListComponent>(entity);
                const state: StateComponent | null = this.get_component<StateComponent>(entity);
                const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                const behaviour: BehaviourComponent | null = this.get_component<BehaviourComponent>(entity);

                if (enemies_list && state && position && behaviour) {
                    const state_value = state.state();
                    if (state_value == STATE.IDDLE || state_value == STATE.WALK_TO_POINT) {
                        // search the closest target in the list
                        // TODO: way be search the entity with the lowest hp?
                        const pos_x = position.x();
                        const pos_y = position.y();
                        const enemies = enemies_list.get_list();
                        let closest_index: i32 = -1;
                        let closest_distance: f32 = Infinity;
                        for (let j = 0, j_len = enemies.length; j < j_len; j++) {
                            const target = enemies[j];
                            const target_position: PositionComponent | null = this.get_component<PositionComponent>(target);
                            const target_state: StateComponent | null = this.get_component<StateComponent>(target);
                            if (target_position && target_state) {
                                const target_state_value = target_state.state();
                                if (target_state_value == STATE.DEAD) {
                                    local_delete.push(j);
                                } else {
                                    const target_pos_x = target_position.x();
                                    const target_pos_y = target_position.y();

                                    const d = distance(pos_x, pos_y, target_pos_x, target_pos_y);
                                    if (d < closest_distance) {
                                        closest_distance = d;
                                        closest_index = j;
                                    }
                                }
                            }
                        }

                        if (closest_index >= 0) {
                            const target_entity = enemies[closest_index];
                            // say to attack the entity
                            command_init_attack(local_ecs, local_navmesh, entity, target_entity);
                        } else {
                            // there are no targets
                            // make iddle move
                            if (state_value == STATE.IDDLE) {
                                const iddle_wait = behaviour.iddle_wait_active();
                                if (iddle_wait) {
                                    // it's already activate
                                    // update the time
                                    const update_result = behaviour.update_iddle_wait(dt);
                                    if (!update_result) {
                                        // update is false, it means that the time is over
                                        // select random target point
                                        const point_x = <f32>local_random.next_float(pos_x - local_random_walk_radius, pos_x + local_random_walk_radius);
                                        const point_y = <f32>local_random.next_float(pos_y - local_random_walk_radius, pos_y + local_random_walk_radius);
                                        const is_define_path = command_move_to_point(local_ecs, local_navmesh, entity, point_x, point_y);
                                        if (!is_define_path) {
                                            // fail to create the path
                                            // repeat it on the next update
                                            behaviour.activate_iddle_wait(0.0);
                                        }
                                    }
                                } else {
                                    // iddle wait is not active, activate it
                                    behaviour.activate_iddle_wait(<f32>local_random.next_float(local_iddle_wait_min, local_iddle_wait_max));
                                }
                            }
                        }

                        // remove entities from the list
                        const delete_count = local_delete.length;
                        for (let j = 0; j < delete_count; j++) {
                            enemies_list.remove_at(local_delete[delete_count - 1 - j]);
                        }
                    }
                }
            }
        }
    }
}