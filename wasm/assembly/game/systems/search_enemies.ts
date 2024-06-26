import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { Navmesh } from "../../pathfinder/navmesh/navmesh";

import { EPSILON, ACTOR, STATE } from "../constants";
import { distance, max, min } from "../utilities";

import { PositionComponent } from "../components/position";
import { RadiusSearchComponent } from "../components/radius";
import { ActorTypeComponent } from "../components/actor_type";
import { TeamComponent } from "../components/team";
import { EnemiesListComponent } from "../components/enemies_list";
import { StateComponent } from "../components/state";
import { SpreadSearchComponent } from "../components/spread_search";
import { HideModeComponent } from "../components/hide_mode";
import { AngleComponent } from "../components/angle";

import { SearchQuadGridTrackingSystem } from "./search_quad_grid_tracking";

import { command_entity_unhide } from "../commands";

// spread limit is a half of the angle of the cone
function is_inside_cone(center_x: f32, center_y: f32, direction_x: f32, direction_y: f32, spread_limit: f32, pos_x: f32, pos_y: f32): bool {
    let to_x = pos_x - center_x;
    let to_y = pos_y - center_y;
    const to_length = Mathf.sqrt(to_x * to_x + to_y * to_y);
    if (to_length > EPSILON) {
        to_x /= to_length;
        to_y /= to_length;
    }

    const directions_dot = to_x * direction_x + to_y * direction_y;
    if (directions_dot < spread_limit) {
        return false;
    } else {
        return true;
    }
}

// in this system we only add entities to the enemies list
// actual remove apply in behaviour system, when select a target and this target is dead or friend
export class SearchEnemiesSystem extends System {
    private m_tracking: SearchQuadGridTrackingSystem;
    private m_navmesh: Navmesh;
    private m_segments_count: u32;  // split all entities into several segments and iterate only through one segment
    private m_segment: u32;  // index of the current segment

    constructor(in_tracking: SearchQuadGridTrackingSystem, in_navmesh: Navmesh, in_segments: u32) {
        super();
        this.m_tracking = in_tracking;
        this.m_navmesh = in_navmesh;
        this.m_segments_count = in_segments;

        this.m_segment = 0;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const local_tracking = this.m_tracking;
        const local_navmesh = this.m_navmesh;
        const local_ecs = this.get_ecs();
        const local_segments_count = this.m_segments_count;
        const local_segment = this.m_segment;

        if (local_ecs) {
            const entities_count = entities.length;
            const onse_step_size = max<u32>(entities_count / local_segments_count, 1);
            const start_index = local_segment * onse_step_size;
            const end_index = min<u32>(onse_step_size * (local_segment + 1), entities_count);

            for (let i = start_index; i < end_index; i++) {
                const active_entity: Entity = entities[i];

                const active_actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(active_entity);
                const active_position: PositionComponent | null = this.get_component<PositionComponent>(active_entity);
                const active_team: TeamComponent | null = this.get_component<TeamComponent>(active_entity);
                const active_enemies_list: EnemiesListComponent | null = this.get_component<EnemiesListComponent>(active_entity);
                const active_search_radius: RadiusSearchComponent | null = this.get_component<RadiusSearchComponent>(active_entity);
                const active_search_spread: SpreadSearchComponent | null = this.get_component<SpreadSearchComponent>(active_entity);
                const active_state: StateComponent | null = this.get_component<StateComponent>(active_entity);
                const active_angle: AngleComponent | null = this.get_component<AngleComponent>(active_entity);

                if (active_actor_type && active_position && active_team && active_enemies_list && active_search_radius && active_search_spread && active_state && active_angle) {
                    const active_actor_type_value = active_actor_type.type();
                    const active_state_value = active_state.state();
                    if (active_actor_type_value == ACTOR.MONSTER && active_state_value != STATE.DEAD) {
                        const active_team_value = active_team.team();
                        const active_search_radius_value = active_search_radius.value();
                        const active_search_spread_value = active_search_spread.value();
                        const active_angle_value = active_angle.value();
                        const active_direction_x = Mathf.cos(active_angle_value);
                        const active_direction_y = Mathf.sin(active_angle_value);
                        const active_spread_limit = Mathf.cos(active_search_spread_value / 2.0);
                        // for each monster we should check all visible actors
                        const pos_x = active_position.x();
                        const pos_y = active_position.y();
                        // in fact here we need not all entities from the grid, but only with non-dead state
                        const in_search = local_tracking.get_items_from_position(pos_x, pos_y);
                        for (let j = 0, j_len = in_search.length; j < j_len; j++) {
                            const target_entity = in_search[j];
                            if (target_entity != active_entity) {
                                // get target team
                                const target_team: TeamComponent | null = this.get_component<TeamComponent>(target_entity);
                                // is it dead
                                const target_state: StateComponent | null = this.get_component<StateComponent>(target_entity);
                                if (target_team && target_state) {
                                    const target_team_value = target_team.team();
                                    const target_state_value = target_state.state();
                                    const target_position: PositionComponent | null = this.get_component<PositionComponent>(target_entity);

                                    if (target_position) {
                                        const target_pos_x = target_position.x();
                                        const target_pos_y = target_position.y();
                                        const d = distance(pos_x, pos_y, target_pos_x, target_pos_y);

                                        if (target_state_value != STATE.DEAD && d < active_search_radius_value) {
                                            // check is the target in direct visibility to the active
                                            const boundary_intersect = local_navmesh.intersect_boundary(pos_x, pos_y, target_pos_x, target_pos_y);
                                            if (boundary_intersect >= 0.9999) {
                                                // no intersections with walls
                                                const is_visible = is_inside_cone(pos_x, pos_y, active_direction_x, active_direction_y, active_spread_limit, target_pos_x, target_pos_y);
                                                if (is_visible) {
                                                    command_entity_unhide(local_ecs, target_entity);
                                                }

                                                if (active_team.is_friend(target_team_value)) {
                                                    // target is a friend of the active
                                                    // share with them ids from enemies list
                                                    const target_enemy_list: EnemiesListComponent | null = this.get_component<EnemiesListComponent>(target_entity);
                                                    if (target_enemy_list) {
                                                        target_enemy_list.extend(active_enemies_list.get_list());
                                                        active_enemies_list.extend(target_enemy_list.get_list());
                                                    }
                                                }
                                                else {
                                                    // enemy inside search radius and in direct visibility
                                                    // check is it in hide mode
                                                    const hide_mode: HideModeComponent | null = this.get_component<HideModeComponent>(target_entity);
                                                    let add_enemy = true;
                                                    if (hide_mode) {
                                                        const is_hide = hide_mode.is_active();
                                                        if (is_hide) {
                                                            if (!is_visible) {
                                                                add_enemy = false;
                                                            }
                                                        }
                                                    }

                                                    if (add_enemy) {
                                                        // current active actor meat enemy target actor
                                                        // add target to the enemies list
                                                        active_enemies_list.add_target(target_entity);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            this.m_segment += 1;
            if (end_index == entities_count) {
                this.m_segment = 0;
            }
        }
    }
}
