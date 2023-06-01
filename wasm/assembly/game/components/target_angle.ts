import { OneFloatComponent } from "./one_value";

// use this component to define target angle of the item
// in separate system we should change actual angle (from AngleComponent) to this target value
// angle measured from the positive x-axist conter clock-wise direction
export class TargetAngleComponent extends OneFloatComponent { }