import { Line, Vector2, abs_sq, dot, det, normalize } from "./common/vector2";
import { List } from "./common/list";
import { sqr, RVO_EPSILON } from "./common/utilities";

function rvo_linear1(lines: List<Line>, lineNo: i32, radius: f32, optVelocity: Vector2, directionOpt: bool, result: Vector2): bool{
    let line_no = lines[lineNo];
    let line_p = line_no.get_point();
    let line_dir = line_no.get_direction();
    const dotProduct: f32 = dot(line_p, line_dir);
    const discriminant = sqr(dotProduct) + sqr(radius) - abs_sq(line_p);
    if (discriminant < 0.0) {
        return false;
    }

    const sqrtDiscriminant = Mathf.sqrt(discriminant);
    var tLeft = -dotProduct - sqrtDiscriminant;
    var tRight = -dotProduct + sqrtDiscriminant;

    for (let i = 0; i < lineNo; ++i) {
        let line_i = lines[i];
        let line_i_p = line_i.get_point();
        let line_i_dir = line_i.get_direction();
        const denominator = det(line_dir, line_i_dir);
        const numerator = det(line_i_dir, line_p.subtract(line_i_p));

        if (Mathf.abs(denominator) <= RVO_EPSILON) {
            // Lines lineNo and i are (almost) parallel. 
            if (numerator < 0.0) {
                return false;
            }
            else {
                continue;
            }
        }

        const t = numerator / denominator;

        if (denominator >= 0.0) {
            // Line i bounds line lineNo on the right.
            tRight = Mathf.min(tRight, t);
        }
        else {
            // Line i bounds line lineNo on the left.
            tLeft = Mathf.max(tLeft, t);
        }

        if (tLeft > tRight) {
            return false;
        }
    }

    if (directionOpt) {
        // Optimize direction. 
        if (dot(optVelocity, line_dir) > 0.0) {
            // Take right extreme. 
            result.copy_from(line_p.add(line_dir.scale(tRight)));
        }
        else {
            // Take left extreme. 
            result.copy_from(line_p.add(line_dir.scale(tLeft)));
        }
    }
    else {
        // Optimize closest point. 
        const t = dot(line_dir, optVelocity.subtract(line_p));

        if (t < tLeft) {
            result.copy_from(line_p.add(line_dir.scale(tLeft)));
        }
        else if (t > tRight) {
            result.copy_from(line_p.add(line_dir.scale(tRight)));
        }
        else {
            result.copy_from(line_p.add(line_dir.scale(t)));
        }
    }

    return true;
}

export function rvo_linear2(lines: List<Line>, radius: f32, optVelocity: Vector2, directionOpt: bool, result: Vector2): i32{
    if (directionOpt) {
        // Optimize direction. Note that the optimization velocity is of unit
        // length in this case.
        result.copy_from(optVelocity.scale(radius));
    }
    else if (abs_sq(optVelocity) > sqr(radius)) {
        // Optimize closest point and outside circle.
        result.copy_from(normalize(optVelocity).scale(radius));
    }
    else {
        // Optimize closest point and inside circle.
        result.copy_from(optVelocity);
    }

    for (let i = 0, len = lines.length; i < len; ++i) {
        let line_i = lines[i];
        let line_i_p = line_i.get_point();
        let line_i_dir = line_i.get_direction();
        if (det(line_i_dir, line_i_p.subtract(result)) > 0.0) {
            // Result does not satisfy constraint i. Compute new optimal result.
            const tempResult = result;

            if (!rvo_linear1(lines, i, radius, optVelocity, directionOpt, result)) {
                result.copy_from(tempResult);
                return i;
            }
        }
    }

    return lines.length;
}

export function rvo_linear3(lines: List<Line>, numObstLines: i32, beginLine: i32, radius: f32, result: Vector2): void{
    var distance = 0.0;

    const lines_count = lines.length;
    for (let i = beginLine; i < lines_count; ++i) {
        let line_i = lines[i];
        let line_i_p = line_i.get_point();
        let line_i_dir = line_i.get_direction();
        if (det(line_i_dir, line_i_p.subtract(result)) > distance) {
            // Result does not satisfy constraint of line i.
            let projLines = new List<Line>(numObstLines);
            for(let k = 0; k < numObstLines; k++){
                projLines.push(lines[k]);
            }

            for (let j = numObstLines; j < i; ++j) {
                let line = new Line();

                let line_j = lines[j];
                let line_j_dir = line_j.get_direction();
                let line_j_p = line_j.get_point();
                const determinant = det(line_i_dir, line_j_dir);

                if (Mathf.abs(determinant) <= RVO_EPSILON) {
                    // Line i and line j are parallel.
                    if (dot(line_i_dir, line_j_dir) > 0.0) {
                        // Line i and line j point in the same direction.
                        continue;
                    }
                    else {
                        // Line i and line j point in opposite direction.
                        line.set_point(line_i_p.add(line_j_p).scale(0.5));
                    }
                }
                else {
                    let ij_p = line_i_p.subtract(line_j_p);
                    let d = det(line_j_dir, ij_p) / determinant;

                    line.set_point(line_i_p.add(line_i_dir.scale(d)));
                }
                line.set_direction(normalize(line_j_dir.subtract(line_i_dir)));
                projLines.push(line);
            }

            let tempResult = result;

            if (rvo_linear2(projLines, radius, new Vector2(-line_i_dir.y(), line_i_dir.x()), true, result) < projLines.length) {
                // This should in principle not happen.  The result is by definition
                // already in the feasible region of this linear program. If it fails,
                // it is due to small floating point error, and the current result is
                // kept.
                result.copy_from(tempResult);
            }
            
            distance = det(line_i_dir, line_i_p.subtract(result));
        }
    }
}