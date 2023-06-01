import { Transform } from "../transform";
import { SceneItem } from "./scene_item";

// base class for player, monster and other person stuff
export class Person extends SceneItem {
    m_radius: number = 0.0;
    m_is_move: boolean = false;

    constructor() {
        super();
    }

    set_radius(radius: number) {
        this.m_radius = radius;
    }

    set_move(is_move: boolean) {
        this.m_is_move = is_move;
    }

    get_move(): boolean {
        return this.m_is_move;
    }

    get_radius(): number {
        return this.m_radius;
    }
}