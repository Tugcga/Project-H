import { List } from "../pathfinder/common/list";
import { Entity } from "../simple_ecs/types";

// convert direction (x, y) to angle from positive x-axist in conter clock-wise direction
// we assume that input vector is normalized
export function direction_to_angle(vec_x: f32, vec_y: f32): f32 {
    if (vec_x >= 0.0 && vec_y >= 0.0) {
        // 1-st quadrant
        return Mathf.asin(vec_y);
    } else if (vec_x <= 0.0 && vec_y >= 0.0) {
        // 2-st quadrant
        return Mathf.acos(vec_x);
    } else if (vec_x <= 0.0 && vec_y <= 0.0) {
        // 3-d quadrant
        return (Mathf.PI - Mathf.asin(vec_y));
    }
    else {
        // 4-th quadrant
        return (2 * Mathf.PI - Mathf.acos(vec_x));
    }
}

// return true if the input list contains value
export function is_element_new(array: List<u32>, value: u32): bool {
    for (let i = 0, len = array.length; i < len; i++) {
        if (array[i] == value) {
            return false;
        }
    }

    return true;
}

export function array_to_etities_list(array: Array<i32>): List<Entity> {
    const length = array.length;
    const to_return = new List<Entity>(length);
    for (let i = 0; i < length; i++) {
        to_return.push(array[i]);
    }
    return to_return;
}

export function is_ordered_list_contains(array: List<Entity>, value: Entity): bool {
    // input array is ordered
    // so, we can use binary search to find value element
    let left: u32 = 0;
    let right: u32 = array.length - 1;

    const left_value = array.get(left);
    const right_value = array.get(right);

    if (left_value == value || right_value == value) {
        return true;
    }

    while (right - left > 1) {
        const middle = (right + left) / 2;
        const middle_value = array.get(middle);

        if (middle_value == value) {
            return true;
        }

        if (middle_value > value) {
            right = middle;
        } else {
            left = middle;
        }
    }
    return false;
}