import { Room } from "./room_generator";
import { Tile, RoomType } from "./options";


export abstract class IRoomRenderer{
    abstract get_tiles(room: Room): StaticArray<StaticArray<Tile>>;
}

export class DefaultRenderer extends IRoomRenderer{
    get_tiles(room: Room): StaticArray<StaticArray<Tile>>{
        let arr = new StaticArray<StaticArray<Tile>>(room.height());
        for(let i = 0, len = room.height(); i < len; i++){
            let arr_j = new StaticArray<Tile>(room.width());
            for(let j = 0, len_j = room.width(); j < len_j; j++){
                unchecked(arr_j[j] = Tile.Floor);
            }
            unchecked(arr[i] = arr_j);
        }
        return arr;
    }
}

export class DiamondRenderer extends IRoomRenderer{
    get_tiles(room: Room): StaticArray<StaticArray<Tile>>{
        let offset: i32 = 0;
        const y_middle = room.width() / 2;
        
        let arr = new StaticArray<StaticArray<Tile>>(room.height());

        for(let x = 0, len = room.height(); x < len; x++){
            let arr_x = new StaticArray<Tile>(room.width());
            for(let y = 0, len_y = room.width(); y < len_y; y++){
                if(y < y_middle - offset || y >= y_middle + offset + 1){
                    unchecked(arr_x[y] = Tile.Empty);
                }
                else{
                    unchecked(arr_x[y] = Tile.Floor);
                }
            }
            offset = x < room.height() / 2 ? offset + 1 : offset - 1;
            unchecked(arr[x] = arr_x);
        }
        return arr;
    }
}

export class CrossRenderer extends IRoomRenderer{
    get_tiles(room: Room): StaticArray<StaticArray<Tile>>{
        let arr = new StaticArray<StaticArray<Tile>>(room.height());

        for(let x = 0, len_x = room.height(); x < len_x; x++){
            let arr_x = new StaticArray<Tile>(room.width());
            for(let y = 0, len_y = room.width(); y < len_y; y++){
                unchecked(arr_x[y] = Tile.Empty);
                const height_float = <f64>room.height();
                const width_float = <f64>room.width();
                const x_lower_bound: f64 = height_float * 0.333 - 1.0;
                const x_upper_bound: f64 = height_float * 0.666;

                const y_lower_bound: f64 = width_float * 0.333 - 1.0;
                const y_upper_bound: f64 = width_float * 0.666;
                if((x > x_lower_bound && x < x_upper_bound) || (y > y_lower_bound && y < y_upper_bound)){
                    unchecked(arr_x[y] = Tile.Floor);
                }
            }
            unchecked(arr[x] = arr_x);
        }
        return arr;
    }
}
