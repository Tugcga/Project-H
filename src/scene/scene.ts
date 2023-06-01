import { __Internref16 } from "../../wasm/build/game_api";
import { ClickCursor } from "./click_cursor";
import { FIRST_MOUSE_CLICK_DELTA, OTHER_MOUSE_CLICK_DELTA } from "../constants";
import { SceneTile } from "./scene_tile";
import { Player } from "./player";
import { Monster } from "./monster";

// the Scene instance contains data of objects in the game
export class Scene {
    m_level_width: number = 0;
    m_level_height: number = 0;
    m_level_tile_size: number = 0.0;

    m_last_click_time: number = 0;
    m_click_number: number = 0;
    m_click_cursor: ClickCursor = new ClickCursor();
    m_level_tiles: Map<number, SceneTile> = new Map<number, SceneTile>();
    m_player: Player = new Player();
    m_monsters: Map<number, Monster> = new Map<number, Monster>();

    constructor(level_width: number,
                level_height: number,
                level_tile_size: number) {
        this.m_level_width = level_width;
        this.m_level_height = level_height;
        this.m_level_tile_size = level_tile_size;
    }

    // when we click into canvas, we should add to the scene cursor object
    // input are world coordinates of the click position
    // return true if the point in the walkable area
    click_position(wasm_module: any, game_ptr: __Internref16, in_x: number, in_y: number, force: boolean = false): boolean {
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
    }

    // call when release the mouse
    reset_click() {
        this.m_click_number = 0;
    }

    // may call from client to draw the cursor on the canvas
    get_click_cursor(): ClickCursor {
        return this.m_click_cursor;
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

    set_player_position(x: number, y: number) {
        this.m_player.set_position(x, y);
    }

    set_player_radius(radius: number) {
        this.m_player.set_radius(radius);
    }

    set_player_angle(angle: number) {
        this.m_player.set_angle(angle);
    }

    set_player_move(is_move: boolean) {
        this.m_player.set_move(is_move);
    }

    set_monster_position(entity: number, x: number, y: number) {
        if(this.m_monsters.has(entity)) {
            const monster = this.m_monsters.get(entity);
            if(monster) {
                monster.set_position(x, y);
            }
        } else {
            const monster = new Monster();
            monster.set_position(x, y);

            this.m_monsters.set(entity, monster);
        }
    }

    set_monster_radius(entity: number, radius: number) {
        if(this.m_monsters.has(entity)) {
            const monster = this.m_monsters.get(entity);
            if(monster) {
                monster.set_radius(radius);
            }
        } else {
            const monster = new Monster();
            monster.set_radius(radius);

            this.m_monsters.set(entity, monster);
        }
    }

    set_monster_angle(entity: number, angle: number) {
        if(this.m_monsters.has(entity)) {
            const monster = this.m_monsters.get(entity);
            if(monster) {
                monster.set_angle(angle);
            }
        } else {
            const monster = new Monster();
            monster.set_angle(angle);

            this.m_monsters.set(entity, monster);
        }
    }

    set_monster_move(entity: number, is_move: boolean) {
        if(this.m_monsters.has(entity)) {
            const monster = this.m_monsters.get(entity);
            if(monster) {
                monster.set_move(is_move);
            }
        } else {
            const monster = new Monster();
            monster.set_move(is_move);

            this.m_monsters.set(entity, monster);
        }
    }

    remove_monster(entity: number) {
        if(this.m_monsters.has(entity)) {
            this.m_monsters.delete(entity);
        }
    }
}