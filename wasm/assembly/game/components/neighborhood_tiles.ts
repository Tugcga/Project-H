import { List } from "../../pathfinder/common/list";
import { Level } from "../../promethean/level";

// store in this cmponent data about neighborhood tiles
export class NeighborhoodTilesComponent {
    private m_level: Level;
    private m_visible_tiles: List<u32>;  // store each tile as triple: (x, y, i, type), where i - total tile index, i = y * width + x
    private m_tiles_to_delete: List<u32>;  // here we will store only global indices (i)
    private m_tiles_to_create: List<u32>;  // on client all these tiles should be ordered by these indices

    constructor(in_level: Level) {
        const tiles_count = in_level.width() * in_level.height();

        this.m_visible_tiles = new List<u32>(tiles_count * 4);
        this.m_tiles_to_delete = new List<u32>(tiles_count);  // here store only indices
        this.m_tiles_to_create = new List<u32>(tiles_count * 4);  // here store also all 4 tile data components

        this.m_level = in_level;
    }

    @inline
    level_tile_type(x: i32, y: i32): u32 {
        return this.m_level.get_from_coordinates(x, y);
    }

    @inline
    level_width(): i32 {
        return this.m_level.width();
    }

    @inline
    visible_tiles(): List<u32> {
        return this.m_visible_tiles;
    }

    @inline
    delete_tiles(): List<u32> {
        return this.m_tiles_to_delete;
    }

    @inline
    create_tiles(): List<u32> {
        return this.m_tiles_to_create;
    }

    set_arrays(in_visible: List<u32>, in_delete: List<u32>, in_create: List<u32>): void {
        this.m_visible_tiles.copy_from(in_visible);
        this.m_tiles_to_delete.copy_from(in_delete);
        this.m_tiles_to_create.copy_from(in_create);
    }

    @inline
    clear_to_delete(): void {
        this.m_tiles_to_delete.reset();
    }

    @inline
    clear_to_create(): void {
        this.m_tiles_to_create.reset();
    }
}