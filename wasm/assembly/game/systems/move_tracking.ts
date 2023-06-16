import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { direction_to_angle } from "../utilities";
import { EPSILON, ACTOR, STATE } from "../constants";

import { PreviousPositionComponent } from "../components/previous_position";
import { PositionComponent } from "../components/position";
import { MoveTagComponent } from "../components/move";
import { TargetAngleComponent } from "../components/target_angle";
import { UpdateToClientComponent } from "../components/update_to_client";
import { StateComponent } from "../components/state";

// this system track current and previous positions
// if these values different, then set move tag to true
// in other case - to false
// also, if current and previous positions are different, then find direction and set target angle
export class MoveTrackingSystem extends System {
    update(dt: f32): void {
        const entities = this.entities();
        for (let i = 0, len = entities.length; i < len; i++) {
            const entity: Entity = entities[i];

            const prev_position: PreviousPositionComponent | null = this.get_component<PreviousPositionComponent>(entity);
            const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
            const move: MoveTagComponent | null = this.get_component<MoveTagComponent>(entity);
            const target: TargetAngleComponent | null = this.get_component<TargetAngleComponent>(entity);
            const state: StateComponent | null = this.get_component<StateComponent>(entity);
            const should_update: UpdateToClientComponent | null = this.get_component<UpdateToClientComponent>(entity);

            if (prev_position && position && move && target && should_update && state) {
                const prev_move = move.status();
                const prev_x = prev_position.x();
                const prev_y = prev_position.y();

                const x = position.x();
                const y = position.y();

                // calculate direction from previous to current
                var dir_x = x - prev_x;
                var dir_y = y - prev_y;
                const dir_length = <f32>Math.sqrt(dir_x * dir_x + dir_y * dir_y);

                if (dir_length > EPSILON) {
                    // entity can move or shift
                    // check it
                    const state_value = state.state();
                    if (state_value == STATE.SHIFTING) {
                        move.set_shift();
                    } else {
                        move.set_walk();
                    }

                    // normalize direction vector
                    dir_x /= dir_length;
                    dir_y /= dir_length;

                    target.set_value(direction_to_angle(dir_x, dir_y));

                    // set new previous position
                    prev_position.set(x, y);
                    should_update.set_value(true);

                } else {
                    // positions are the same, nothing to do
                    move.set_none();
                }

                const current_move = move.status();
                if (current_move != prev_move) {
                    should_update.set_value(true);
                }
            }
        }
    }
}