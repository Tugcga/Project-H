import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { List } from "../../pathfinder/common/list";

import { REMOVE_REASON, ACTOR, STATE } from "../constants";

import { VisibleQuadGridTrackingSystem } from "./visible_quad_grid_tracking";
import { PositionComponent,
         TargetPositionComponent } from "../components/position";
import { VisibleQuadGridNeighborhoodComponent } from "../components/visible_quad_grid_neighborhood";
import { AngleComponent } from "../components/angle";
import { RadiusComponent,
         RadiusSearchComponent,
         RadiusSelectComponent } from "../components/radius";
import { PositionComponent } from "../components/position";
import { UpdateToClientComponent } from "../components/update_to_client";
import { TeamComponent } from "../components/team";
import { SpreadSearchComponent } from "../components/spread_search";
import { LifeComponent } from "../components/life";
import { ShieldComponent } from "../components/shield";
import { AtackDistanceComponent } from "../components/atack_distance";
import { AtackTimeComponent } from "../components/atack_time";
import { StateComponent } from "../components/state";
import { ActorTypeComponent } from "../components/actor_type";
import { BulletTypeComponent } from "../components/bullet_type";

import { external_remove_entity,
         external_create_monster,
         external_create_bullet,
         external_update_entity_params } from "../../external";

// this system applies only for the player
// because it requires player tag, position and neighborhood components
export class VisibleQuadGridNeighborhoodSystem extends System {
    private m_tracking_system: VisibleQuadGridTrackingSystem;

    constructor(in_tracking: VisibleQuadGridTrackingSystem) {
        super();

        this.m_tracking_system = in_tracking;
    }

    update(dt: f32): void {
        const entity: Entity = this.singleton();
        const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
        const quad_neight: VisibleQuadGridNeighborhoodComponent | null = this.get_component<VisibleQuadGridNeighborhoodComponent>(entity);
        const tracking = this.m_tracking_system;

        if (position && quad_neight) {
            const pos_x = position.x();
            const pos_y = position.y();

            const quad_index = tracking.get_quad_index(pos_x, pos_y);
            // here we should obtain all entities from the grid
            const neight_entities: List<Entity> = tracking.get_items_from_position(pos_x, pos_y);
            quad_neight.set_entities(neight_entities);
            quad_neight.set_quad_index(quad_index);

            // next we should output data about neighborhood monsters to the client
            const to_delete = quad_neight.to_delete();
            for (let i = 0, len = to_delete.length; i < len; i++) {
                const e = to_delete.get(i);
                const e_actor = this.get_component<ActorTypeComponent>(e);
                if (e_actor) {
                    external_remove_entity(e, e_actor.type(), REMOVE_REASON.VISIBILITY_OUT);
                }
            }
            const to_create = quad_neight.to_create();
            for (let i = 0, len = to_create.length; i < len; i++) {
                const e = to_create.get(i);
                const should_update: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(e);

                if (should_update) {
                    should_update.set_value(true);
                    const e_actor = this.get_component<ActorTypeComponent>(e);
                    if (e_actor) {
                        const e_actor_type = e_actor.type();
                        if (e_actor_type == ACTOR.MONSTER) {
                            const e_radius = this.get_component<RadiusComponent>(e);
                            const e_position = this.get_component<PositionComponent>(e);
                            const e_search_radius = this.get_component<RadiusSearchComponent>(e);
                            const e_search_spread = this.get_component<SpreadSearchComponent>(e);
                            const e_team = this.get_component<TeamComponent>(e);
                            const e_angle = this.get_component<AngleComponent>(e);

                            if (e_actor && e_radius && e_position && e_team && e_search_radius && e_search_spread && e_angle) {
                                external_create_monster(e, e_position.x(), e_position.y(), e_angle.value(), e_radius.value(), e_search_radius.value(), e_search_spread.value(), e_team.team());
                            }

                            const e_select_radius = this.get_component<RadiusSelectComponent>(e);
                            const e_life = this.get_component<LifeComponent>(e);
                            const e_shield = this.get_component<ShieldComponent>(e);
                            const e_attack_distance = this.get_component<AtackDistanceComponent>(e);
                            const e_attack_time = this.get_component<AtackTimeComponent>(e);
                            const e_state = this.get_component<StateComponent>(e);
                            if (e_select_radius && e_life && e_shield && e_attack_distance && e_attack_time && e_state) {
                                external_update_entity_params(e, e_state.state() == STATE.DEAD, e_life.life(), e_life.max_life(), e_shield.shield(), e_shield.max_shield(), e_select_radius.value(), e_attack_distance.value(), e_attack_time.value());
                            }
                        } else if (e_actor_type == ACTOR.BULLET) {
                            const e_position = this.get_component<PositionComponent>(e);
                            const e_target = this.get_component<TargetPositionComponent>(e);
                            const e_angle = this.get_component<AngleComponent>(e);
                            const e_type = this.get_component<BulletTypeComponent>(e);

                            if (e_position && e_target && e_angle && e_type) {
                                external_create_bullet(e, e_position.x(), e_position.y(), e_target.x(), e_target.y(), e_angle.value(), e_type.type());
                            }
                        }
                    }
                }
            }
        }
    }
}
