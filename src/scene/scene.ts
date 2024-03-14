import { ClickCursor } from "./click_cursor";
import { COOLDAWN, FIRST_MOUSE_CLICK_DELTA, MOVE_STATUS, OTHER_MOUSE_CLICK_DELTA, TARGET_ACTION } from "../constants";
import { SceneTile } from "./scene_tile";
import { Player } from "./player";
import { Monster } from "./monster";
import { Cooldawn } from "./cooldawn";
import { ActionEffect, ActionEffectBase } from "./action_effect";
import { Person } from "./person";

// the Scene instance contains data of objects in the game
export class Scene {
    private m_level_width: number = 0;
    private m_level_height: number = 0;
    private m_level_tile_size: number = 0.0;

    private m_last_click_time: number = 0;
    private m_click_number: number = 0;
    private m_click_cursor: ClickCursor = new ClickCursor(this);
    private m_level_tiles: Map<number, SceneTile> = new Map<number, SceneTile>();
    private m_player: Player = new Player(0);
    private m_player_id: number = 0;
    private m_monsters: Map<number, Monster> = new Map<number, Monster>();
    private m_cooldawns: Cooldawn = new Cooldawn();
    private m_effects: ActionEffect = new ActionEffect();

    constructor(level_width: number,
                level_height: number,
                level_tile_size: number) {
        this.m_level_width = level_width;
        this.m_level_height = level_height;
        this.m_level_tile_size = level_tile_size;
    }

    // return true if we should send the click to the game
    // false if it's not required
    // is_force = true when we call this method by mouse press
    // is_force = false if the method called when the mouse is hold
    // if this method return true, then we send command to the game and it will call external method for select entity or point position (or may be nothing)
    input_click(in_canvas_x: number, in_canvas_y: number,
                in_world_x: number, in_world_y: number,
                is_force: boolean): boolean {
        const current_time = performance.now();
        if(is_force || current_time - this.m_last_click_time > (this.m_click_number == 1 ? FIRST_MOUSE_CLICK_DELTA : OTHER_MOUSE_CLICK_DELTA)) {
            this.m_last_click_time = current_time;
            this.m_click_number += 1;
            if(this.m_click_number > 2) {
                this.m_click_number = 2;
            }

            if (is_force) {
                this.m_click_cursor.charge();
            }

            return true;
        }

        return false;
    }

    input_click_entity(id: number, action: TARGET_ACTION) {
        if (action == TARGET_ACTION.ATTACK) {
            this.m_click_cursor.activate_by_enemy_select(id);
        }
    }

    input_click_position(pos_x: number, pos_y: number) {
        if (this.m_click_cursor.is_charge()) {
            this.m_click_cursor.activate_by_position(pos_x, pos_y);
        }

        this.m_click_cursor.deactivate_enemy_select();
    }

    // when we click into canvas, we should add to the scene cursor object
    // input are world coordinates of the click position
    // return true if the point in the walkable area
    /*click_position(wasm_module: any, game_ptr: __Internref18, in_x: number, in_y: number, force: boolean = false): boolean {
        const current_time = performance.now();
        if(force || current_time - this.m_last_click_time > (this.m_click_number == 1 ? FIRST_MOUSE_CLICK_DELTA : OTHER_MOUSE_CLICK_DELTA)) {
            this.m_last_click_time = current_time;
            this.m_click_number += 1;
            if(this.m_click_number > 2) {
                this.m_click_number = 2;
            }
            // call to move the player
            const is_define: boolean = wasm_module.game_client_point(game_ptr, in_x, in_y);

            if(force && is_define) {
                this.m_click_cursor.activate(in_x, in_y);
            }

            return is_define;
        }

        return false;
    }*/

    // call when release the mouse
    reset_click() {
        this.m_click_number = 0;
    }

    // may call from client to draw the cursor on the canvas
    get_click_cursor(): ClickCursor {
        return this.m_click_cursor;
    }

    get_cooldawns(): Cooldawn {
        return this.m_cooldawns;
    }

    get_action_effects(): ActionEffect {
        return this.m_effects;
    }

    get_person_cooldawns(entity: number): Map<COOLDAWN, [number, number]> {
        return this.m_cooldawns.get_cooldawns(entity);
    }

    get_person_effects(entity: number): Array<ActionEffectBase> {
        return this.m_effects.get_entity_effects(entity);
    }

    get_level_tiles(): Map<number, SceneTile> {
        return this.m_level_tiles;
    }

    get_player(): Player {
        return this.m_player;
    }

    get_monsters(): Map<number, Monster> {
        return this.m_monsters;
    }

