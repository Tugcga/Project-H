import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { Navmesh } from "../../pathfinder/navmesh/navmesh";

import { EPSILON, ACTOR, STATE } from "../constants";
import { distance } from "../utilities";

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

// in this system we only add entities to the enemies list
// actual remove apply in behaviour system, when select a target and this target is dead or friend
export class SearchEnemiesSystem extends System {
    private m_tracking: SearchQuadGridTrackingSystem;
    private m_navmesh: Navmesh;

    constructor(in_tracking: SearchQuadGridTrackingSystem, in_navmesh: Navmesh) {
        super();
        this.m_tracking = in_tracking;
        this.m_navmesh = in_navmesh;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const local_tracking = this.m_tracking;
        const local_navmesh = this.m_navmesh;
        const local_ecs = this.get_ecs();

        if (local_ecs) {
            for (let i = 0, len = entities.length; i < len; i++) {
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
                                                    // emeny inside search radius and in direct visibility
                                                    // check is it in hide mode
                                                    const hide_mode: HideModeComponent | null = this.get_component<HideModeComponent>(target_entity);
                                                    let add_enemy = true;
                                                    if (hide_mode) {
                                                        const is_hide = hide_mode.is_active();
                                                        if (is_hide) {
                                                            // target in the hide move
                                                            // calculate direction to the target
                                                            let to_x = target_pos_x - pos_x;
                                                            let to_y = target_pos_y - pos_y;
                                                            const to_length = Mathf.sqrt(to_x * to_x + to_y * to_y);
                                                            if (to_length > EPSILON) {
                                                                to_x /= to_length;
                                                                to_y /= to_length;
                                                            }

                                                            const directions_dot = to_x * active_direction_x + to_y * active_direction_y;
                                                            if (directions_dot < active_spread_limit) {
                                                                // target outside of the visible cone
                                                                add_enemy = false;
                                                            } else {
                                                                // target in hide mode, but active is discover it
                                                                // disable hide mode in the target
                                                                command_entity_unhide(local_ecs, target_entity);
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
        }
    }
}
