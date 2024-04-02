import { Transform } from "../transform";

export class SceneItem {
    protected m_tfm: Transform = new Transform();  // in-scene transform (store position, rotation and scale)
    private m_debug_draw: boolean = false;

    constructor() {

    }

    set_debug_draw(value: boolean) {
        this.m_debug_draw = value;
    }
    
    set_position(x: number, y: number) {
        this.m_tfm.set_translation(x, y);
    }

    set_angle(angle: number) {
        this.m_tfm.set_rotation(angle);
    }

    get_debug_draw(): boolean {
        return this.m_debug_draw;
    }

    get_tfm(): Transform {
        return this.m_tfm;
    }

    get_translation(): number[] {
        return this.m_tfm.translation();
    }
}

export class SceneIDItem extends SceneItem {
    private m_entity_id: number = -1;

    constructor(in_id: number) {
        super();

        this.m_entity_id = in_id;
    }

    get_id(): number {
        return this.m_entity_id;
    }

    set_id(in_id: number) {
        this.m_entity_id = in_id;
    }
}