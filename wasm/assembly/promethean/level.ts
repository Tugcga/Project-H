import { Tile, TileMask, TilePoint } from "./options";
import { Point } from "./point";
import { GridPattern, grid_patterns } from "./grid_pattern";

export class LevelStatistics{
    init: bool = false;
    rooms_count: i32 = 0;
    corridors_count: i32 = 0;
    all_corridors: bool = false;
    room_centers: StaticArray<Point> = new StaticArray<Point>(0);
    room_sizes: StaticArray<Point> = new StaticArray<Point>(0);  // in fact radiuses of rooms
    walkable_tiles: i32 = 0;

    toString(): string{
        return "{init: " + this.init.toString() + 
               ", rooms count:" + this.rooms_count.toString() + 
               ", corridors count: " + this.corridors_count.toString() + 
               ", all corridors: " + this.all_corridors.toString() + 
               ", room centers: " + this.room_centers.toString() + 
               ", room sizes: " + this.room_sizes.toString() + 
               "}";
    }
}

export class Level{
    private m_height: i32;
    private m_width: i32;
    private m_level: StaticArray<StaticArray<Tile>>;
    private m_statistics: LevelStatistics;

    constructor(height: i32, width: i32){
        this.m_height = height;
        this.m_width = width;
        const local_level = new StaticArray<StaticArray<Tile>>(height)
        this.m_level = local_level;
        for(let x = 0; x < height; x++){
            let level_x = new StaticArray<Tile>(width);
            for(let y = 0; y < width; y++){
                unchecked(level_x[y] = Tile.Empty);
            }
            unchecked(local_level[x] = level_x);
        }
        this.m_statistics = new LevelStatistics();
    }

    set_statistics(rooms_count: i32, corridors_count: i32, all_corridors: bool, room_centers: StaticArray<Point>, room_sizes: StaticArray<Point>, walkable_tiles: i32): void{
        this.m_statistics.init = true;
        this.m_statistics.rooms_count = rooms_count;
        this.m_statistics.corridors_count = corridors_count;
        this.m_statistics.all_corridors = all_corridors;
        this.m_statistics.room_centers = room_centers;
        this.m_statistics.room_sizes = room_sizes;
        this.m_statistics.walkable_tiles = walkable_tiles;
    }

    @inline
    statistics(): LevelStatistics{
        return this.m_statistics;
    }

    @inline
    height(): i32{
        return this.m_height;
    }

    @inline
    width(): i32{
        return this.m_width;
    }

    @inline
    set_tile(x: i32, y: i32, tile: Tile): void{
        unchecked(this.m_level[x][y] = tile);
    }

    @inline
    get_from_point(point: Point): Tile{
        return unchecked(this.m_level[point.x()][point.y()]);
    }

    @inline
    get_from_coordinates(x: i32, y: i32): Tile{
        return unchecked(this.m_level[x][y]);
    }

    @inline
    set_from_point(point: Point, value: Tile): void{
        this.set_tile(point.x(), point.y(), value);
    }

    @inline
    render(): StaticArray<StaticArray<Tile>>{
        return this.m_level;
    }

    render_plain(): StaticArray<Tile>{
        let to_return = new StaticArray<Tile>(this.m_height * this.m_width);
        for(let x = 0; x < this.m_height; x++){
            for(let y = 0; y < this.m_width; y++){
                unchecked(to_return[x * this.m_width + y] = this.m_level[x][y]);
            }
        }
        return to_return;
    }

    inflate(inflation_factor: i32): void{
        let inflated_matrix = new StaticArray<StaticArray<Tile>>(inflation_factor * this.m_height);
        for(let x = 0, x_len = inflation_factor * this.m_height; x < x_len; x++){
            let arr_x = new StaticArray<Tile>(inflation_factor * this.m_width);
            for(let y = 0, y_len = inflation_factor * this.m_width; y < y_len; y++){
                unchecked(arr_x[y] = Tile.Empty);
            }
            unchecked(inflated_matrix[x] = arr_x);
        }

        for(let row = 0, row_len = this.m_height; row < row_len; row++){
            for(let column = 0, col_len = this.m_width; column < col_len; column++){
                for(let xr = 0; xr < inflation_factor; xr++){
                    for(let yr = 0; yr < inflation_factor; yr++){
                        unchecked(inflated_matrix[row * inflation_factor + xr][column * inflation_factor + yr] = this.m_level[row][column]);
                    }
                }
            }
        }
        this.m_level = inflated_matrix;
        this.m_width = inflation_factor * this.m_width;
        this.m_height = inflation_factor * this.m_height;
    }

    toString(): string{
        let to_return = "";
        for(let x = 0; x < this.m_height; x++){
            let row = "";
            for(let y = 0; y < this.m_width; y++){
                row += this.m_level[x][y].toString() + " ";
            }
            row += "\n";
            to_return += row;
        }
        return to_return;
    }
}

function surrounding_area_matches_pattern(level: Level, position: Point, pattern: StaticArray<StaticArray<TileMask>>): bool{
    const start: Point = new Point(position.x() - 1, position.y() - 1);
    for(let x = 0, x_len = pattern.length; x < x_len; x++){
        for(let y = 0, y_len = pattern[x].length; y < y_len; y++){
            const pattern_value: TileMask = pattern[x][y];
            if(pattern_value == TileMask.Wild){
                continue;
            }

            const mask_value: Tile = pattern_value == TileMask.Open ? Tile.Empty : Tile.Floor;

            const target_value: Tile = level.get_from_coordinates(start.x() + x, start.y() + y);
            if(target_value == mask_value){
                continue;
            }

            if(target_value == Tile.Empty && mask_value != Tile.Empty){
                return false;
            }

            if(target_value != Tile.Empty && mask_value == Tile.Empty){
                return false;
            }
        }
    }
    return true;
}

export function tile_level(level: Level, grid_patterns: StaticArray<GridPattern>): void {
    let tile_points: StaticArray<TilePoint> = new StaticArray<TilePoint>(level.height() * level.width());
    let tile_point_index: i32 = 0;
    for(let x = 1, x_len = level.height() - 1; x < x_len; x++){
        for(let y = 1, y_len = level.width() - 1; y < y_len; y++){
            if(level.get_from_coordinates(x, y) != Tile.Floor){
                continue;
            }

            for(let p = 0, p_len = grid_patterns.length; p < p_len; p++){
                const tile = grid_patterns[p];
                if(surrounding_area_matches_pattern(level, new Point(x, y), tile.m_pattern)){
                    for(let o = 0, o_len = tile.m_paint_offsets.length; o < o_len; o++){
                        const paint_point = tile.m_paint_offsets[o];
                        unchecked(tile_points[tile_point_index] = new TilePoint(new Point(paint_point.position().x() + x, paint_point.position().y() + y), paint_point.tile_type()));
                        tile_point_index++;
                    }
                }
            }
        }
    }

    for(let p = 0; p < tile_point_index; p++){
        const tile_point = tile_points[p];
        level.set_tile(tile_point.position().x(), tile_point.position().y(), tile_point.tile_type());
    }   
}
