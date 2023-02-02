export class Transform {
    m_matrix = new Float32Array(9);

    // store separate values for angle and scale
    m_angle: number = 0.0;
    m_scale_x: number = 1.0;
    m_scale_y: number = 1.0;

    constructor() {
        this.m_matrix[0] = 1.0; this.m_matrix[1] = 0.0; this.m_matrix[2] = 0.0;
        this.m_matrix[3] = 0.0; this.m_matrix[4] = 1.0; this.m_matrix[5] = 0.0;
        this.m_matrix[6] = 0.0; this.m_matrix[7] = 0.0; this.m_matrix[8] = 1.0;  // this row always shouldbe (0.0, 0.0, 1.0)
    }

    matrix_array(): Float32Array {
        return this.m_matrix;
    }

    // this method does not properly define local rotation and scale values
    // it should be used only for create temp matrix, apply transform and does not use it anymore
    set_matrix_array(in_array: number[]) {
        for(let i = 0; i < 9; i++) {
            this.m_matrix[i] = in_array[i];
        }
    }

    set_translation(in_x: number, in_y: number) {
        this.m_matrix[2] = in_x;
        this.m_matrix[5] = in_y;
    }

    translation(): number[] {
        return [this.m_matrix[2], this.m_matrix[5]];
    }

    private _update_rotation() {
        this.m_matrix[0] = Math.cos(this.m_angle) * this.m_scale_x;
        this.m_matrix[3] = Math.sin(this.m_angle) * this.m_scale_x;
        this.m_matrix[1] = -Math.sin(this.m_angle) * this.m_scale_y;
        this.m_matrix[4] = Math.cos(this.m_angle) * this.m_scale_y;
    }

    set_rotation(in_value: number) {  // in_value - in radians from OX in conter clock wise direction
        this.m_angle = in_value;
        this._update_rotation();
    }

    rotation(): number {
        return this.m_angle;
    }

    set_scale(in_x: number, in_y: number) {
        this.m_scale_x = in_x;
        this.m_scale_y = in_y;

        this._update_rotation();
    }

    set_uniform_scale(in_value: number) {
        this.m_scale_x = in_value;
        this.m_scale_y = in_value;

        this._update_rotation();
    }

    multiply(in_x: number, in_y: number): number[] {
        return [this.m_matrix[0] * in_x + this.m_matrix[1] * in_y + this.m_matrix[2],
                this.m_matrix[3] * in_x + this.m_matrix[4] * in_y + this.m_matrix[5]];
    }

    apply_scale(in_value: number): number {
        // get length of the first vector
        const l1 = Math.sqrt(this.m_matrix[0] * this.m_matrix[0] + this.m_matrix[3] * this.m_matrix[3]);
        // and length of the second vector
        const l2 = Math.sqrt(this.m_matrix[1] * this.m_matrix[1] + this.m_matrix[4] * this.m_matrix[4]);

        // return the average of these length
        return in_value * (l1 + l2) / 2;
    }

    // compose current tfm A with other tfm B and return A * B
    compose_tfms(other: Transform): Transform {
        let to_return = new Transform();

        const a = this.matrix_array();
        const b = other.matrix_array();

        // multiply these two matrices
        let result = [a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
                      a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
                      a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8]];
        to_return.set_matrix_array(result);

        return to_return;
    }

    private _det2(a: number, b: number, c: number, d: number): number {
        return a*d - b*c;
    }

    // return inverse transform
    // we setup only matrix, without local scale and rotation
    inverse(): Transform {
        // calculate determinant
        const d = this.m_matrix[0] * this.m_matrix[4] * this.m_matrix[8] +
        this.m_matrix[2] * this.m_matrix[3] * this.m_matrix[7] +
        this.m_matrix[1] * this.m_matrix[5] * this.m_matrix[6] -
        this.m_matrix[2] * this.m_matrix[4] * this.m_matrix[6] -
        this.m_matrix[0] * this.m_matrix[5] * this.m_matrix[7] -
        this.m_matrix[1] * this.m_matrix[3] * this.m_matrix[8];

        const m = [this._det2(this.m_matrix[4], this.m_matrix[5], this.m_matrix[7], this.m_matrix[8]) / d, -1 * this._det2(this.m_matrix[1], this.m_matrix[2], this.m_matrix[7], this.m_matrix[8]) / d, this._det2(this.m_matrix[1], this.m_matrix[2], this.m_matrix[4], this.m_matrix[5]) / d,
        -1 * this._det2(this.m_matrix[3], this.m_matrix[5], this.m_matrix[6], this.m_matrix[8]) / d, this._det2(this.m_matrix[0], this.m_matrix[2], this.m_matrix[6], this.m_matrix[8]) / d, -1 * this._det2(this.m_matrix[0], this.m_matrix[2], this.m_matrix[3], this.m_matrix[5]) / d,
        this._det2(this.m_matrix[3], this.m_matrix[4], this.m_matrix[6], this.m_matrix[7]) / d, -1 * this._det2(this.m_matrix[0], this.m_matrix[1], this.m_matrix[6], this.m_matrix[7]) / d, this._det2(this.m_matrix[0], this.m_matrix[1], this.m_matrix[3], this.m_matrix[4]) / d];

        let to_return = new Transform();
        to_return.set_matrix_array(m);

        return to_return;
    }

    toString(): string {
        let to_return = "";
        to_return += this.m_matrix[0] + ", " + this.m_matrix[1] + ", " + this.m_matrix[2] + "\n";
        to_return += this.m_matrix[3] + ", " + this.m_matrix[4] + ", " + this.m_matrix[5] + "\n";
        to_return += this.m_matrix[6] + ", " + this.m_matrix[7] + ", " + this.m_matrix[8];
        return to_return;
    }
}