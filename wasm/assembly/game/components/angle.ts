import { OneFloatComponent } from "./one_value";

// used for rotation angle
export class AngleComponent extends OneFloatComponent {
    @inline
    set_value(in_value: f32): void {
        const two_pi: f32 = 2.0 * <f32>Math.PI;
        if (in_value < 0.0) {
            this.m_value = in_value + two_pi;
        } else if (in_value >= two_pi) {
            this.m_value = in_value - two_pi;
        } else {
            this.m_value = in_value;
        }
    }
}