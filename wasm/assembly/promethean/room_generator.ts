import { PseudoRandom } from "./pseudo_random";
import { RoomType, Tile, Options } from "./options";
import { Point } from "./point";

function determine_max_position(level_dimension: i32, room_dimension: i32, border: i32): i32{
    return level_dimension - room_dimension - border;
}

export class Room{
    private m_height: i32;
    private m_width: i32;
    private m_position: Point;
    private m_room_center: Point;
    private m_bottom_left: Point;
    private m_top_right: Point;
    private m_bottom_right: Point;
    private m_room_type: RoomType;

    constructor(room_height: i32, room_width: i32, room_x: i32, room_y: i32, room_type: RoomType=RoomType.Rectangle){
        this.m_height = room_height;
        this.m_width = room_width;
        const local_position = new Point(room_x, room_y)
        this.m_position = local_position;
        this.m_room_center = new Point(local_position.x() + room_height / 2, local_position.y() + room_width / 2);
        this.m_bottom_left = new Point(local_position.x() + room_height - 1, local_position.y());
        this.m_top_right = new Point(local_position.x(), local_position.y() + room_width - 1);
        this.m_bottom_right = new Point(local_position.x() + room_height - 1, local_position.y() + room_width - 1);
        this.m_room_type = room_type;
    }

    @inline
    room_type(): RoomType{
        return this.m_room_type;
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
    position(): Point{
        return this.m_position;
    }

    @inline
    bottom_right(): Point{
        return this.m_bottom_right;
    }

    @inline
    center(): Point{
        return this.m_room_center;
    }

    intersects(other: Room, buffer: i32): bool{
        if(this.m_bottom_right.y() + buffer < other.position().y() - buffer || other.bottom_right().y() + buffer < this.m_position.y() - buffer){
            return false;
        }

        if(this.m_bottom_right.x() + buffer < other.position().x() - buffer || other.bottom_right().x() + buffer < this.m_position.x() - buffer){
            return false;
        }

        return true;
    }

    toString():string{
        return "Room" + this.m_position.toString() + ":" + this.m_width.toString() + ":" + this.m_height.toString() + ":t" + this.m_room_type.toString();
    }
}

export class RoomGenerator{
    private m_random: PseudoRandom;

    constructor(in_random: PseudoRandom){
        this.m_random = in_random;
    }

    generate_rooms(options: Options): StaticArray<Room>{
        if(options.overlap_rooms){
            return this._generate_overlapping_rooms(options);
        }
        else{
            return this._generate_non_overlapping_rooms(options);
        }
    }

    private _generate_overlapping_rooms(options: Options): StaticArray<Room>{
        let rooms: StaticArray<Room> = new StaticArray<Room>(options.number_of_rooms);
        let room_index = 0;
        for(let room_count = 0, len = options.number_of_rooms; room_count < len; room_count++){
            let new_room: Room | null = this._generate(options);
            if(new_room){
                unchecked(rooms[room_index] = new_room);
                room_index++;
            }
        }

        if(room_index == rooms.length){
            return rooms;
        }
        else{
            let other_rooms: StaticArray<Room> = new StaticArray<Room>(room_index);
            for(let i = 0; i < room_index; i++){
                unchecked(other_rooms[i] = rooms[i]);
            }
            return other_rooms;
        }
    }

    private _generate_non_overlapping_rooms(options: Options): StaticArray<Room>{
        let rooms: StaticArray<Room> = new StaticArray<Room>(options.number_of_rooms);
        let room_index = 0;
        for(let room_count = 0, len = options.number_of_rooms; room_count < len; room_count++){
            let new_room: Room | null = this._generate(options);
            if(new_room)
            {
                if(this._is_intersections(rooms, room_index, new_room, options)){
                    let repositioned_room: Room | null = this._reposition(rooms, room_index, new_room, options);
                    if(repositioned_room){
                        unchecked(rooms[room_index] = repositioned_room);
                        room_index++;
                    }
                    else{
                        break;
                    }
                }
                else{
                    unchecked(rooms[room_index] = new_room);
                    room_index++;
                }
            }
        }

        if(room_index == rooms.length){
            return rooms;
        }
        else{
            let other_rooms: StaticArray<Room> = new StaticArray<Room>(room_index);
            for(let i = 0; i < room_index; i++){
                unchecked(other_rooms[i] = rooms[i]);
            }
            return other_rooms;
        }
    }

