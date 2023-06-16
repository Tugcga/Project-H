import { MOVE_STATUS } from "../constants";
import { Transform } from "../transform";
import { SceneItem } from "./scene_item";

// base class for player, monster and other person stuff
export class Person extends SceneItem {
    private m_entity_id: number = -1;
    private m_radius: number = 0.0;
    private m_move_status: MOVE_STATUS = MOVE_STATUS.NONE;

    constructor(in_id: number) {
        super();

        this.m_entity_id = in_id;
    }

    set_id(in_id: number) {
        this.m_entity_id = in_id;
    }

    get_id(): number {
        return this.m_entity_id;
    }

    set_radius(radius: number) {
        this.m_radius = radius;
    }

    set_move(in_move: MOVE_STATUS) {
        this.m_move_status = in_move;
    }

    get_move(): MOVE_STATUS {
        return this.m_move_status;
    }

    get_radius(): number {
        return this.m_radius;
    }
}