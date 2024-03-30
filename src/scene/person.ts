import { MOVE_STATUS } from "../constants";
import { SceneItem } from "./scene_item";

// base class for player, monster and other person stuff
export class Person extends SceneItem {
    private m_entity_id: number = -1;
    private m_radius: number = 0.0;
    private m_attack_distance: number = 0.0;
    private m_life: number = 0;
    private m_max_life: number = 0;
    private m_shield: number = 0.0;
    private m_max_shield: number = 0.0;
    private m_move_status: MOVE_STATUS = MOVE_STATUS.NONE;
    private m_is_dead: boolean = false;
    private m_select_radius: number = 0.0;
    private m_search_radius: number = 0.0;
    private m_search_spread: number = 0.0;
    private m_active_shield: boolean = false;
    private m_debug_draw: boolean = false;
    private m_team: number;
    private m_is_hide: boolean = false;
    private m_is_visible_search_cone: boolean = false;

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

    set_team(in_value: number) {
        this.m_team = in_value;
    }

    set_is_dead(in_value: boolean) {
        this.m_is_dead = in_value;
    }

    set_alive() {
        this.m_is_dead = false;
    }

    get_is_dead(): boolean {
        return this.m_is_dead;
    }

    get_id(): number {
        return this.m_entity_id;
    }

    set_radius(radius: number) {
        this.m_radius = radius;
    }

    set_search_radius(value: number) {
        this.m_search_radius = value;
    }

    set_search_spread(value: number) {
        this.m_search_spread = value;
    }

    set_attack_distance(value: number) {
        this.m_attack_distance = value;
    }

    set_life(life: number, max_life: number) {
        this.m_life = life;
        this.m_max_life = max_life;
    }

    set_active_shield(in_value: boolean) {
        this.m_active_shield = in_value;
    }

    set_shield(shield: number, max_shield: number) {
        this.m_shield = shield;
        this.m_max_shield = max_shield;
    }

    set_select_radius(value: number) {
        this.m_select_radius = value;
    }

    set_move(in_move: MOVE_STATUS) {
        this.m_move_status = in_move;
    }

    set_is_hide(in_value: boolean) {
        this.m_is_hide = in_value;
    }

    set_visible_search_cone(in_value: boolean) {
        this.m_is_visible_search_cone = in_value;
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

    get_life_proportion(): number {
        return this.m_life / this.m_max_life;
    }

    get_shield(): number {
        return this.m_shield;
    }

    get_max_shield(): number {
        return this.m_max_shield;
    }

    get_shield_proportion(): number {
        return this.m_shield / this.m_max_shield;
    }

    get_shield_active(): boolean {
        return this.m_active_shield;
    }

    get_select_radius(): number {
        return this.m_select_radius;
    }

    get_search_radius(): number {
        return this.m_search_radius;
    }

    get_search_spread(): number {
        return this.m_search_spread;
    }

    get_is_hide(): boolean {
        return this.m_is_hide;
    }

    get_is_visible_search_cone(): boolean {
        return this.m_is_visible_search_cone;
    }

    get_debug_draw(): boolean {
        return this.m_debug_draw;
    }
}