    private _reposition(rooms: StaticArray<Room>, rooms_count: i32, room: Room, options: Options): Room | null{
        const min_x: i32 = options.border;
        const min_y: i32 = options.border;
        const max_x: i32 = determine_max_position(options.level_height, room.height(), options.border);
        const max_y: i32 = determine_max_position(options.level_width, room.width(), options.border);

        let lower_bound = new Point(min_x, min_y);
        let upper_bound = new Point(max_x, max_y);

        let offset: i32  = 0;
        let is_finish: bool = false;
        let is_find: bool = false;
        let is_switch_direction: bool = false;
        let top_left: Point = new Point();
        let top_right: Point = new Point();
        let bottom_right: Point = new Point();
        let bottom_left: Point = new Point();
        let direction: i32 = -1;
        let direction_iterator: i32 = top_left.y();
        let position: Point | null = null;

        while(!is_finish){
            position = null;
            is_switch_direction = false;
            if(direction == -1){
                is_switch_direction = true;
                is_find = false;
            }
            else if(direction == 0){
                is_find = false;
                if(top_left.x() >= lower_bound.x()){
                    while(direction_iterator <= top_right.y() && direction_iterator <= upper_bound.y()){
                        if(direction_iterator < lower_bound.y()){
                            direction_iterator += 1;
                        }
                        else{
                            position = new Point(top_left.x(), direction_iterator);
                            direction_iterator += 1;
                            is_find = true;
                            break;
                        }
                    }
                    if(!is_find){
                        is_switch_direction = true;
                    }
                }
                else{
                    is_switch_direction = true;
                }
            }
            else if(direction == 1){
                is_find = false;
                if(top_right.y() <= upper_bound.y()){
                    while(direction_iterator < bottom_right.x() && direction_iterator <= upper_bound.x()){
                        if(direction_iterator < lower_bound.x()){
                            direction_iterator += 1;
                        }
                        else{
                            position = new Point(direction_iterator, top_right.y());
                            direction_iterator += 1;
                            is_find = true;
                            break;
                        }
                    }
                    if(!is_find){
                        is_switch_direction = true;
                    }
                }
                else{
                    is_switch_direction = true;
                }
            }
            else if(direction == 2){
                is_find = false;
                if(bottom_right.x() <= upper_bound.x()){
                    while(direction_iterator >= bottom_left.y() && direction_iterator >= lower_bound.y()){
                        if(direction_iterator > upper_bound.y()){
                            direction_iterator -= 1;
                        }
                        else{
                            position = new Point(bottom_right.x(), direction_iterator);
                            direction_iterator -= 1;
                            is_find = true;
                            break;
                        }
                    }
                    if(!is_find){
                        is_switch_direction = true;
                    }
                }
                else{
                    is_switch_direction = true;
                }
            }
            else if(direction == 3){
                is_find = false;
                if(bottom_left.y() >= lower_bound.y()){
                    while(direction_iterator > top_left.x() && direction_iterator >= lower_bound.x() + 1){
                        if(direction_iterator > upper_bound.x()){
                            direction_iterator -= 1;
                        }
                        else{
                            position = new Point(direction_iterator, bottom_left.y());
                            direction_iterator -= 1;
                            is_find = true;
                            break;
                        }
                    }
                    if(!is_find){
                        is_switch_direction = true;
                    }
                }
                else{
                    is_switch_direction = true;
                }
            }
            if(is_switch_direction){
                if(direction == 0){
                    direction = 1;
                    direction_iterator = top_right.x() + 1;
                }
                else if(direction == 1){
                    direction = 2;
                    direction_iterator = bottom_right.y();
                }
                else if(direction == 2){
                    direction = 3;
                    direction_iterator = bottom_left.x() - 1;
                }
                else{
                    offset += 1;
                    let rx = room.position().x();
                    let ry = room.position().y();
                    top_left = new Point(rx - offset, ry - offset);
                    top_right = new Point(rx - offset, ry + offset);
                    bottom_right = new Point(rx + offset, ry + offset);
                    bottom_left = new Point(rx + offset, ry - offset);

                    if(rx - offset < lower_bound.x() && rx + offset > upper_bound.x() && ry - offset < lower_bound.y() && ry + offset > upper_bound.y()){
                        break;
                    }
                    else{
                        direction = 0;
                        direction_iterator = top_left.y();
                    }
                }
            }
            else{
                if(position){
                    let new_room_candidate = new Room(room.height(), room.width(), position.x(), position.y(), room.room_type());
                    if(!this._is_intersections(rooms, rooms_count, new_room_candidate, options)){
                        return new_room_candidate;
                    }
                }
                else{
                    break;
                }
            }
        }
        return null;
    }

    private _is_intersections(rooms: StaticArray<Room>, rooms_count: i32, target: Room, options: Options):bool {
        for(let i = 0; i < rooms_count; i++){
            let r = unchecked(rooms[i]);
            if(target.intersects(r, options.room_border)){
                return true;
            }
        }
        return false;
    }

    private _generate(options: Options): Room | null{
        const room_type: RoomType = options.room_types[this.m_random.next(1, options.room_types.length) - 1];
        const room_width = this.m_random.next_odd(options.min_room_width, options.max_room_width);
        const room_height = room_type == RoomType.Rectangle ? this.m_random.next_odd(options.min_room_height, options.max_room_height) : room_width;
        const max_x = determine_max_position(options.level_height, room_height, options.border);
        const max_y = determine_max_position(options.level_width, room_width, options.border);
        if(max_x >= options.border && max_y >= options.border){
            const room_x = this.m_random.next(options.border, max_x);
            const room_y = this.m_random.next(options.border, max_y);
            let room = new Room(room_height, room_width, room_x, room_y, room_type);

            return room;
        }
        else{
            return null;
        }
    }
}