import { NavmeshBaker } from "../pathfinder/baker/navmesh_baker";
import { PathFinder } from "../pathfinder/pathfinder";
import { Level } from "../promethean/level";
import { LevelGenerator } from "../promethean/level_generator";
import { Tile } from "../promethean/options";
import { create_generator } from "../promethean/promethean";
import { MONSTER_RADIUS, PLAYER_RADIUS, TILE_SIZE } from "./constants";

export function generate_level(seed: u32 = 1): Level {
    let level_generator: LevelGenerator = create_generator(
        22, //level_height: i32
        22, //level_width: i32
        2, //min_room_width: i32
        4, //max_room_width: i32
        2, //min_room_height: i32
        4, //max_room_height: i32
        10, //number_of_rooms: i32
        1, //border: i32
        1, //room_border: i32
        false, //overlap_rooms: bool
        true, //rooms_square: bool
        true, //rooms_rectangle: bool
        false, //rooms_cross: bool
        false, //rooms_diamond: bool
        seed //seed
    );
    return level_generator.generate();
}

export function generate_pathfinder(level: Level): PathFinder {
    const baker: NavmeshBaker = new NavmeshBaker();
    const level_tiles: StaticArray<StaticArray<Tile>> = level.render();
    for(let y = 0, y_len = level_tiles.length; y < y_len; y++) {
        const level_row = level_tiles[y];
        for(let x = 0, x_len = level_row.length; x < x_len; x++) {
            const xy_tile = level_row[x];
            if(xy_tile != Tile.Empty) {
                const x_start: f32 = <f32>x * TILE_SIZE;
                const y_start: f32 = <f32>y * TILE_SIZE;
                const half: f32 = TILE_SIZE / 2;
                if(xy_tile == Tile.Floor) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.TopLeftInsideCorner) {
                    baker.add_geometry(
                        [x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + half],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.TopWall) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start + half,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + half],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.TopRightInsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start + half,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + half, 0.0, y_start + TILE_SIZE,
                        x_start + half, 0.0, y_start + half],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.LeftWall) {
                    baker.add_geometry(
                        [x_start + half, 0.0, y_start,
                        x_start + half, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.BottomLeftInsideCorner) {
                    baker.add_geometry(
                        [x_start + half, 0.0, y_start,
                        x_start + half, 0.0, y_start + half,
                        x_start + TILE_SIZE, 0.0, y_start + half,
                        x_start + TILE_SIZE, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.BottomWall) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + half,
                        x_start + TILE_SIZE, 0.0, y_start + half,
                        x_start + TILE_SIZE, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.BottomRightInsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.RightWall) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + half, 0.0, y_start + TILE_SIZE,
                        x_start + half, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if(xy_tile == Tile.TopLeftOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + half, 0.0, y_start + TILE_SIZE,
                        x_start + half, 0.0, y_start + half,
                        x_start + TILE_SIZE, 0.0, y_start + half,
                        x_start + TILE_SIZE, 0.0, y_start],
                        [0, 1, 2, 3, 0, 3, 4, 5],
                        [4, 4]);
                } else if(xy_tile == Tile.TopRightOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start],
                        [0, 1, 2, 5, 2, 3, 4, 5],
                        [4, 4]);
                } else if(xy_tile == Tile.BottomLeftOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start],
                        [0, 1, 4, 5, 1, 2, 3, 4],
                        [4, 4]);
                } else if(xy_tile == Tile.BottomRightOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start + half,
                        x_start, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start + TILE_SIZE,
                        x_start + TILE_SIZE, 0.0, y_start,
                        x_start + half, 0.0, y_start,
                        x_start + half, 0.0, y_start + half],
                        [0, 1, 2, 5, 5, 2, 3, 4],
                        [4, 4]);
                }
            }
        }
    }

    baker.bake(
        0.05, //cell_size: float,
        0.05, //cell_height: float,
        1.5, //agent_height: float,
        PLAYER_RADIUS, //agent_radius: float,
        0.95, //agent_max_climb: float,
        45.0, //agent_max_slope: float,
        5, //region_min_size: int,
        5, //region_merge_size: int,
        10.0, //edge_max_len: float,
        1.0, //edge_max_error: float,
        6, //verts_per_poly
        0.0, 0.0
    );
    
    const navmesh_vertices: StaticArray<f32> = baker.get_navmesh_vertices_f32();
    const navmesh_polygons: StaticArray<i32> = baker.get_navmesh_polygons();
    const navmesh_sizes: StaticArray<i32> = baker.get_navmesh_sizes();

    return new PathFinder(
            navmesh_vertices,
            navmesh_polygons,
            navmesh_sizes,
            1.5, //neighbor_dist: f32
            5, //max_neighbors: i32
            1.0, //time_horizon: f32
            0.01, //time_horizon_obst: f32
            MONSTER_RADIUS, //agent_radius: f32
            1.0, //update_path_find: f32
            false, //continuous_moving: bool
            true, //move_agents: bool
            true, //snap_agents: bool
            false //use_normals: bool
    );
}