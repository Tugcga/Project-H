import { BULLET_TYPE } from "../constants";
import { SceneIDItem, SceneItem } from "./scene_item";

export class Bullet extends SceneIDItem {
    private m_type: BULLET_TYPE;

    private m_debug_target_x: number = 0.0;
    private m_debug_target_y: number = 0.0;

    constructor(id: number, type: BULLET_TYPE) {
        super(id);

        this.m_type = type;
    }

    set_debug_target(x: number, y: number) {
        this.m_debug_target_x = x;
        this.m_debug_target_y = y;
    }

    get_type(): BULLET_TYPE {
        return this.m_type;
    }

    get_debug_target_x(): number {
        return this.m_debug_target_x;
    }

    get_debug_target_y(): number {
        return this.m_debug_target_y;
    }
}