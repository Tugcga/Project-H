
// convert direction (x, y) to angle from positive x-axist in conter clock-wise direction
// we assume that input vector is normalized
export function direction_to_angle(vec_x: f32, vec_y: f32): f32 {
    if(vec_x >= 0.0 && vec_y >= 0.0) {
        // 1-st quadrant
        return <f32>Math.asin(vec_y);
    } else if(vec_x <= 0.0 && vec_y >= 0.0) {
        // 2-st quadrant
        return <f32>Math.acos(vec_x);
    } else if(vec_x <= 0.0 && vec_y <= 0.0) {
        // 3-d quadrant
        return <f32>(Math.PI - Math.asin(vec_y));
    }
    else {
        // 4-th quadrant
        return <f32>(2 * Math.PI - Math.acos(vec_x));
    }
}