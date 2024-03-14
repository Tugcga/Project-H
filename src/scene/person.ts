import { MOVE_STATUS } from "../constants";
import { SceneItem } from "./scene_item";

// base class for player, monster and other person stuff
export class Person extends SceneItem {
    private m_entity_id: number = -1;
    private m_radius: number = 0.0;
    private m_attack_distance: number = 0.0;
    private m_life: number = 0;
    private m_max_life: number = 0;
    private m_move_status: MOVE_STATUS = MOVE_STATUS.NONE;
    private m_select_radius: number = 0.0;
    private m_debug_draw: boolean = true;

    constructor(in_id: number) {
        super();

        this.m_entity_id = in_id;
    }

    set_debug_draw(value: boolean) {
        this.m_debug_draw = value;
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

    set_atack_distance(value: number) {
        this.m_attack_distance = value;
    }

    set_life(life: number, max_life: number) {
        this.m_life = life;
        this.m_max_life = max_life;
    }

    set_select_radius(value: number) {
        this.m_select_radius = value;
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

    get_attack_distance(): number {
        return this.m_attack_distance;
    }

    get_life(): number {
        return this.m_life;
    }

    get_max_life(): number {
        return this.m_max_life;
    }

    get_select_radius(): number {
        return this.m_select_radius;
    }

    get_debug_draw(): boolean {
        return this.m_debug_draw;
    }
}