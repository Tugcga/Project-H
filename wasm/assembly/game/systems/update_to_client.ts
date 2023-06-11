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

import { external_define_player_changes,
         external_define_monster_changes,
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
                    }
                }
            }
        }
    }
}