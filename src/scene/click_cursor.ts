import { CLICK_CURSOR_TIME } from "../constants";
import { Person } from "./person";
import { Scene } from "./scene";
import { SceneItem } from "./scene_item";

export enum CURSOR_TYPE {
    NONE,
    POSITION,
    ENEMY_ENTITY
}

export class ClickCursor extends SceneItem {
    m_active: boolean = false;
    m_charge: boolean = false;  // if true then it ready to activate

    m_time_accum: number = 0.0;
    m_life_time: number = 0.0;
    m_type = CURSOR_TYPE.NONE;
    m_select_person: Person | null = null;
    m_parent_scene: Scene;  // use this link to the scene to get scene monsters or other information
    
    m_remember_last_select: boolean = false;  // if we deselect entity when it removed (too far), then remember it
    m_remember_id: number = 0;

    constructor(in_parent_scene: Scene) {
        super();

        this.m_life_time = CLICK_CURSOR_TIME;
        this.m_parent_scene = in_parent_scene;
    }

    charge() {
        this.m_charge = true;
    }

    is_charge(): boolean {
        return this.m_charge;
    }

    activate_by_position(in_x: number, in_y: number) {
        this.m_tfm.set_translation(in_x, in_y);

        this.m_time_accum = 0.0;

        this.m_active = true;
        this.m_charge = false;
        this.m_type = CURSOR_TYPE.POSITION;

        this.m_remember_last_select = false;
        this.m_remember_id = 0;
    }

    activate_by_entity_remember(id: number) {
        if (this.m_remember_last_select && this.m_remember_id == id) {
            this.activate_by_enemy_select(id);
        }
    }

    activate_by_enemy_select(id: number) {
        this.m_time_accum = 0.0;

        this.m_select_person = this.m_parent_scene.get_person(id);
        if (this.m_select_person) {
            this.m_active = true;
            this.m_charge = false;
            this.m_type = CURSOR_TYPE.ENEMY_ENTITY;

            this._define_tfm_for_selection();

            this.m_remember_last_select = false;
            this.m_remember_id = 0;
        } else {
            this.m_remember_last_select = true;
            this.m_remember_id = id;
        }
    }

    get_type(): CURSOR_TYPE {
        return this.m_type;
    }

    get_active(): boolean {
        return this.m_active;
    }

    get_translation(): number[] {
        return this.m_tfm.translation();
    }

    get_size(): number {
        return this.m_tfm.uniform_scale();
    }

    private _define_tfm_for_selection() {
        if (this.m_type == CURSOR_TYPE.ENEMY_ENTITY && this.m_select_person) {
            const pos = this.m_select_person.get_tfm().translation();
            this.m_tfm.set_translation(pos[0], pos[1]);
            // encode select radius in transform scale
            this.m_tfm.set_uniform_scale(this.m_select_person.get_select_radius());
        }
    }

    update(dt: number) {
        if(this.m_active) {
            // calculate position
            if (this.m_type == CURSOR_TYPE.ENEMY_ENTITY) {
                this._define_tfm_for_selection();
            }
            this.m_time_accum += 1000 * dt;

            if(this.m_type == CURSOR_TYPE.POSITION && this.m_time_accum >= this.m_life_time) {
                // measure time only for position cursor
                this.deactivate();
            }
        }
    }

    // return the value from [0, 1], measure the cursor life time
    get_proportion(): number {
        return this.m_time_accum / this.m_life_time;
    }

    deactivate_by_entity_remove(id: number, by_dead: boolean) {
        if (this.m_type == CURSOR_TYPE.ENEMY_ENTITY && this.m_select_person) {
            if (this.m_select_person.get_id() == id) {
                this.deactivate_enemy_select();

                if (!by_dead) {
                    this.m_remember_last_select = true;
                    this.m_remember_id = id;
                }
            }
        }
    }

    deactivate_enemy_select() {
        if (this.m_type == CURSOR_TYPE.ENEMY_ENTITY) {
            this.deactivate();
        }
    }

    deactivate() {
        this.m_active = false;
        this.m_charge = false;
        this.m_type = CURSOR_TYPE.NONE;
        this.m_select_person = null;

        this.m_remember_last_select = false;
        this.m_remember_id = 0;
    }
}