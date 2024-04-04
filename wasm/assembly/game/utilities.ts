import { List } from "../pathfinder/common/list";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";

import { EPSILON } from "./constants";

const OFFSET_DELTA: f32 = 0.1;  // hardcode value, used for offset path

export function max<T>(a: T, b: T): T {
    if (a > b) {
        return a;
    }
    return b;
}

export function min<T>(a: T, b: T): T {
    if (a < b) {
        return a;
    }
    return b;
}

export function is_disc_intersect_interval(point_x: f32, point_y: f32, radius: f32,
                                           start_x: f32, start_y: f32, end_x: f32, end_y: f32): bool {
    let to_x = end_x - start_x;
    let to_y = end_y - start_y;

    const to_length = Mathf.sqrt(to_x * to_x + to_y * to_y);
    if (to_length > EPSILON) {
        to_x /= to_length;
        to_y /= to_length;
    }

    const to_point_x = point_x - start_x;
    const to_point_y = point_y - start_y;

    const a = to_point_x * to_x + to_point_y * to_y;
    if (a < 0.0) {
        // point before the start
        // calculate distance from start to point
        const h = Mathf.sqrt(to_point_x * to_point_x + to_point_y * to_point_y);
        if (h < radius) {
            return true;
        } else {
            return false;
        }
    } else if (a > to_length) {
        // point after the end
        // simillary but for end point
        const end_to_point_x = point_x - end_x;
        const end_to_point_y = point_y - end_y;
        const h = Mathf.sqrt(end_to_point_x * end_to_point_x + end_to_point_y * end_to_point_y);
        if (h < radius) {
            return true;
        } else {
            return false;
        }
    } else {
        // point between start and end
        // check the distance from line to the point
        const h = Mathf.sqrt(to_point_x * to_point_x + to_point_y * to_point_y - a * a);
        if (h < radius) {
            return true;
        } else {
            return false;
        }
    }

    return false;
}

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

// convert two point to angle from the first to the second
export function points_to_angle(start_x: f32, start_y: f32, end_x: f32, end_y: f32): f32 {
    let to_x = end_x - start_x;
    let to_y = end_y - start_y;
    const length = Mathf.sqrt(to_x * to_x + to_y * to_y);
    if (length < EPSILON) {
        return 0.0;
    } else {
        to_x /= length;
        to_y /= length;
    }

    return direction_to_angle(to_x, to_y);
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

// return -1 if there is no element in the array
export function get_index_in_ordered_list<T>(array: List<T>, value: T): i32 {
    const array_length = array.length;
    if (array_length == 0) {
        return -1;
    }

    if (array_length == 1) {
        if (value == array[0]) {
            return 0;
        } else {
            return -1;
        }
    }

    let left: u32 = 0;
    let right: u32 = array_length - 1;

    const left_value = array.get(left);
    const right_value = array.get(right);

    if (left_value == value) {
        return left;
    } else if (right_value == value) {
        return right;
    } else {
        while (right - left > 1) {
            const middle = (right + left) / 2;
            const middle_value = array[middle];

            if (middle_value == value) {
                return middle;
            }

            if (middle_value > value) {
                right = middle;
            } else {
                left = middle;
            }
        }
    }

    return -1;
}

export function is_ordered_list_contains<T>(array: List<T>, value: T): bool {
    return get_index_in_ordered_list<T>(array, value) != -1;
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

export function distance(start_x: f32, start_y: f32, end_x: f32, end_y: f32): f32 {
    const delta_x = end_x - start_x;
    const delta_y = end_y - start_y;
    return Mathf.sqrt(delta_x * delta_x + delta_y * delta_y);
}