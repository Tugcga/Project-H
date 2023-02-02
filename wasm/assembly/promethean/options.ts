import { Point } from "./point"

export const enum RoomType{
    Square = 0,
    Rectangle = 1,
    Cross = 2,
    Diamond = 3,
}

export const enum PathFinderTile{
    Pathable = 1,
    Blocked = 0,
}

export const enum Tile{
    Empty = 1,
    Floor = 0,
    TopLeftInsideCorner = 2,
    TopRightInsideCorner = 3,
    BottomLeftInsideCorner = 4,
    BottomRightInsideCorner = 5,
    TopWall = 6,
    RightWall = 7,
    BottomWall = 8,
    LeftWall = 9,
    TopLeftOutsideCorner = 10,
    TopRightOutsideCorner = 11,
    BottomLeftOutsideCorner = 12,
    BottomRightOutsideCorner = 13,
}

export const enum TileMask{
    Wild = -1,
    Open = 1,
    Block = 0,
}

export class TilePoint{
    private m_position: Point = new Point();
    private m_tile_type: Tile = Tile.Empty;

    constructor(position: Point, tile_type: Tile){
        this.m_position = position;
        this.m_tile_type = tile_type;
    }

    position(): Point{
        return this.m_position;
    }

    tile_type(): Tile{
        return this.m_tile_type;
    }
}

export class PathFinderOptions{
    search_limit: i32 = 2000;
}

export class Options{
    level_width: i32 = 64;
    level_height: i32 = 64;
    min_room_width: i32 = 5;
    max_room_width: i32 = 7;
    min_room_height: i32 = 5;
    max_room_height: i32 = 7;
    number_of_rooms: i32 = 45;
    random_seed: i32 = 1;
    border: i32 = 1;
    room_border: i32 = 1;
    overlap_rooms: bool = false;
    room_types: StaticArray<RoomType> = [RoomType.Square, RoomType.Rectangle, RoomType.Cross, RoomType.Diamond];
}
