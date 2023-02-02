import { Tile, RoomType, Options } from "./options";
import { PseudoRandom } from "./pseudo_random";
import { RoomGenerator, Room } from "./room_generator";
import { Corridor, generate_corridors } from "./corridor_generator";
import { tile_level, Level, LevelStatistics } from "./level";
import { DefaultRenderer, CrossRenderer, DiamondRenderer, IRoomRenderer } from "./room_renderer";
import { GridPattern, grid_patterns } from "./grid_pattern";
import { Point } from "./point";

export class LevelGenerator{
    private m_options: Options;
    private m_room_generator: RoomGenerator;

    private m_renderer_default: DefaultRenderer;
    private m_renderer_diamond: DiamondRenderer;
    private m_renderer_cross: CrossRenderer;

    constructor(options: Options, seed: u32 = 1){
        this.m_options = options;

        const local_random = new PseudoRandom(seed);
        const local_room = new RoomGenerator(local_random);

        this.m_room_generator = local_room;

        this.m_renderer_default = new DefaultRenderer();
        this.m_renderer_diamond = new DiamondRenderer();
        this.m_renderer_cross = new CrossRenderer()
    }

    generate(): Level{
        let level: Level = new Level(this.m_options.level_height, this.m_options.level_width);
        let rooms: StaticArray<Room> = this.m_room_generator.generate_rooms(this.m_options);
        let corridors: StaticArray<Corridor> = generate_corridors(rooms, this.m_options);

        this._render_rooms_on_level(level, rooms);
        this._render_corridors_on_level(level, corridors);

        level.inflate(2);
        tile_level(level, grid_patterns);

        let room_centers = new StaticArray<Point>(rooms.length);
        let room_sizes = new StaticArray<Point>(rooms.length);
        for(let i = 0, len = rooms.length; i < len; i++){
            const r = unchecked(rooms[i]);
            unchecked(room_centers[i] = new Point(r.center().x() * 2 + 1, r.center().y() * 2 + 1));
            unchecked(room_sizes[i] = new Point(r.width(), r.height()));
        }

        // calculate the number of walkable tiles
        var walkable_tiles = 0;
        for(let i = 0, i_len = level.height(); i < i_len; i++) {
            for(let j = 0, j_len = level.width(); j < j_len; j++) {
                const t = level.get_from_coordinates(i, j);
                if(t == Tile.Floor) {
                    walkable_tiles += 1;
                }
            }
        }

        level.set_statistics(rooms.length, corridors.length, corridors.length == rooms.length - 1, room_centers, room_sizes, walkable_tiles);

        return level;
    }

    private _get_renderer(room_type: RoomType): IRoomRenderer{
        if(room_type == RoomType.Diamond){
            return this.m_renderer_diamond;
        }
        else if(room_type == RoomType.Cross){
            return this.m_renderer_cross;
        }
        else{
            return this.m_renderer_default;
        }
    }

    private _render_rooms_on_level(level: Level, rooms: StaticArray<Room>): void{
        for(let i = 0, len = rooms.length; i < len; i++){
            const room = unchecked(rooms[i]);
            const renderer: IRoomRenderer = this._get_renderer(room.room_type());
            const tiles: StaticArray<StaticArray<Tile>> = renderer.get_tiles(room);
            for(let x_offset = 0, x_len = room.height(); x_offset < x_len; x_offset++){
                for(let y_offset = 0, y_len = room.width(); y_offset < y_len; y_offset++){
                    const x: i32 = room.position().x() + x_offset;
                    const y: i32 = room.position().y() + y_offset;
                    level.set_tile(x, y, unchecked(tiles[x_offset][y_offset]));
                }
            }
        }
    }

    private _render_corridors_on_level(level: Level, corridors: StaticArray<Corridor>): void{
        for(let i = 0, len = corridors.length; i < len; i++){
            let corridor = unchecked(corridors[i]);
            let points: StaticArray<Point> = corridor.get_tiles();
            for(let pi = 0, pi_len = points.length; pi < pi_len; pi++){
                let point: Point = unchecked(points[pi]);
                level.set_from_point(point, Tile.Floor);
            }
        }
    }
}
