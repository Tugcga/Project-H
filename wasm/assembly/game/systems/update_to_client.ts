import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ACTOR, STATE } from "../constants";
import { is_ordered_list_contains } from "../utilities";

import { PositionComponent } from "../components/position";
import { AngleComponent } from "../components/angle";
import { ActorTypeComponent } from "../components/actor_type";
import { UpdateToClientComponent } from "../components/update_to_client";
import { MoveTagComponent } from "../components/tags";
import { VisibleQuadGridNeighborhoodComponent } from "../components/visible_quad_grid_neighborhood";
import { StateComponent, StateWalkToPointComponent } from "../components/state";

import { NeighborhoodQuadGridTrackingSystem } from "./neighborhood_quad_grid_tracking";

import { external_define_player_changes,
         external_define_monster_changes,
         external_define_total_update_entities,
         external_debug_entity_walk_path,
         external_debug_close_entity } from "../../external";
 import { DebugSettings } from "../settings";

// we should init this system by define player entity value
// it requires visible actors around the player
// this data can be getted from player component
// so, we should know the player entity
export class UpdateToClientSystem extends System {
    private m_is_init: bool = false;
    private m_player_entity: Entity = 0;
    private m_debug_settings: DebugSettings;
    private m_neighborhood_tracking: NeighborhoodQuadGridTrackingSystem;

    constructor(in_debug: DebugSettings, in_tracking: NeighborhoodQuadGridTrackingSystem) {
        super();

        this.m_debug_settings = in_debug;
        this.m_neighborhood_tracking = in_tracking;
    }

    init(in_player_entity: Entity): void {
        this.m_is_init = true;
        this.m_player_entity = in_player_entity;
    }

    update(dt: f32): void {
        const is_init = this.m_is_init;
        const debug = this.m_debug_settings;
        const use_debug = debug.use_debug;
        const debug_show_path = debug.show_path;
        const debug_show_closest = debug.show_closest;
        const tracking = this.m_neighborhood_tracking;

        if (is_init) {
            const player_entity = this.m_player_entity;
            const visible_neighborhood: VisibleQuadGridNeighborhoodComponent | null = this.get_component<VisibleQuadGridNeighborhoodComponent>(player_entity);
            if (visible_neighborhood) {
                // this is an oredered list of entities
                // entities visible to player
                // we should update on client only these entities representations
                const visible_entities = visible_neighborhood.current();

                // here are all entities, which we can update on the client
                // some of them should be updated, but some of them are not
                const entities = this.entities();
                const entities_count = entities.length;
                // output the total number of entities
                external_define_total_update_entities(entities_count);

                for (let i = 0, len = entities_count; i < len; i++) {
                    const entity: Entity = entities[i];

                    const should_update: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(entity);
                    const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);
                    if (should_update && actor_type) {
                        const should_update_value = should_update.value();
                        const actor_type_value = actor_type.type();
                        if (should_update_value) {
                            if (actor_type_value == ACTOR.PLAYER) {
                                const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
                                const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                                const angle: AngleComponent | null = this.get_component<AngleComponent>(entity);

                                if (move && position && angle) {
                                    external_define_player_changes(position.x(), position.y(), angle.value(), move.value());
                                }
                            } else if (actor_type_value == ACTOR.MONSTER) {
                                if (is_ordered_list_contains(visible_entities, entity)) {
                                    const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
                                    const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                                    const angle: AngleComponent | null = this.get_component<AngleComponent>(entity);

                                    if (move && position && angle) {
                                        external_define_monster_changes(entity, position.x(), position.y(), angle.value(), move.value());
                                    }
                                }
                            }

                            should_update.set_value(false);
                        }

                        // output debug info about current entity
                        // it does not require active update
                        // but this entity should be visible to the player
                        if (use_debug && (actor_type_value == ACTOR.PLAYER || is_ordered_list_contains(visible_entities, entity))) {
                            const state = this.get_component<StateComponent>(entity);
                            if (state) {
                                const state_value = state.state();
                                if (state_value == STATE.WALK_TO_POINT && debug_show_path) {
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
                                    const closest_entities = tracking.get_items_from_position(position.x(), position.y());
                                    for (let k = 0, k_len = closest_entities.length; k < k_len; k++) {
                                        const ce = closest_entities[k];
                                        // output only the pair where entity < other entity
                                        // because each pair presented in tow arrays (entity in array for other and vice versa)
                                        if (entity < ce) {
                                            const other_position: PositionComponent | null = this.get_component<PositionComponent>(ce);
                                            if (other_position) {
                                                external_debug_close_entity(entity, position.x(), position.y(), ce, other_position.x(), other_position.y());
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