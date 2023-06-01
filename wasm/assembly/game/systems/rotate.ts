import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { EPSILON, ACTOR } from "../constants";

import { AngleComponent } from "../components/angle";
import { TargetAngleComponent } from "../components/target_angle";
import { RotationSpeedComponent } from "../components/rotation_speed";
import { MoveTagComponent } from "../components/tags";
import { UpdateToClientComponent } from "../components/update_to_client";

export class RotateSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
            const angle: AngleComponent | null = this.get_component<AngleComponent>(entity);
            const target_angle: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);
            const speed: RotationSpeedComponent | null = this.get_component<RotationSpeedComponent>(entity);
            const should_update: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(entity);

            if (move && angle && target_angle && speed && should_update) {
                if (move.value()) {
                    // item is moving, so, we should rotate the angle to snap with target angle
                    const a = angle.value();  // curent angle
                    const ta = target_angle.value();  // target angle
                    const delta = dt * speed.value();  // value we should add/subtract to the current angle a
                    
                    // calculate the delta between a and ta
                    const a_diff = <f32>Math.abs(a - ta);
                    const a_diff_comp = 2.0 * <f32>Math.PI - a_diff;
                    const a_delta = <f32>Math.min(a_diff, a_diff_comp);

                    if (a_delta < delta) {
                        // snap the angle
                        angle.set_value(ta);
                    } else {
                        // calculate direction to change the angle
                        // it depends what diff is smaller
                        var direction: f32 = 1.0;
                        if (a_diff < a_diff_comp) {
                            if (ta > a) {
                                direction = 1.0;
                            } else {
                                direction = -1.0;
                            }
                        } else {
                            if (ta > a) {
                                direction = -1.0;
                            } else {
                                direction = 1.0;
                            }
                        }

                        // set new angle
                        angle.set_value(a + direction * delta);
                    }

                    const new_angle = angle.value();
                    if (Math.abs(new_angle - a) > EPSILON) {
                        should_update.set_value(true);
                    }
                }
            }
        }
    }
}
