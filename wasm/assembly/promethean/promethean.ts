import { LevelGenerator } from "./level_generator";
import { Level, LevelStatistics } from "./level";
import { Options, Tile, RoomType } from "./options";

export function create_generator(level_height: i32,
                                 level_width: i32,
                                 min_room_width: i32,
                                 max_room_width: i32,
                                 min_room_height: i32,
                                 max_room_height: i32,
                                 number_of_rooms: i32,
                                 border: i32,
                                 room_border: i32,
                                 overlap_rooms: bool,
                                 rooms_square: bool,
                                 rooms_rectangle: bool,
                                 rooms_cross: bool,
                                 rooms_diamond: bool,
                                 seed: u32 = 1): LevelGenerator{
    let options = new Options();
    options.level_width = level_width >= 2 ? level_width : 2;
    options.level_height = level_height >= 2 ? level_height : 2;
    options.min_room_width = min_room_width >= 1 ? min_room_width : 1;
    options.max_room_width = max_room_width >= 1 ? max_room_width : 1;
    options.min_room_height = min_room_height >= 1 ? min_room_height : 1;
    options.max_room_height = max_room_height >= 1 ? max_room_height : 1;
    options.number_of_rooms = number_of_rooms >= 1 ? number_of_rooms : 1;
    options.border = border >= 1 ? border : 1;
    options.room_border = room_border >= 1 ? room_border : 1;
    options.overlap_rooms = overlap_rooms;
    let types_count = 0;
    if(rooms_square){
        types_count++;
    }
    if(rooms_rectangle){
        types_count++;
    }
    if(rooms_cross){
        types_count++;
    }
    if(rooms_diamond){
        types_count++;
    }
    if(types_count == 0){
        types_count = 1;
        options.room_types = new StaticArray<RoomType>(1);
        options.room_types[0] = RoomType.Rectangle;
    }
    else{
        options.room_types = new StaticArray<RoomType>(types_count);
        let type_index = 0;
        if(rooms_square){
            options.room_types[type_index] = RoomType.Square;
            type_index++;
        }
        if(rooms_rectangle){
            options.room_types[type_index] = RoomType.Rectangle;
            type_index++;
        }
        if(rooms_cross){
            options.room_types[type_index] = RoomType.Cross;
            type_index++;
        }
        if(rooms_diamond){
            options.room_types[type_index] = RoomType.Diamond;
            type_index++;
        }
    }

    return new LevelGenerator(options, seed);
}

export function generate(generator: LevelGenerator): Level{
    return generator.generate();
}

export function level_size(level: Level, index: i32): i32{
    if(index == 0){
        return level.height();
    }
    else{
        return level.width();
    }
}

export function level_tiles(level: Level): StaticArray<Tile>{
    return level.render_plain();
}

export function level_statistics(level: Level): LevelStatistics{
    return level.statistics();
}

export function statistics_valid(statistics: LevelStatistics): bool{
    return statistics.init;
}

export function statistics_rooms_count(statistics: LevelStatistics): i32{
    return statistics.rooms_count;
}

export function statistics_corridors_count(statistics: LevelStatistics): i32{
    return statistics.corridors_count;
}

export function statistics_complete_corridors(statistics: LevelStatistics): bool{
    return statistics.all_corridors;
}

export function statistics_room_centers(statistics: LevelStatistics): StaticArray<i32>{
    let centers = statistics.room_centers;
    let to_return = new StaticArray<i32>(centers.length * 2);
    for(let i = 0, len = centers.length; i < len; i++){
        const p = centers[i];
        to_return[2*i] = p.x();
        to_return[2*i + 1] = p.y();
    }
    return to_return;
}