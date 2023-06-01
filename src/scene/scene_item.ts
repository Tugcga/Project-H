import { Transform } from "../transform";

export class SceneItem {
    m_tfm: Transform = new Transform();  // in-scene transform (store position, rotation and scale)

    constructor() {

    }
    
    set_position(x: number, y: number) {
        this.m_tfm.set_translation(x, y);
    }

    set_angle(angle: number) {
        this.m_tfm.set_rotation(angle);
    }

    get_tfm(): Transform {
        return this.m_tfm;
    }

    get_translation(): number[] {
        return this.m_tfm.translation();
    }
}