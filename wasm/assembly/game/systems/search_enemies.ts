import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { Navmesh } from "../../pathfinder/navmesh/navmesh";

import { EPSILON, ACTOR, STATE } from "../constants";
import { distance } from "../utilities";

import { PositionComponent } from "../components/position";
import { RadiusSearchEnemies } from "../components/radius";
import { ActorTypeComponent } from "../components/actor_type";
import { TeamComponent } from "../components/team";
import { EnemiesListComponent } from "../components/enemies_list";
import { StateComponent } from "../components/state";

import { SearchQuadGridTrackingSystem } from "./search_quad_grid_tracking";

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

        for (let i = 0, len = entities.length; i < len; i++) {
            const active_entity: Entity = entities[i];

            const active_actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(active_entity);
            const active_position: PositionComponent | null = this.get_component<PositionComponent>(active_entity);
            const active_team: TeamComponent | null = this.get_component<TeamComponent>(active_entity);
            const active_enemies_list: EnemiesListComponent | null = this.get_component<EnemiesListComponent>(active_entity);
            const active_search_radius: RadiusSearchEnemies | null = this.get_component<RadiusSearchEnemies>(active_entity);
            const active_state: StateComponent | null = this.get_component<StateComponent>(active_entity);

            if (active_actor_type && active_position && active_team && active_enemies_list && active_search_radius && active_state) {
                const active_actor_type_value = active_actor_type.type();
                const active_state_value = active_state.state();
                if (active_actor_type_value == ACTOR.MONSTER && active_state_value != STATE.DEAD) {
                    const active_team_value = active_team.team();
                    const active_search_radius_value = active_search_radius.value();
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
                                                // current active actor meat enemy target actor
                                                // add target to the enemies list
                                                // TODO: add target only if it in direct visibility of the active entity
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
