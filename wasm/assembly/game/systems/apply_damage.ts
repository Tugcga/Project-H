import { ECS } from "../../simple_ecs/simple_ecs";
import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { STATE, EPSILON, DAMAGE_TYPE } from "../constants";
import { direction_to_angle } from "../utilities";

import { LifeComponent } from "../components/life";
import { ShieldComponent } from "../components/shield";
import { StateComponent, StateShieldComponent } from "../components/state";
import { ApplyDamageComponent } from "../components/apply_damage";
import { UpdateToClientComponent } from "../components/update_to_client";
import { TargetAngleComponent } from "../components/target_angle";
import { PositionComponent } from "../components/position";
import { TeamComponent } from "../components/team";
import { EnemiesListComponent } from "../components/enemies_list";
import { DeadComponent } from "../components/tags";

import { external_entity_dead,
         external_entity_damaged } from "../../external";
import { command_entity_unhide, command_stun } from "../commands";
import { interrupt_to_iddle } from "../states";

export class ApplyDamageSystem extends System {
    private m_melee_stun: f32;  // default value for stun if interrupt melee attack
    private m_react_attack: bool;

    constructor(in_melee_stun: f32, in_react_attack: bool) {
        super();

        this.m_melee_stun = in_melee_stun;
        this.m_react_attack = in_react_attack;
    }

    update(dt: f32): void {
        const entities = this.entities();
        const local_ecs: ECS | null = this.get_ecs();
        const local_melee_stun = this.m_melee_stun;
        const local_react_attack = this.m_react_attack;
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
                const team: TeamComponent | null = this.get_component<TeamComponent>(entity);

                if (life && shield && state && damage && update_to_client && target_angle && position && team) {
                    const state_value = state.state();
                    const team_value = team.team();
                    // apply damage only to live entity
                    // and entity without shift
                    if (state_value != STATE.DEAD && state_value != STATE.SHIFTING) {
                        // iterate throw damages
                        for (let j: u32 = 0, j_len: u32 = damage.count(); j < j_len; j++) {
                            const damage_attacker = damage.attacker(j);
                            let damage_value = damage.damage(j);
                            const damage_type = damage.type(j);
                            const damage_duration = damage.duration(j);  // the of the cast for this damage

                            // if attacker and target from the SAME team, then skip damage
                            // for friends damage is allowed
                            const attacker_team: TeamComponent | null = this.get_component<TeamComponent>(damage_attacker);
                            if (damage_type != DAMAGE_TYPE.UNKNOWN && attacker_team) {
                                if (attacker_team.team() == team_value) {
                                    // skip this loop step, continue with the other
                                    continue;
                                }
                            }
                            // if current entity not the friend of the attacker
                            // or attacker team is not valid
                            // or damage is unknown type (used for debug, for example), then apply damage
                            let damage_value_f32: f32 = 0.0;

                            if (damage_type == DAMAGE_TYPE.ULTIMATE) {
                                // simply damage all remain life
                                damage_value = life.life();
                                life.damage(life.life());
                            } else {
                                damage_value_f32 = <f32>damage_value;
                                if (state_value == STATE.SHIELD) {
                                    const shield_state: StateShieldComponent | null = this.get_component<StateShieldComponent>(entity);
                                    if (shield_state) {
                                        // if shield time is less than cast attack time, then interrupt the attacker and set stun state
                                        // the behaviour is different for different type of attacks
                                        // interruption for melee attack only
                                        const shield_time = shield_state.time();
                                        if (damage_type == DAMAGE_TYPE.MELEE) {
                                            if (shield_time < damage_duration) {
                                                command_stun(local_ecs, damage_attacker, local_melee_stun);
                                            }
                                        } else if (damage_type == DAMAGE_TYPE.RANGE) {
                                            if (shield_time < damage_duration) {
                                                // in this case block the arrow and does not apply damage
                                                // simply reset damage value
                                                damage_value_f32 = 0.0;
                                            }
                                        }

                                        // even if we stun the attacker, aply damage to the shield
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
                                }
                            }

                            if (damage_value_f32 > 0.0) {
                                // apply to the life
                                // convet f32 remain damage to u32
                                const remain_damage: u32 = <u32>damage_value_f32;
                                life.damage(remain_damage);
                            }

                            external_entity_damaged(damage_attacker, entity, damage_value, damage_type);
                            command_entity_unhide(local_ecs, entity);

                            // add atacker to the enemies list for the target
                            if (local_react_attack && damage_type != DAMAGE_TYPE.UNKNOWN) {
                                const target_enemies_list = local_ecs.get_component<EnemiesListComponent>(entity);
                                if (target_enemies_list) {
                                    target_enemies_list.add_target(damage_attacker);
                                }
                            }
                        }

                        if (life.life() == 0) {
                            // interrupt any action and make the enity dead
                            const is_iddle = interrupt_to_iddle(local_ecs, entity, state);
                            state.set_state(STATE.DEAD);
                            local_ecs.add_component(entity, new DeadComponent());
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