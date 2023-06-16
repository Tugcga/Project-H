import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { EPSILON } from "../constants";

import { PreferredVelocityComponent } from "../components/preferred_velocity";
import { StateShiftComponent } from "../components/state";
import { ShiftSpeedMultiplierComponent } from "../components/shift_speed";
import { PositionComponent } from "../components/position";
import { SpeedComponent } from "../components/speed";

export class ShiftSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();

        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const speed: SpeedComponent | null = this.get_component<SpeedComponent>(entity);
            const shift: StateShiftComponent | null = this.get_component<StateShiftComponent>(entity);
            const speed_multiplier: ShiftSpeedMultiplierComponent | null = this.get_component<ShiftSpeedMultiplierComponent>(entity);
            const pref_velocity: PreferredVelocityComponent | null = this.get_component<PreferredVelocityComponent>(entity);

            if (position && speed && shift && speed_multiplier && pref_velocity && shift.active()) {
                // get target
                const target_x: f32 = shift.target_x();
                const target_y: f32 = shift.target_y();

                // current position
                const current_x: f32 = position.x();
                const current_y: f32 = position.y();

                // calculate direction
                var dir_x = target_x - current_x;
                var dir_y = target_y - current_y;

                // normalize
                const dir_length = <f32>Math.sqrt(dir_x * dir_x + dir_y * dir_y);
                if (dir_length > EPSILON) {
                    dir_x = dir_x / dir_length;
                    dir_y = dir_y / dir_length;
                }

                // calculate next point
                const speed_value: f32 = speed.value();
                const speed_multiplier_value: f32 = speed_multiplier.value();
                const speed_result = speed_value * speed_multiplier_value;
                const new_x: f32 = current_x + dir_x * dt * speed_result;
                const new_y: f32 = current_y + dir_y * dt * speed_result;

                // check overjump
                const new_dir_x = target_x - new_x;
                const new_dir_y = target_y - new_y;

                const dot_result: f32 = new_dir_x * dir_x + new_dir_y * dir_y;
                if (dir_length <= EPSILON || dot_result < 0.0) {
                    // yes, overjump the target point
                    // or very close
                    const s = dir_length / dt;
                    pref_velocity.set(dir_x * s, dir_y * s);

                    // deactivate the shift
                    // later in switch system we will switch to other state
                    shift.deactivate();
                } else {
                    pref_velocity.set(dir_x * speed_result, dir_y * speed_result);
                }
            }
        }
    }
}