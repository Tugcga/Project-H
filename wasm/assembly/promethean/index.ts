/*import { log_message } from "./utilities";

import { Point }from "./point";
import { Tile, RoomType, Options, PathFinderTile, PathFinderOptions } from "./options";
import { PseudoRandom } from "./pseudo_random";
import { GridPattern, grid_patterns } from "./grid_pattern";
import { Room, RoomGenerator } from "./room_generator";
import { DefaultRenderer, CrossRenderer, DiamondRenderer, IRoomRenderer } from "./room_renderer";
import { tile_level, Level, LevelStatistics } from "./level";
import { PathFinder } from "./path_finder";
import { Corridor, generate_corridors } from "./corridor_generator";
import { LevelGenerator } from "./level_generator";

import std from "astl";

function main_port(): void {
    let p1 = new Point();
    let p2 = new Point(1, 2);
    let p3 = new Point(0, 0);

    log_message(p1.toString() + " " + p2.toString() + " " + (p1.equal(p3)).toString());

    let options = new Options();
    options.level_width = 16;
    options.level_height = 16;
    options.min_room_width = 3;
    options.max_room_width = 3;
    options.min_room_height = 3;
    options.max_room_height = 3;
    options.number_of_rooms = 100;
    options.overlap_rooms = false;
    log_message(options.room_types.toString());

    let png = new PseudoRandom();

    for(let i = 0; i < 1; i++){
        log_message(png.next_odd(0, 5).toString());
    }

    const gp = grid_patterns;
    log_message(gp[0].m_pattern.toString());
    
    let r = new Room(5, 12, 2, 7);
    log_message(r.toString() + " " + r.center().toString());

    let gen = new RoomGenerator(png);
    let rooms = gen.generate_rooms(options);
    log_message("rooms count: " + rooms.length.toString() + ": " + rooms.toString());

    let render_default = new DefaultRenderer();
    let render_cross = new CrossRenderer();
    let render_diamond = new DiamondRenderer();
    let r_rect = new Room(7, 7, 0, 0, RoomType.Diamond);
    log_message(render_diamond.get_tiles(r_rect).toString());

    let level = new Level(4, 4);
    level.set_tile(1, 1, Tile.Floor);
    level.set_tile(1, 2, Tile.Floor);
    level.inflate(2);
    tile_level(level, grid_patterns);
    log_message(level.toString());

    let world_grid = new StaticArray<StaticArray<PathFinderTile>>(5);
    for(let i = 0; i < world_grid.length; i++){
        let row = new StaticArray<PathFinderTile>(8);
        for(let j = 0; j < row.length; j++){
            if(i == 0 || i == world_grid.length - 1 || j == 0 || j == row.length - 1){
                row[j] = PathFinderTile.Blocked;
            }
            else{
                row[j] = PathFinderTile.Pathable;
            }
        }
        world_grid[i] = row;
    }
    world_grid[0][3] = PathFinderTile.Blocked;
    world_grid[1][3] = PathFinderTile.Blocked;
    world_grid[2][3] = PathFinderTile.Blocked;
    world_grid[2][5] = PathFinderTile.Blocked;
    world_grid[3][5] = PathFinderTile.Blocked;
    world_grid[4][5] = PathFinderTile.Blocked;
    const pf_opts = new PathFinderOptions();

    let pathfinder = new PathFinder(world_grid, pf_opts);
    log_message(pathfinder.toString());
    let path = pathfinder.find_path(new Point(1, 1), new Point(3, 6));
    log_message(path.toString());

    let c_rooms = new StaticArray<Room>(3);
    c_rooms[0] = new Room(4, 4, 2, 6);
    c_rooms[1] = new Room(4, 4, 6, 2);
    c_rooms[2] = new Room(4, 4, 8, 8);
    let corridors = generate_corridors(c_rooms, options);
    log_message(corridors.toString());

    let generator = new LevelGenerator(options);
    let gen_level = generator.generate();
    //log_message(gen_level.toString());
    let stat = gen_level.statistics();
    log_message(stat.toString());
}

function point_compare(x: Point, y: Point): boolean{
    return x.x() > y.x();
}

function main_queue(): void{
    const adaptor: std.PriorityQueue<i32> = new std.PriorityQueue();
    adaptor.push(10);
    adaptor.push(7);
    adaptor.push(12);
    adaptor.push(5);
    adaptor.push(14);
    adaptor.push(-2);

    adaptor.pop();

    log_message(adaptor.size().toString() + " " + adaptor.empty().toString() + " " + adaptor.top().toString());

    const q: std.PriorityQueue<Point> = new std.PriorityQueue(point_compare);
    q.push(new Point(1, 2));
    q.push(new Point(2, 1));
    q.push(new Point(-3, 0));
    while(!q.empty()){
        let v = q.top();
        q.pop();

        log_message(v.toString());
    }
}

function main(): void{
    let world_grid = new StaticArray<StaticArray<PathFinderTile>>(5);
    for(let i = 0; i < world_grid.length; i++){
        let row = new StaticArray<PathFinderTile>(8);
        for(let j = 0; j < row.length; j++){
            if(i == 0 || i == world_grid.length - 1 || j == 0 || j == row.length - 1){
                row[j] = PathFinderTile.Blocked;
            }
            else{
                row[j] = PathFinderTile.Pathable;
            }
        }
        world_grid[i] = row;
    }
    world_grid[0][3] = PathFinderTile.Blocked;
    world_grid[1][3] = PathFinderTile.Blocked;
    world_grid[2][3] = PathFinderTile.Blocked;
    world_grid[2][5] = PathFinderTile.Blocked;
    world_grid[3][5] = PathFinderTile.Blocked;
    world_grid[4][5] = PathFinderTile.Blocked;
    const pf_opts = new PathFinderOptions();

    let pathfinder = new PathFinder(world_grid, pf_opts);
    log_message(pathfinder.toString());
    let path = pathfinder.find_path(new Point(1, 1), new Point(3, 6));
    log_message(path.toString());
}

main();
*/