import { ECS } from "../../simple_ecs/simple_ecs";
import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { STATE, EPSILON } from "../constants";
import { direction_to_angle } from "../utilities";

import { LifeComponent } from "../components/life";
import { ShieldComponent } from "../components/shield";
import { StateComponent } from "../components/state";
import { ApplyDamageComponent } from "../components/apply_damage";
import { UpdateToClientComponent } from "../components/update_to_client";
import { TargetAngleComponent } from "../components/target_angle";
import { PositionComponent } from "../components/position";

import { interrupt_to_iddle } from "../ecs_setup";
import { external_entity_dead,
         external_entity_damaged } from "../../external";

export class ApplyDamageSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();
        const local_ecs: ECS | null = this.get_ecs();
        if (local_ecs) {
            for (let i = 0, len = entities.length; i < len; i++) {
                const entity: Entity = entities[i];

                const life: LifeComponent | null = this.get_component<LifeComponent>(entity);
                const shield: ShieldComponent | null = this.get_component<ShieldComponent>(entity);
                const state: StateComponent | null = this.get_component<StateComponent>(entity);
                const damage: ApplyDamageComponent | null = this.get_component<ApplyDamageComponent>(entity);
                const update_to_client: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(entity);
                const target_angle: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);
                const position: PositionComponent | null = this.get_component<PositionComponent>(entity);

                if (life && shield && state && damage && update_to_client && target_angle && position) {
                    const state_value = state.state();
                    // apply damage only to live entity
                    if (state_value != STATE.DEAD) {
                        // iterate throw damages
                        for (let j: u32 = 0, j_len: u32 = damage.count(); j < j_len; j++) {
                            const damage_attacker = damage.attacker(j);
                            const damage_value = damage.damage(j);
                            const damage_type = damage.type(j);

                            let damage_value_f32 = <f32>damage_value;
                            if (state_value == STATE.SHIELD) {
                                // at first apply damage to the shield
                                const shield_value = shield.shield();  // this is f32 value
                                shield.damage(damage_value_f32);
                                if (shield_value <= damage_value_f32) {
                                    damage_value_f32 -= shield_value;
                                } else {
                                    damage_value_f32 = 0.0;
                                }

                                if (shield.is_over()) {
                                    // turn the entity to the iddle state
                                    const is_iddle = interrupt_to_iddle(local_ecs, entity, state);
                                    // TODO: monsters in iddle does not move
                                    // controll it more carefull, but for now mosnters are not use shields
                                }

                                // rotate entity to attacker
                                const attacker_position: PositionComponent | null = this.get_component<PositionComponent>(damage_attacker);
                                if (attacker_position) {
                                    let to_x = attacker_position.x() - position.x();
                                    let to_y = attacker_position.y() - position.y();
                                    const to_length = Mathf.sqrt(to_x * to_x + to_y * to_y);
                                    if (to_length > EPSILON) {
                                        to_x /= to_length;
                                        to_y /= to_length;
                                        target_angle.set_value(direction_to_angle(to_x, to_y));
                                    }
                                }
                            }

                            if (damage_value_f32 > 0.0) {
                                // apply to the life
                                // convet f32 remain damage to u32
                                const remain_damage: u32 = <u32>damage_value_f32;
                                life.damage(remain_damage);
                            }

                            external_entity_damaged(damage_attacker, entity, damage_value, damage_type);
                        }

                        if (life.life() == 0) {
                            // interrupt any action and make the enity dead
                            const is_iddle = interrupt_to_iddle(local_ecs, entity, state);
                            state.set_state(STATE.DEAD);
                            external_entity_dead(entity);
                        }

                        update_to_client.set_value(true);
                    }
                    this.remove_component<ApplyDamageComponent>(entity);
                }
            }
        }
    }
}