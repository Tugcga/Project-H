import { TwoFloatsComponent } from "./one_value";

// spatial position
export class PositionComponent extends TwoFloatsComponent { }

// use this component to track is an itm is actualy move
// we should change angle only when the item is move
// if it stops, then doest not change angle
export class PreviousPositionComponent extends TwoFloatsComponent { }

export class TargetPositionComponent extends TwoFloatsComponent { }