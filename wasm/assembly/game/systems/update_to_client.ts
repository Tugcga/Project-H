import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { ACTOR, STATE } from "../constants";
import { is_ordered_list_contains } from "../utilities";

import { PositionComponent } from "../components/position";
import { AngleComponent } from "../components/angle";
import { ActorTypeComponent } from "../components/actor_type";
import { UpdateToClientComponent } from "../components/update_to_client";
import { MoveTagComponent } from "../components/move";
import { VisibleQuadGridNeighborhoodComponent } from "../components/visible_quad_grid_neighborhood";
import { LifeComponent } from "../components/life";
import { ShieldComponent } from "../components/shield";
import { StateComponent } from "../components/state";

import { external_define_person_changes,
         external_define_bullet_changes,
         external_define_total_update_entities } from "../../external";

// we should init this system by define player entity value
// it requires visible actors around the player
// this data can be getted from player component
// so, we should know the player entity
export class UpdateToClientSystem extends System {
    private m_is_init: bool = false;
    private m_player_entity: Entity = 0;

    init(in_player_entity: Entity): void {
        this.m_is_init = true;
        this.m_player_entity = in_player_entity;
    }

    update(dt: f32): void {
        const is_init = this.m_is_init;

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
                            const is_visible_entity = is_ordered_list_contains<Entity>(visible_entities, entity);
                            if (actor_type_value == ACTOR.PLAYER || (actor_type_value == ACTOR.MONSTER && is_visible_entity)) {
                                const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
                                const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                                const angle: AngleComponent | null = this.get_component<AngleComponent>(entity);
                                const life: LifeComponent | null = this.get_component<LifeComponent>(entity);
                                const shield: ShieldComponent | null = this.get_component<ShieldComponent>(entity);
                                const state: StateComponent | null = this.get_component<StateComponent>(entity);

                                if (move && position && angle && life && shield && state) {
                                    external_define_person_changes(entity, position.x(), position.y(), angle.value(), move.status(),
                                                                   life.life(), life.max_life(),
                                                                   shield.shield(), shield.max_shield(),
                                                                   state.state() == STATE.DEAD);
                                }
                            } else if (actor_type_value == ACTOR.BULLET && is_visible_entity) {
                                // send only position and angle
                                const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
                                const angle: AngleComponent | null = this.get_component<AngleComponent>(entity);
                                if (position && angle) {
                                    external_define_bullet_changes(entity, position.x(), position.y(), angle.value());
                                }
                            }

                            should_update.set_value(false);
                        }
                    }
                }
            }
        }
    }
}