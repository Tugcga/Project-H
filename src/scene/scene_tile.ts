import { SceneItem } from "./scene_item";

export class SceneTile extends SceneItem {
    m_tile_size: number = 0.0;
    m_type: number = 1;

    constructor(pos_x: number, pos_y: number, tile_size: number, type: number) {
        super();

        this.set_position(pos_x, pos_y);

        this.m_tile_size = tile_size;
        this.m_type = type;
    }

    get_tile_size(): number {
        return this.m_tile_size;
    }

    get_type(): number {
        return this.m_type;
    }
}