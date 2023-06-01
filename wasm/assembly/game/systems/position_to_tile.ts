import { System } from "../../simple_ecs/system_manager";
import { Entity } from "../../simple_ecs/types";
import { List } from "../../pathfinder/common/list";

import { PositionComponent } from "../components/position";
import { TilePositionComponent } from "../components/tile_position";
import { NeighborhoodRadiusComponent } from "../components/neighborhood_radius";
import { NeighborhoodTilesComponent } from "../components/neighborhood_tiles";

import { external_tile_delete, external_tile_create } from "../../external";

// this system convert item position to the tile index (x, y)
export class PositionToTileSystem extends System {
    private m_tile_size: f32 = 0.0;
    private m_level_width: i32 = 0;
    private m_level_height: i32 = 0;

    private i_added_indices: Set<u32> = new Set<u32>();  // store here which indices we already add to the new visible
    private i_new_visible: List<u32> = new List<u32>();
    private i_new_delete: List<u32> = new List<u32>();

    constructor(in_width: i32, in_height: i32, tile_size: f32) {
        super();

        this.m_tile_size = tile_size;
        this.m_level_width = in_width;
        this.m_level_height = in_height;
    }

    update(dt: f32): void {
        // we assume that this system call only for player, so, use singleton
        const entity: Entity = this.singleton();
        const tile_size = this.m_tile_size;
        const level_width = this.m_level_width;
        const level_height = this.m_level_height;

        const position: PositionComponent | null = this.get_component<PositionComponent>(entity);
        const tile: TilePositionComponent | null = this.get_component<TilePositionComponent>(entity);
        const radius: NeighborhoodRadiusComponent| null = this.get_component<NeighborhoodRadiusComponent>(entity);
        const neigh_tiles: NeighborhoodTilesComponent| null = this.get_component<NeighborhoodTilesComponent>(entity);

        if (position && tile && radius && neigh_tiles) {
            // calculate new tile position
            const new_tile_x = <i32>(position.x() / tile_size);
            const new_tile_y = <i32>(position.y() / tile_size);
            if (new_tile_x != tile.x() || new_tile_y != tile.y()) {
                const r: i32 = radius.value();
                // here we should update visible tiles
                // check visibility of all previous visible tiles
                // if it visible, add it to the separate array
                // if it should be invisible - add it to delete array
                let old_visible = neigh_tiles.visible_tiles();
                const vis_count = old_visible.length / 4;  // the structure is (x, y, index, type)

                var new_visible = this.i_new_visible;
                new_visible.reset();
                var new_delete = this.i_new_delete;
                new_delete.reset();

                var added_indices = this.i_added_indices;
                added_indices.clear();
                
                for (let i = 0; i < vis_count; i++) {
                    const vis_x: i32 = <i32>old_visible.get(4*i);
                    const vis_y: i32 = <i32>old_visible.get(4*i + 1);
                    const vis_index: u32 = old_visible.get(4*i + 2);
                    const vis_type: u32 = old_visible.get(4*i + 3);
                    if (<i32>Math.abs(vis_x - new_tile_x) <= r && <i32>Math.abs(vis_y - new_tile_y) <= r) {
                        // this tile in visible radius with respect to the new tile
                        // write data to new visible
                        new_visible.push(vis_x);
                        new_visible.push(vis_y);
                        new_visible.push(vis_index);
                        new_visible.push(vis_type);

                        added_indices.add(vis_index);
                    } else {
                        // this tile outside of the new visible
                        new_delete.push(vis_index);  // add only index
                    }
                }

                // next we should consider all tiles in the neighborhood of the current tile
                // and add those tiles, which are not added yet
                // and also add their indices into new array
                let new_create: List<u32> = new List<u32>((2*r + 1) * (2*r + 1) * 4);
                const x_start = <i32>Math.max(0, new_tile_x - r);
                const x_end = <i32>Math.min(level_width, new_tile_x + r + 1);
                const y_start =  <i32>Math.max(0, new_tile_y - r);
                const y_end = <i32>Math.min(level_height, new_tile_y + r + 1);
                for (let x = x_start; x < x_end; x++) {
                    for (let y = y_start; y < y_end; y++) {
                        const i: u32 = y * neigh_tiles.level_width() + x;
                        const t = neigh_tiles.level_tile_type(y, x);
                        if (!added_indices.has(i)) {
                            new_create.push(x);
                            new_create.push(y);
                            new_create.push(i);
                            new_create.push(t);

                            new_visible.push(x);
                            new_visible.push(y);
                            new_visible.push(i);
                            new_visible.push(t);

                            added_indices.add(i);
                        }
                    }
                }
                // write to component
                neigh_tiles.set_arrays(new_visible, new_delete, new_create);

                tile.set_x(new_tile_x);
                tile.set_y(new_tile_y);

                // output to the host old and new tiles
                for (let i = 0, len = new_delete.length; i < len; i++) {
                    external_tile_delete(new_delete[i]);
                }

                for (let i = 0, len = new_create.length; i < len; i += 4) {
                    external_tile_create(new_create[i], new_create[i + 1], new_create[i + 2], new_create[i + 3]);
                }
            } else {
                // current player tile is the same
                // clear component
                neigh_tiles.clear_to_create();
                neigh_tiles.clear_to_delete();
            }
        }
    }
}
