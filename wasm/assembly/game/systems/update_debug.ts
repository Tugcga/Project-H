import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ACTOR, STATE } from "../constants";
import { is_ordered_list_contains } from "../utilities";

import { StateComponent, StateWalkToPointComponent } from "../components/state";
import { PositionComponent } from "../components/position";
import { ActorTypeComponent } from "../components/actor_type";
import { VisibleQuadGridNeighborhoodComponent } from "../components/visible_quad_grid_neighborhood";
import { NeighborhoodQuadGridIndexComponent } from "../components/neighborhood_quad_grid_index";
import { NeighborhoodQuadGridTrackingSystem } from "./neighborhood_quad_grid_tracking";
import { VisibleQuadGridTrackingSystem } from "./visible_quad_grid_tracking";
import { EnemiesListComponent } from "../components/enemies_list";
import { RadiusSearchComponent } from "../components/radius";

import { DebugSettings } from "../settings";
import { external_debug_entity_walk_path,
         external_debug_close_entity,
         external_debug_visible_quad,
         external_debug_neighborhood_quad,
         external_debug_enemies_list } from "../../external";

export class UpdateDebugSystem extends System {
    private m_debug_settings: DebugSettings;

    private m_is_init: bool = false;
    private m_player_entity: Entity = 0;

    private m_neighborhood_tracking: NeighborhoodQuadGridTrackingSystem;
    private m_visible_tracking: VisibleQuadGridTrackingSystem;

    constructor(in_debug: DebugSettings, 
                in_neighborhood_tracking: NeighborhoodQuadGridTrackingSystem,
                in_visible_tracking: VisibleQuadGridTrackingSystem) {
        super();
        this.m_debug_settings = in_debug;
        this.m_neighborhood_tracking = in_neighborhood_tracking;
        this.m_visible_tracking = in_visible_tracking;
    }

    init(in_player_entity: Entity): void {
        this.m_is_init = true;
        this.m_player_entity = in_player_entity;
    }

    update(dt: f32): void {
        const is_init = this.m_is_init;
        if (is_init) {
            const player_entity = this.m_player_entity;
            const visible_neighborhood: VisibleQuadGridNeighborhoodComponent | null = this.get_component<VisibleQuadGridNeighborhoodComponent>(player_entity);
            const neighborhood_tracking = this.m_neighborhood_tracking;
            const visible_tracking = this.m_visible_tracking;

            const debug = this.m_debug_settings;
            const use_debug = debug.use_debug;
            const debug_show_path = debug.show_path;
            const debug_show_closest = debug.show_closest;
            const debug_show_visible_quad = debug.show_visible_quad;
            const debug_show_neighborhood_quad = debug.show_neighborhood_quad;
            const debug_show_enemy_targets = debug.show_enemy_targets;

            if (visible_neighborhood) {
                const visible_entities = visible_neighborhood.current();

                const entities = this.entities();
                const entities_count = entities.length;

                for (let i = 0, len = entities_count; i < len; i++) {
                    const entity: Entity = entities[i];
                    const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);

                    if (actor_type) {
                        const actor_type_value = actor_type.type();
                        // output debug info about current entity
                        // it does not require active update
                        // but this entity should be visible to the player
                        if (use_debug && (actor_type_value == ACTOR.PLAYER || is_ordered_list_contains<Entity>(visible_entities, entity))) {
                            const state = this.get_component<StateComponent>(entity);
                            if (state) {
                                const state_value = state.state();
                                if (debug_show_path && state_value == STATE.WALK_TO_POINT) {
                                    const walk: StateWalkToPointComponent | null = this.get_component<StateWalkToPointComponent>(entity);
                                    const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                                    if (walk && position) {
                                        // form the array with path point coordinates
                                        // we start from entity position
                                        // and then all points from current target
                                        const all_path_points = walk.path_points();
                                        const target_point_index = walk.target_point_index();
                                        const target_points_count = walk.path_points_count() - target_point_index;

                                        const walk_points = new StaticArray<f32>((target_points_count + 1) * 2);
                                        walk_points[0] = position.x();
                                        walk_points[1] = position.y();

                                        for (let k = 0; k < target_points_count; k++) {
                                            const k_index = target_point_index + k;

                                            walk_points[(k + 1) * 2] = all_path_points[k_index * 3];
                                            walk_points[(k + 1) * 2 + 1] = all_path_points[k_index * 3 + 2];
                                        }

                                        external_debug_entity_walk_path(entity, walk_points);
                                    }
                                }
                            }

                            // for all entities (except player) output closest ones
                            if (debug_show_closest) {
                                const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                                if (position) {
                                    const closest_entities = neighborhood_tracking.get_items_from_position(position.x(), position.y());
                                    for (let k = 0, k_len = closest_entities.length; k < k_len; k++) {
                                        const ce = closest_entities[k];
                                        // output only the pair where entity < other entity
                                        // because each pair presented in two arrays (entity in array for other and vice versa)
                                        if (entity < ce) {
                                            const other_position: PositionComponent | null = this.get_component<PositionComponent>(ce);
                                            if (other_position) {
                                                external_debug_close_entity(entity, position.x(), position.y(), ce, other_position.x(), other_position.y());
                                            }
                                        }
                                    }
                                }
                            }

                            // for player only
                            if (actor_type_value == ACTOR.PLAYER && debug_show_visible_quad) {
                                // here we should output to the client corners of the current player visible quad
                                const quad_index = visible_neighborhood.quad_index();
                                const quad_width_count = visible_tracking.width_count();
                                const quad_size = visible_tracking.quad_size();

                                const y_index = quad_index / quad_width_count;
                                const x_index = quad_index - y_index * quad_width_count;

                                const start_x = <f32>x_index * quad_size;
                                const start_y = <f32>y_index * quad_size;

                                const end_x = <f32>(x_index + 1) * quad_size;
                                const end_y = <f32>(y_index + 1) * quad_size;

                                external_debug_visible_quad(start_x, start_y, end_x, end_y);
                            }

                            if (actor_type_value == ACTOR.PLAYER && debug_show_neighborhood_quad) {
                                const neigh_quad_index: NeighborhoodQuadGridIndexComponent | null = this.get_component<NeighborhoodQuadGridIndexComponent>(entity);
                                if (neigh_quad_index) {
                                    const quad_index = neigh_quad_index.value();
                                    const quad_width_count = neigh_quad_index.width_count();
                                    const quad_size = neigh_quad_index.quad_size();

                                    const y_index = quad_index / quad_width_count;
                                    const x_index = quad_index - y_index * quad_width_count;

                                    const start_x = <f32>x_index * quad_size;
                                    const start_y = <f32>y_index * quad_size;

                                    const end_x = <f32>(x_index + 1) * quad_size;
                                    const end_y = <f32>(y_index + 1) * quad_size;

                                    external_debug_neighborhood_quad(start_x, start_y, end_x, end_y);
                                }
                            }

                            if (actor_type_value == ACTOR.MONSTER && debug_show_enemy_targets) {
                                const enemies_list: EnemiesListComponent | null = this.get_component<EnemiesListComponent>(entity);
                                const radius_search: RadiusSearchComponent | null = this.get_component<RadiusSearchComponent>(entity);
                                if (enemies_list && radius_search && state) {
                                    // each mosnter SHOULD contains these components
                                    const state_value = state.state();
                                    if (state_value != STATE.DEAD) {
                                        external_debug_enemies_list(entity, radius_search.value(), enemies_list.to_static_array());
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