import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ECS } from "../../simple_ecs/simple_ecs";
import { List } from "../../pathfinder/common/list";

import { STATE, ACTOR, REMOVE_REASON } from "../constants";
import { is_disc_intersect_interval } from "../utilities";

import { PositionComponent,
         PreviousPositionComponent,
         TargetPositionComponent } from "../components/position";
import { UpdateToClientComponent} from "../components/update_to_client";
import { LifeTimerComponent } from "../components/life_timer";
import { HostComponent } from "../components/host";
import { ActorTypeComponent } from "../components/actor_type";
import { RadiusComponent } from "../components/radius";
import { VisibleQuadGridIndexComponent } from "../components/visible_quad_grid_index";
import { TeamComponent } from "../components/team";
import { StateComponent } from "../components/state";

import { NeighborhoodQuadGridTrackingSystem } from "./neighborhood_quad_grid_tracking";
import { VisibleQuadGridTrackingSystem } from "./visible_quad_grid_tracking";

import { external_remove_entity } from "../../external";
import { apply_bullet_attack } from "../skills/apply";

function delete_bullet(ecs: ECS, vis_tracking: VisibleQuadGridTrackingSystem, entity: Entity, reason: REMOVE_REASON): void {
    // remove entity from the visibility grid
    const quad_index = ecs.get_component<VisibleQuadGridIndexComponent>(entity);
    if (quad_index) {
        const quad_index_value = quad_index.value();
        vis_tracking.remove_entity(entity, quad_index_value);
    }
    // bullet does not tracking by other quad grid systems (neighborhood, search)
    // so, we should not delete it from these systems

    ecs.destroy_entity(entity);
    external_remove_entity(entity, ACTOR.BULLET, reason);
}

export class BulletSystem extends System {
    private m_neighborhood_tracking: NeighborhoodQuadGridTrackingSystem;
    private m_visibility_tracking: VisibleQuadGridTrackingSystem;
    private m_buffer_come_target: List<Entity>;
    private m_buffer_apply_damage: List<Entity>;

    constructor(in_neightborhood_tracking: NeighborhoodQuadGridTrackingSystem,
                in_visibility_tracking: VisibleQuadGridTrackingSystem) {
        super();

        this.m_neighborhood_tracking = in_neightborhood_tracking;
        this.m_visibility_tracking = in_visibility_tracking;
        this.m_buffer_come_target = new List<Entity>();
        this.m_buffer_apply_damage = new List<Entity>();
    }

    update(dt: f32): void {
        const entities = this.entities();
        const local_neigh_tracking = this.m_neighborhood_tracking;
        const local_vis_tracking = this.m_visibility_tracking;
        const local_come_target = this.m_buffer_come_target;
        const local_apply_damage = this.m_buffer_apply_damage;
        const local_ecs = this.get_ecs();

        local_come_target.reset();  // store here entities which should be deleted
        local_apply_damage.reset();
        if (local_ecs) {
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity: Entity = entities[i];
                let should_delete = false;

                const position = this.get_component<PositionComponent>(entity);
                const prev_position = this.get_component<PreviousPositionComponent>(entity);
                const target_position = this.get_component<TargetPositionComponent>(entity);
                const life_timer = this.get_component<LifeTimerComponent>(entity);
                const host = this.get_component<HostComponent>(entity);
                const update_to_client = this.get_component<UpdateToClientComponent>(entity);

                if (position && prev_position && target_position && life_timer && host && update_to_client) {
                    const position_x = position.x();
                    const position_y = position.y();
                    const prev_position_x = prev_position.x();
                    const prev_position_y = prev_position.y();
                    // increase life timer
                    life_timer.set_value(life_timer.value() + dt);

                    // get entities from current position
                    const closed_entities = local_neigh_tracking.get_items_from_position(position_x, position_y);
                    // this list is not sorted
                    const host_entity = host.value();

                    // check is bullet collide with some entity
                    for (let j = 0, j_len = closed_entities.length; j < j_len; j++) {
                        const e = closed_entities[j];
                        if (e != entity && e != host_entity) {
                            // ignore the same bullet and also the host
                            // check is it player or monster
                            const e_actor = this.get_component<ActorTypeComponent>(e);
                            const e_state = this.get_component<StateComponent>(e);
                            if (e_actor && e_state) {
                                const e_actor_type = e_actor.type();
                                const e_state_value = e_state.state();
                                if ((e_actor_type == ACTOR.PLAYER || e_actor_type == ACTOR.MONSTER) && e_state_value != STATE.DEAD) {
                                    const e_position = this.get_component<PositionComponent>(e);
                                    const e_radius = this.get_component<RadiusComponent>(e);
                                    const e_team = this.get_component<TeamComponent>(e);

                                    if (e_position && e_radius && e_team) {
                                        // if target has another team with respect to the bullet (it obtained from the host when created)
                                        const is_intersect = is_disc_intersect_interval(e_position.x(), e_position.y(), e_radius.value(),
                                                                                        prev_position_x, prev_position_y, position_x, position_y);
                                        if (is_intersect) {
                                            should_delete = true;
                                            local_apply_damage.push(entity);

                                            // apply damage to the target
                                            apply_bullet_attack(local_ecs, entity, e);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!should_delete) {
                        // bullet does not collide with any entity
                        // check may be it over it target point
                        // calc vector to target position
                        const target_x = target_position.x();
                        const target_y = target_position.y();

                        const to_target_x = target_x - position_x;
                        const to_target_y = target_y - position_y;

                        // also calculate direction from previous to current position
                        const to_x = position_x - prev_position_x;
                        const to_y = position_y - prev_position_y;

                        const dot = to_target_x * to_x + to_target_y * to_y;
                        if (dot < 0.0) {
                            // bullet skip over target position
                            should_delete = true;
                            local_come_target.push(entity);
                        }
                    }

                    if (!should_delete) {
                        // each bullet always move, so, always update it at the client
                        update_to_client.set_value(true);

                        // copy position to prev position
                        prev_position.set(position_x, position_y);
                    }
                }
            }

            // after all remove life-end bullets
            for (let i = 0, len = local_come_target.length; i < len; i++) {
                const entity = local_come_target[i];
                delete_bullet(local_ecs, local_vis_tracking, entity, REMOVE_REASON.COME_TARGET);
            }

            // and also bullet which collide with some target
            for (let i = 0, len = local_apply_damage.length; i < len; i++) {
                const entity = local_apply_damage[i];
                delete_bullet(local_ecs, local_vis_tracking, entity, REMOVE_REASON.DAMAGE_ELIMINATE);
            }
        }
    }
}