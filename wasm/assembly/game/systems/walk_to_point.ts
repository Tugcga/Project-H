import { Navmesh } from "../../pathfinder/navmesh/navmesh";
import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { EPSILON, TARGET_ACTION, TARGET_ACTION_TYPE } from "../constants";
import { get_navmesh_path } from "../utilities";

import { PreferredVelocityComponent } from "../components/preferred_velocity";
import { StateWalkToPointComponent } from "../components/state";
import { PositionComponent } from "../components/position";
import { SpeedComponent } from "../components/speed";
import { TargetActionComponent } from "../components/target_action"

// used for entitys in walk to point state (and contains corresponding component)
// this system calculates preffered velocity
// actual move happens in another system (after rvo)
export class WalkToPointSystem extends System {
    private m_path_recalculate_time: f32 = 0.0;
    private m_path_to_target_recalculate_time: f32 = 0.0;
    private m_navmesh: Navmesh;

    constructor(in_navmesh: Navmesh, in_recalculate_time: f32, in_target_recalculate_time: f32) {
        super();

        this.m_navmesh = in_navmesh;
        this.m_path_recalculate_time = in_recalculate_time;
        this.m_path_to_target_recalculate_time = in_target_recalculate_time;
    }

    update(dt: f32): void {
        const recalculate_time = this.m_path_recalculate_time;
        const recalculate_target_time = this.m_path_to_target_recalculate_time;
        const navmesh = this.m_navmesh;

        const entities = this.entities();
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const speed: SpeedComponent | null = this.get_component<SpeedComponent>(entity);
            const walk_to_point: StateWalkToPointComponent | null = this.get_component<StateWalkToPointComponent>(entity);
            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);
            const target_action: TargetActionComponent | null = this.get_component<TargetActionComponent>(entity);

            if (position && speed && walk_to_point && pref_velocity && target_action) {
                const spend_time = walk_to_point.get_spend_time();
                const target_action_type = target_action.type();
                const target_action_point_type = target_action.point_type();

                if (((target_action_point_type == TARGET_ACTION_TYPE.NONE || target_action_point_type == TARGET_ACTION_TYPE.POSITION) && spend_time > recalculate_time) ||
                    (target_action_point_type == TARGET_ACTION_TYPE.ENTITY && spend_time > recalculate_target_time)) {
                    // update the path of the entity
                    const curent_x = position.x();
                    const curent_y = position.y();
                    let final_target_x = position.x();
                    let final_target_y = position.y();

                    if (target_action_point_type == TARGET_ACTION_TYPE.ENTITY) {
                        // there is a target
                        // we should get the position of the target entity
                        const target_entity = target_action.entity();
                        const target_position: PositionComponent | null = this.get_component<PositionComponent>(target_entity);
                        if (target_position) {
                            final_target_x = target_position.x();
                            final_target_y = target_position.y();
                        }
                    } else {
                        const path = walk_to_point.path_points();
                        const path_values_count = path.length;
                        if (path_values_count >= 3) {
                            final_target_x = path[path_values_count - 3];
                            final_target_y = path[path_values_count - 1];
                        }
                    }

                    const new_path = get_navmesh_path(navmesh, curent_x, curent_y, final_target_x, final_target_y);
                    if (new_path.length > 0) {
                        // reassign the path
                        walk_to_point.define_path(new_path);
                    }
                } else {
                    // increase the time
                    walk_to_point.increase_spend_time(dt);
                }

                if (walk_to_point.active() && walk_to_point.target_point_index() < walk_to_point.path_points_count()) {
                    const target_x: f32 = walk_to_point.target_x();
                    const target_y: f32 = walk_to_point.target_y();

                    const current_x: f32 = position.x();
                    const current_y: f32 = position.y();

                    // calculate direction vector
                    var dir_x = target_x - current_x;
                    var dir_y = target_y - current_y;

                    // normalize
                    const dir_length = <f32>Math.sqrt(dir_x * dir_x + dir_y * dir_y);
                    if (dir_length > EPSILON) {
                        dir_x = dir_x / dir_length;
                        dir_y = dir_y / dir_length;
                    }

                    // calculate next point
                    const speed_value: f32 = speed.value();
                    const new_x: f32 = current_x + dir_x * dt * speed_value;
                    const new_y: f32 = current_y + dir_y * dt * speed_value;

                    // check, may be we overjump target point
                    const new_dir_x = target_x - new_x;
                    const new_dir_y = target_y - new_y;

                    // calculate dot product between old and new directions
                    const d: f32 = new_dir_x * dir_x + new_dir_y * dir_y;

                    // should we select next point in the path?
                    let switch_to_next = false;
                    if (dir_length <= EPSILON || d < 0.0) {
                        switch_to_next = true;
                    }

                    if (switch_to_next) {
                        walk_to_point.increate_target_index();
                        // set velocity to step excectly to the target point
                        const s_sh = dir_length / dt;
                        pref_velocity.set(dir_x * s_sh, dir_y * s_sh);
                    } else {
                        // use dir for preferred velocity
                        pref_velocity.set(dir_x * speed_value, dir_y * speed_value);
                    }
                }
            }
        }
    }
}