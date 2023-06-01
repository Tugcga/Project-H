import { OneIntComponent } from "./one_value";

// define the size of the visible radius for the player
export class NeighborhoodRadiusComponent extends OneIntComponent {
    constructor(in_value: i32) {
        super();
        
        this.m_value = in_value;
    }
}