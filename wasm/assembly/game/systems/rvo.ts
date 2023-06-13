import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { rvo_linear2, rvo_linear3 } from "../../pathfinder/rvo";
import { Vector2, Line } from "../../pathfinder/common/vector2";
import { List } from "../../pathfinder/common/list";

import { EPSILON, ACTOR } from "../constants";

import { PreferredVelocityComponent } from "../components/preferred_velocity";
import { VelocityComponent } from "../components/velocity";
import { ActorTypeComponent } from "../components/actor_type";
import { PositionComponent } from "../components/position";
import { RadiusComponent } from "../components/radius";
import { SpeedComponent } from "../components/speed";

import { NeighborhoodQuadGridTrackingSystem } from "./neighborhood_quad_grid_tracking";

export class RVOSystem extends System {
    // we use tracking system to find neighborhood entities
    private m_tracking_system: NeighborhoodQuadGridTrackingSystem;
    private m_inv_time_horizon: f32 = 1.0;
    private m_orca_lines: List<Line> = new List<Line>();
    private m_rvo_velocities: List<f32> = new List<f32>(1000);
    private m_out_buffer: Vector2 = new Vector2();

    constructor(in_tracking_system: NeighborhoodQuadGridTrackingSystem, in_time_horizon: f32) {
        super();

        this.m_tracking_system = in_tracking_system;
        this.m_inv_time_horizon = 1.0 / in_time_horizon;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const tracking_system = this.m_tracking_system;
        const orca_lines = this.m_orca_lines;
        const rvo_velocities = this.m_rvo_velocities;
        const inv_time_horizon = this.m_inv_time_horizon;
        orca_lines.reset();
        rvo_velocities.reset();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);
            const velocity: VelocityComponent | null = this.get_component<VelocityComponent>(entity);
            const actor_type: ActorTypeComponent | null = this.get_component<ActorTypeComponent>(entity);

            if (velocity && pref_velocity && actor_type) {
                const actor_type_value = actor_type.type();
                if (actor_type_value == ACTOR.PLAYER) {
                    // for player we simply copy velocity
                    rvo_velocities.push(pref_velocity.x());
                    rvo_velocities.push(pref_velocity.y());
                } else {
                    // for all other actors calculate actual velocity by using rvo-algorithm
                    // get position of the entity
                    const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                    const radius: RadiusComponent | null = this.get_component<RadiusComponent>(entity);
                    const speed: SpeedComponent | null = this.get_component<SpeedComponent>(entity);
                    if (position && radius && speed) {
                        // get closed entities
                        const pos_x = position.x();
                        const pos_y = position.y();
                        const vel_x = velocity.x();
                        const vel_y = velocity.y();
                        const r = radius.value();
                        const s = speed.value();
                        const closed_entities = tracking_system.get_items_from_position(pos_x, pos_y);

                        orca_lines.reset();
                        for (let j = 0, j_len = closed_entities.length; j < j_len; j++) {
                            const other = closed_entities.get(j);
                            if (other != entity) {
                                const other_position: PositionComponent | null = this.get_component<PositionComponent>(other);
                                const other_velocity: VelocityComponent | null = this.get_component<VelocityComponent>(other);
                                const other_radius: RadiusComponent | null = this.get_component<RadiusComponent>(other);

                                if (other_position && other_velocity && other_radius) {
                                    const rel_pos_x = other_position.x() - pos_x;
                                    const rel_pos_y = other_position.y() - pos_y;

                                    const rel_vel_x = vel_x - other_velocity.x();
                                    const rel_vel_y = vel_y - other_velocity.y();

                                    const dist_sq = rel_pos_x * rel_pos_x + rel_pos_y * rel_pos_y;
                                    const combined_radius = r + other_radius.value();
                                    const combined_radius_sq = combined_radius * combined_radius;

                                    const line = new Line();
                                    const u = new Vector2();

                                    if (dist_sq > combined_radius_sq) {
                                        const w_x = rel_vel_x - rel_pos_x * inv_time_horizon;
                                        const w_y = rel_vel_y - rel_pos_y * inv_time_horizon;

                                        const w_length_sq = w_x * w_x + w_y * w_y;

                                        const dot_product_1 = w_x * rel_pos_x + w_y * rel_pos_y;
                                        if (dot_product_1 < 0.0 && dot_product_1 * dot_product_1 > combined_radius_sq * w_length_sq) {
                                            const w_length: f32 = Mathf.sqrt(w_length_sq);
                                            const unit_w_x = w_x / w_length;
                                            const unit_w_y = w_y / w_length;

                                            line.set_direction_values(unit_w_y, -1.0 * unit_w_x);
                                            u.set_values(unit_w_x * (combined_radius * inv_time_horizon - w_length),
                                                unit_w_y * (combined_radius * inv_time_horizon - w_length));
                                        } else {
                                            const leg = Mathf.sqrt(dist_sq - combined_radius_sq);

                                            if (rel_pos_x * w_y - rel_pos_y * w_x > 0.0) {
                                                line.set_direction_values((rel_pos_x * leg - rel_pos_y * combined_radius) / dist_sq,
                                                    (rel_pos_x * combined_radius + rel_pos_y * leg) / dist_sq);
                                            } else {
                                                line.set_direction_values((rel_pos_x * leg - rel_pos_y * combined_radius) / (-1.0 * dist_sq),
                                                    (-1.0 * rel_pos_x * combined_radius + rel_pos_y * leg) / (-1.0 * dist_sq));
                                            }

                                            const dot_product_2 = rel_vel_x * line.get_direction().y() - rel_vel_y * line.get_direction().x();
                                            u.set_values(line.get_direction().x() * dot_product_2 - rel_vel_x,
                                                line.get_direction().y() * dot_product_2 - rel_vel_y);
                                        }
                                    } else {
                                        const inv_time_step: f32 = 1.0 / dt;
                                        const w_x = rel_vel_x - rel_pos_x * inv_time_step;
                                        const w_y = rel_vel_y - rel_pos_y * inv_time_step;

                                        const w_length: f32 = Mathf.sqrt(w_x * w_x + w_y * w_y);
                                        const unit_w_x = w_x / w_length;
                                        const unit_w_y = w_y / w_length;

                                        line.set_direction_values(unit_w_y, -1.0 * unit_w_x);
                                        u.set_values(unit_w_x * (combined_radius * inv_time_step - w_length),
                                            unit_w_y * (combined_radius * inv_time_step - w_length));
                                    }

                                    line.set_point_values(vel_x + u.x() * 0.5,
                                        vel_y + u.y() * 0.5);

                                    orca_lines.push(line);
                                }
                            }
                        }

                        let pref_vel = new Vector2(pref_velocity.x(), pref_velocity.y());
                        let rvo_velocity = new Vector2();
                        let line_fail = rvo_linear2(orca_lines, s, pref_vel, false, rvo_velocity);
        
                        if (line_fail < orca_lines.length) {
                            rvo_linear3(orca_lines, 0, line_fail, s, rvo_velocity);
                        }

                        rvo_velocities.push(rvo_velocity.x());
                        rvo_velocities.push(rvo_velocity.y());
                    }
                }
                
            }
        }

        for (let i = 0, len = rvo_velocities.length / 2; i < len; i++) {
            const entity = entities[i];
            const velocity: VelocityComponent | null = this.get_component<VelocityComponent>(entity);
            if (velocity) {
                velocity.set(rvo_velocities[2*i], rvo_velocities[2*i + 1]);
            }
        }
    }
}