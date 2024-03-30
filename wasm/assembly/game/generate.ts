import { NavmeshBaker } from "../pathfinder/baker/navmesh_baker";
import { Navmesh } from "../pathfinder/navmesh/navmesh";
import { Level } from "../promethean/level";
import { LevelGenerator } from "../promethean/level_generator";
import { Tile } from "../promethean/options";
import { create_generator } from "../promethean/promethean";
import { Settings, ConstantsSettings } from "./settings";

import { GenerateSettings, DefaultPlayerParameters, Defaults } from "./settings";

export function generate_level(seed: u32, generate: GenerateSettings): Level {
    let level_generator: LevelGenerator = create_generator(
        generate.get_level_size(), //level_height: i32
        generate.get_level_size(), //level_width: i32
        generate.get_min_room_size(), //min_room_width: i32
        generate.get_max_room_size(), //max_room_width: i32
        generate.get_min_room_size(), //min_room_height: i32
        generate.get_max_room_size(), //max_room_height: i32
        generate.get_rooms_count(), //number_of_rooms: i32
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

function setup_baker(level: Level, settings: Settings): NavmeshBaker {
    const baker: NavmeshBaker = new NavmeshBaker();
    const level_tiles: StaticArray<StaticArray<Tile>> = level.render();
    const constants: ConstantsSettings = settings.get_constants();
    const defaults: Defaults = settings.get_defaults();
    const player_defaults: DefaultPlayerParameters = defaults.default_player_parameters;
    const tile_size = constants.tile_size;
    const player_radius = player_defaults.radius;
    for (let y = 0, y_len = level_tiles.length; y < y_len; y++) {
        const level_row = level_tiles[y];
        for (let x = 0, x_len = level_row.length; x < x_len; x++) {
            const xy_tile = level_row[x];
            if(xy_tile != Tile.Empty) {
                const x_start: f32 = <f32>x * tile_size;
                const y_start: f32 = <f32>y * tile_size;
                const half: f32 = tile_size / 2;
                if (xy_tile == Tile.Floor) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.TopLeftInsideCorner) {
                    baker.add_geometry(
                        [x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + half],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.TopWall) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start + half,
                        x_start, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + half],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.TopRightInsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start + half,
                        x_start, 0.0, y_start + tile_size,
                        x_start + half, 0.0, y_start + tile_size,
                        x_start + half, 0.0, y_start + half],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.LeftWall) {
                    baker.add_geometry(
                        [x_start + half, 0.0, y_start,
                        x_start + half, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.BottomLeftInsideCorner) {
                    baker.add_geometry(
                        [x_start + half, 0.0, y_start,
                        x_start + half, 0.0, y_start + half,
                        x_start + tile_size, 0.0, y_start + half,
                        x_start + tile_size, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.BottomWall) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + half,
                        x_start + tile_size, 0.0, y_start + half,
                        x_start + tile_size, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.BottomRightInsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.RightWall) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + tile_size,
                        x_start + half, 0.0, y_start + tile_size,
                        x_start + half, 0.0, y_start],
                        [0, 1, 2, 3],
                        [4]);
                } else if (xy_tile == Tile.TopLeftOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + tile_size,
                        x_start + half, 0.0, y_start + tile_size,
                        x_start + half, 0.0, y_start + half,
                        x_start + tile_size, 0.0, y_start + half,
                        x_start + tile_size, 0.0, y_start],
                        [0, 1, 2, 3, 0, 3, 4, 5],
                        [4, 4]);
                } else if (xy_tile == Tile.TopRightOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start],
                        [0, 1, 2, 5, 2, 3, 4, 5],
                        [4, 4]);
                } else if (xy_tile == Tile.BottomLeftOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start,
                        x_start, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + half,
                        x_start + half, 0.0, y_start + half,
                        x_start + half, 0.0, y_start],
                        [0, 1, 4, 5, 1, 2, 3, 4],
                        [4, 4]);
                } else if (xy_tile == Tile.BottomRightOutsideCorner) {
                    baker.add_geometry(
                        [x_start, 0.0, y_start + half,
                        x_start, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start + tile_size,
                        x_start + tile_size, 0.0, y_start,
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
        player_radius, //agent_radius: float,
        0.95, //agent_max_climb: float,
        45.0, //agent_max_slope: float,
        5, //region_min_size: int,
        5, //region_merge_size: int,
        10.0, //edge_max_len: float,
        1.0, //edge_max_error: float,
        6, //verts_per_poly
        0.0, 0.0
    );

    return baker;
}

export function generate_navmesh(level: Level, settings: Settings): Navmesh {
    const baker = setup_baker(level, settings);
    
    const navmesh_vertices: StaticArray<f32> = baker.get_navmesh_vertices_f32();
    const navmesh_polygons: StaticArray<i32> = baker.get_navmesh_polygons();
    const navmesh_sizes: StaticArray<i32> = baker.get_navmesh_sizes();

    return new Navmesh(navmesh_vertices, navmesh_polygons, navmesh_sizes);
}