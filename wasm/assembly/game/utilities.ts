import { List } from "../pathfinder/common/list";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";

import { EPSILON } from "./constants";

const OFFSET_DELTA: f32 = 0.1;  // hardcode value, used for offset path

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
    const array_length = array.length;
    if (array_length == 0) {
        return false;
    }

    if (array_length == 1) {
        return value == array.get(0);
    }

    // input array is ordered
    // so, we can use binary search to find value element
    let left: u32 = 0;
    let right: u32 = array_length - 1;

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

export function offset_path(path: StaticArray<f32>, delta: f32 = 0.1): StaticArray<f32> {
    const points_count = path.length / 3;
    const to_return = new List<f32>(points_count * 3);
    if (points_count <= 1) {
        return to_return.to_static();
    }

    to_return.push(path[0]);
    to_return.push(path[1]);
    to_return.push(path[2]);
    
    for (let point_index = 1; point_index < points_count - 1; point_index++) {
        const prev_x = path[3*(point_index - 1)]
        const prev_y = path[3*(point_index - 1) + 1]
        const prev_z = path[3*(point_index - 1) + 2]

        const x = path[3*point_index];
        const y = path[3*point_index + 1];
        const z = path[3*point_index + 2];

        const next_x = path[3*(point_index + 1)];
        const next_y = path[3*(point_index + 1) + 1];
        const next_z = path[3*(point_index + 1) + 2];

        const to_prev_x = prev_x - x; const to_prev_y = prev_y - y; const to_prev_z = prev_z - z;
        const to_next_x = next_x - x; const to_next_y = next_y - y; const to_next_z = next_z - z;

        // normalize vectors
        const to_prev_length = Mathf.sqrt(to_prev_x*to_prev_x + to_prev_y*to_prev_y + to_prev_z*to_prev_z);
        const to_next_length = Mathf.sqrt(to_next_x*to_next_x + to_next_y*to_next_y + to_next_z*to_next_z);

        if (to_prev_length > EPSILON && to_next_length > EPSILON) {
            // calc the sum of unit vetors
            const sum_x = to_prev_x / to_prev_length + to_next_x / to_next_length;
            const sum_y = to_prev_y / to_prev_length + to_next_y / to_next_length;
            const sum_z = to_prev_z / to_prev_length + to_next_z / to_next_length;

            // normalize the sum
            const sum_length = Mathf.sqrt(sum_x*sum_x + sum_y*sum_y + sum_z*sum_z);
            if (sum_length > EPSILON) {
                // shift the point in the direction, opposite to the sum
                to_return.push(x - sum_x * delta / sum_length);
                to_return.push(y - sum_y * delta / sum_length);
                to_return.push(z - sum_z * delta / sum_length);
            }  // skip the point, if the sum is short (because in this case the path is streight)
        }  // also skip point if the path edge is very short
    }

    to_return.push(path[3*points_count - 3]);
    to_return.push(path[3*points_count - 2]);
    to_return.push(path[3*points_count - 1]);

    return to_return.to_static();
}

export function get_navmesh_path(navmesh: Navmesh, start_x: f32, start_y: f32, finish_x: f32, finish_y: f32): StaticArray<f32> {
    const path: StaticArray<f32> = navmesh.search_path(start_x, 0.0, start_y, finish_x, 0.0, finish_y);
    return offset_path(path, OFFSET_DELTA);
}