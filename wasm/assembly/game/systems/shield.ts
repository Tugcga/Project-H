import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";

import { STATE } from "../constants";

import { StateComponent, StateShieldComponent } from "../components/state";
import { ShieldComponent, ShieldIncreaseComponent } from "../components/shield";
import { UpdateToClientComponent } from "../components/update_to_client";


export class ShieldSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const shield_state: StateShieldComponent | null = this.get_component<StateShieldComponent>(entity);
            if (shield_state) {
                shield_state.increase_time(dt);
            }
        }
    }
}

export class ShieldIncreaseSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const shield: ShieldComponent| null = this.get_component<ShieldComponent>(entity);
            const shield_incerease: ShieldIncreaseComponent | null = this.get_component<ShieldIncreaseComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const update_to_client: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(entity);

            if (shield && shield_incerease && state && update_to_client) {
                const state_value = state.state();
                if (state_value != STATE.SHIELD) {
                    const increase_value = shield_incerease.value();
                    const  is_increase = shield.update(increase_value * dt);
                    if (is_increase) {
                        update_to_client.set_value(true);
                    }
                }
            }
        }
    }
}