import { CLICK_CURSOR_TIME } from "../constants";
import { SceneItem } from "./scene_item";

export class ClickCursor extends SceneItem {
    m_active: boolean = false;

    m_time_accum: number = 0.0;
    m_life_time: number = 0.0;

    constructor() {
        super();

        this.m_life_time = CLICK_CURSOR_TIME;
    }

    activate(in_x: number, in_y: number) {
        this.m_tfm.set_translation(in_x, in_y);

        this.m_time_accum = 0.0;

        this.m_active = true;
    }

    get_active(): boolean {
        return this.m_active;
    }

    get_translation(): number[] {
        return this.m_tfm.translation();
    }

    update(dt: number) {
        if(this.m_active) {
            this.m_time_accum += 1000 * dt;

            if(this.m_time_accum >= this.m_life_time) {
                this.deactivate();
            }
        }
    }

    // return the value from [0, 1], measure the cursor life time
    get_proportion(): number {
        return this.m_time_accum / this.m_life_time;
    }

    deactivate() {
        this.m_active = false;
    }
}