    get_person(id: number): Person | null {
        if (id == this.m_player_id) {
            return this.m_player;
        } else {
            const monster = this.m_monsters.get(id);
            if (monster) {
                return monster;
            }
        }

        return null;
    }

    get_entity_position(id: number): number[] {
        if (id == this.m_player_id) {
            return this.m_player.get_tfm().translation();
        } else {
            const monster = this.m_monsters.get(id);
            if (monster) {
                return monster.get_tfm().translation();
            }
        }

        return [];
    }

    delete_tile(index: number) {
        if(this.m_level_tiles.has(index)) {
            this.m_level_tiles.delete(index);
        }
    }

    create_tile(pos_x: number, pos_y: number, index: number, type: number) {
        this.m_level_tiles.set(index, new SceneTile(pos_x, 
                                                    pos_y,
                                                    this.m_level_tile_size,
                                                    type));
    }

    // called when we create the player entity
    set_player_id(in_id: number) {
        this.m_player_id = in_id;
        this.m_player.set_id(in_id);
        this.m_cooldawns.add_entity(in_id);
    }

    // if player is shift, then destroy the cursor
    entity_start_shift(id: number) {
        if (this.m_player_id == id) {
            this.m_click_cursor.deactivate();
        }
    }

    is_player(in_id: number): boolean {
        return this.m_player_id == in_id;
    }

    set_player_radius(radius: number) {
        this.m_player.set_radius(radius);
    }

    set_entity_atack_distance(id: number, value: number) {
        if (this.m_player_id == id) {
            this.m_player.set_atack_distance(value);
        }
    }

    set_entity_life(id: number, life: number, max_life: number) {
        if (this.m_player_id == id) {
            this.m_player.set_life(life, max_life);
        }
    }

    set_entity_attack_time(id: number, value: number) {
        if (this.m_player_id == id) {
            
        }
    }

    set_entity_select_radius(id: number, value: number) {
        if (id == this.m_player_id) {
            this.m_player.set_select_radius(value);
        } else {
            if(this.m_monsters.has(id)) {
                const monster = this.m_monsters.get(id);
                if(monster) {
                    monster.set_select_radius(value);
                }
            } else {
                const monster = new Monster(id);
                monster.set_select_radius(value);
    
                this.m_monsters.set(id, monster);
            }
        }
    }

    set_entity_position(entity: number, x: number, y: number) {
        if (entity == this.m_player_id) {
            this.m_player.set_position(x, y);
        } else {
            if(this.m_monsters.has(entity)) {
                const monster = this.m_monsters.get(entity);
                if(monster) {
                    monster.set_position(x, y);
                }
            } else {
                const monster = new Monster(entity);
                monster.set_position(x, y);
    
                this.m_monsters.set(entity, monster);
            }
        }
    }

    set_monster_radius(entity: number, radius: number) {
        if(this.m_monsters.has(entity)) {
            const monster = this.m_monsters.get(entity);
            if(monster) {
                monster.set_radius(radius);
            }
        } else {
            const monster = new Monster(entity);
            monster.set_radius(radius);
            this.m_cooldawns.add_entity(entity);

            this.m_monsters.set(entity, monster);
        }
    }

    set_entity_angle(entity: number, angle: number) {
        if (entity == this.m_player_id) {
            this.m_player.set_angle(angle);
        } else {
            if(this.m_monsters.has(entity)) {
                const monster = this.m_monsters.get(entity);
                if(monster) {
                    monster.set_angle(angle);
                }
            } else {
                const monster = new Monster(entity);
                monster.set_angle(angle);
                this.m_cooldawns.add_entity(entity);
    
                this.m_monsters.set(entity, monster);
            }
        }
    }

    set_entity_move(entity: number, move_status: MOVE_STATUS) {
        if (entity == this.m_player_id) {
            this.m_player.set_move(move_status);
        }
        else {
            if(this.m_monsters.has(entity)) {
                const monster = this.m_monsters.get(entity);
                if(monster) {
                    monster.set_move(move_status);
                }
            } else {
                const monster = new Monster(entity);
                monster.set_move(move_status);
                this.m_cooldawns.add_entity(entity);
    
                this.m_monsters.set(entity, monster);
            }
        }
    }

    remove_monster(entity: number) {
        if(this.m_monsters.has(entity)) {
            // cursor can have the link to removed entity
            // remove this link and only then delete the entity
            this.m_click_cursor.deactivate_by_entity_remove(entity);
            this.m_monsters.delete(entity);
        }

        this.m_cooldawns.remove_entity(entity);
    }
}