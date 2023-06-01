import { Point } from "./point";
import { Room, RoomGenerator } from "./room_generator";
import { PseudoRandom } from "./pseudo_random";
import { PathFinderTile, PathFinderOptions, RoomType, Options } from "./options";
import { PathFinder } from "./path_finder";

export class Corridor{
    m_tiles: StaticArray<Point> = new StaticArray<Point>(0);

    @inline
    constructor(points: StaticArray<Point>){
        this.m_tiles = points;
    }

    @inline
    get_tiles(): StaticArray<Point>{
        return this.m_tiles;
    }

    toString(): string{
        return "|" + this.m_tiles.toString() + "|";
    }
}

function calculate_distance_between_2_points(origin: Point, point: Point): f64{
    const xa_minux_xb_squared: i32 = (point.x() - origin.x()) * (point.x() - origin.x());
    const ya_minus_yb_squared: i32 = (point.y() - origin.y()) * (point.y() - origin.y());

    return Math.sqrt(xa_minux_xb_squared + ya_minus_yb_squared);
}

function room_distance_from_origin_comparer(room1: Room, room2: Room): i32{
    let reference = new Point(0, 0);
    const room1_distance_from_reference = calculate_distance_between_2_points(reference, room1.center());
    const room2_distance_from_reference = calculate_distance_between_2_points(reference, room2.center());
    if(room1_distance_from_reference < room2_distance_from_reference){
        return -1;
    }
    else if(room1_distance_from_reference > room2_distance_from_reference){
        return 1;
    }
    else{
        return 0;
    }
}

function generate_pathing_grid(rooms: StaticArray<Room>, options: Options): StaticArray<StaticArray<PathFinderTile>>{
    let pathable_level: StaticArray<StaticArray<PathFinderTile>> = new StaticArray<StaticArray<PathFinderTile>>(options.level_height);
    for(let x = 0, x_len = options.level_height; x < x_len; x++){
        let x_array = new StaticArray<PathFinderTile>(options.level_width);
        for(let y = 0, y_len = options.level_width; y < y_len; y++){
            if(x < options.border || x >= options.level_height - options.border || y < options.border || y >= options.level_width - options.border){
                x_array[y] = PathFinderTile.Blocked;
            }
            else{
                x_array[y] = PathFinderTile.Pathable;
            }
        }
        pathable_level[x] = x_array;
    }

    let x: i32 = 0;
    let y: i32 = 0;

    for(let r_index = 0, r_len = rooms.length; r_index < r_len; r_index++){
        let room: Room = rooms[r_index];
        for(let x_offset = -options.room_border, x_limit = room.height() + options.room_border; x_offset < x_limit; x_offset++){
            for(let y_offset = -options.room_border, y_limit = room.width() + options.room_border; y_offset < y_limit; y_offset++){
                x = room.position().x() + x_offset;
                y = room.position().y() + y_offset;

                if(x < options.border || x >= options.level_height - options.border){
                    continue;
                }
                if(y < options.border || y >= options.level_width - options.border){
                    continue;
                }
                 const room_center = room.center();
                if(x == room_center.x() || y == room_center.y()){
                    pathable_level[x][y] = PathFinderTile.Pathable;
                    continue;
                }

                pathable_level[x][y] = PathFinderTile.Blocked;
            }
        }
    }

    return pathable_level;
}

export function generate_corridors(rooms: StaticArray<Room>, options: Options): StaticArray<Corridor>{
    if(rooms.length <= 1){
        return new StaticArray<Corridor>(0);
    }

    const pathable_level: StaticArray<StaticArray<PathFinderTile>> = generate_pathing_grid(rooms, options);

    let pathfinder: PathFinder = new PathFinder(pathable_level, new PathFinderOptions());
    rooms.sort(room_distance_from_origin_comparer);

    let temp_corridors = new StaticArray<Corridor>(rooms.length - 1);
    let corridors_count = 0;
    for(let index = 0, index_limit = rooms.length - 1; index < index_limit; index++){
        let current_room: Room = rooms[index];
        let next_room: Room = rooms[index + 1];

        let path: StaticArray<Point> = pathfinder.find_path(current_room.center(), next_room.center());

        const corridor_length: i32 = path.length;
        if(corridor_length == 0){
            continue;
        }

        let corridor = new Corridor(path);
        for(let i = 1; i < corridor_length - 1; i++){
            const p = path[i];
            let prev_p: Point = path[i - 1];
            let next_p: Point = path[i + 1];
            const x: i32 = p.x();
            const y: i32 = p.y();
            const prev_x: i32 = prev_p.x();
            const prev_y: i32 = prev_p.y();
            const next_x: i32 = next_p.x();
            const next_y: i32 = next_p.y();
            if(prev_x == x && x != next_x){
                if(prev_y < y){
                    if(x < next_x){
                        pathfinder.block_point(new Point(x, y + 1));
                    }
                    else{
                        pathfinder.block_point(new Point(x + 1, y + 1));
                    }
                }
                else{
                    if(x < next_x){
                        pathfinder.block_point(new Point(x - 1, y - 1));
                    }
                    else{
                        pathfinder.block_point(new Point(x - 1, y + 1));
                    }
                }
            }
            else if(prev_y == y && y != next_y){
                if(prev_x < x){
                    if(y < next_y){
                        pathfinder.block_point(new Point(x + 1, y - 1));
                    }
                    else{
                        pathfinder.block_point(new Point(x + 1, y + 1));
                    }
                }
                else{
                    if(y < next_y){
                        pathfinder.block_point(new Point(x - 1, y - 1));
                    }
                    else{
                        pathfinder.block_point(new Point(x, y + 1));
                    }
                }
            }
        }

        temp_corridors[corridors_count] = corridor;
        corridors_count++;
    }

    if(corridors_count == temp_corridors.length){
        return temp_corridors;
    }
    else{
        let corridors = new StaticArray<Corridor>(corridors_count);
        for(let i = 0; i < corridors_count; i++){
            corridors[i] = temp_corridors[i];
        }
        return corridors;
    }
}
