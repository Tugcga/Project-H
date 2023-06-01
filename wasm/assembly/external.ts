const use_external = true;

@external("env", "host.define_level")
declare function define_level(level_width: u32, level_height: u32, tile_size: f32): void;

@external("env", "host.define_navmesh")
declare function define_navmesh(vertices: StaticArray<f32>, polygons: StaticArray<i32>, sizes: StaticArray<i32>): void;

@external("env", "host.define_total_tiles")
declare function define_total_tiles(total_tiles: u32): void;

@external("env", "host.tile_delete")
declare function tile_delete(index: u32): void;

@external("env", "host.tile_create")
declare function tile_create(x: u32, y: u32, index: u32, type: u32): void;

@external("env", "host.create_player")
declare function create_player(radius: f32): void;

@external("env", "host.define_player_changes")
declare function define_player_changes(pos_x: f32, pos_y: f32, angle: f32, is_move: bool): void;

@external("env", "host.remove_monster")
declare function remove_monster(entity: u32): void;

@external("env", "host.create_monster")
declare function create_monster(entity: u32, radius: f32): void;

@external("env", "host.define_monster_changes")
declare function define_monster_changes(entity: u32, pos_x: f32, pos_y: f32, angle: f32, is_move: bool): void;

@external("env", "host.define_total_update_entities")
declare function define_total_update_entities(count: u32): void;

@external("env", "host.debug_entity_walk_path")
declare function debug_entity_walk_path(entity: u32, points: StaticArray<f32>): void;

@external("env", "host.debug_close_entity")
declare function debug_close_entity(e1: u32, pos_x1: f32, pos_y1: f32, e2: u32, pos_x2: f32, pos_y2: f32): void;


export function external_define_level(level_width: u32, level_height: u32, tile_size: f32): void {
    if(use_external) {
        define_level(level_width, level_height, tile_size);
    } else {
        console.log("ext -> level_width: " + level_width.toString() + ", level_height: " + level_height.toString() + ", tile_size: " + tile_size.toString());
    }
}

export function external_define_navmesh(vertices: StaticArray<f32>, polygons: StaticArray<i32>, sizes: StaticArray<i32>): void {
    if(use_external) {
        define_navmesh(vertices, polygons, sizes);
    } else {
        console.log("ext -> vertices: " + vertices.toString() + ", polygons: " + polygons.toString() + ", sizes: " + sizes.toString());
    }
}

export function external_define_total_tiles(total_tiles: u32): void {
    if(use_external) {
        define_total_tiles(total_tiles);
    } else {
        console.log("ext -> total_tiles: " + total_tiles.toString());
    }
}

export function external_tile_delete(index: u32): void {
    if(use_external) {
        tile_delete(index);
    } else {
        console.log("ext -> tile_delete: " + index.toString());
    }
}

export function external_tile_create(x: u32, y: u32, index: u32, type: u32): void {
    if(use_external) {
        tile_create(x, y, index, type);
    } else {
        // console.log("ext -> tile_create: " + x.toString() + ", " + y.toString() + ", " + index.toString() + ", " + type.toString());
    }
}

export function external_create_player(radius: f32): void {
    if(use_external) {
        create_player(radius);
    } else {
        console.log("ext -> create_player: " + radius.toString());
    }
}

export function external_define_player_changes(pos_x: f32, pos_y: f32, angle: f32, is_move: bool): void {
    if(use_external) {
        define_player_changes(pos_x, pos_y, angle, is_move);
    } else {
        console.log("ext -> define_player_changes: " + pos_x.toString() + " " + pos_y.toString() + " " + angle.toString() + " " + is_move.toString());
    }
}

export function external_remove_monster(entity: u32): void {
    if(use_external) {
        remove_monster(entity);
    } else {
        console.log("ext -> remove_monster: " + entity.toString());
    }
}

export function external_create_monster(entity: u32, radius: f32): void {
    if(use_external) {
        create_monster(entity, radius);
    } else {
        console.log("ext -> create_monster: " + entity.toString() + " " + radius.toString());
    }
}

export function external_define_monster_changes(entity: u32, pos_x: f32, pos_y: f32, angle: f32, is_move: bool): void {
    if(use_external) {
        define_monster_changes(entity, pos_x, pos_y, angle, is_move);
    } else {
        console.log("ext -> define_monster_changes: " + entity.toString() + " " + pos_x.toString() + " " + pos_y.toString() + " " + angle.toString() + " " + is_move.toString());
    }
}

export function external_define_total_update_entities(count: u32): void {
    if(use_external) {
        define_total_update_entities(count);
    } else {
        console.log("ext -> define_total_update_entities: " + count.toString());
    }
}

export function external_debug_entity_walk_path(entity: u32, points: StaticArray<f32>): void {
    if(use_external) {
        debug_entity_walk_path(entity, points);
    } else {
        console.log("ext -> debug_entity_walk_path: " + entity.toString() + "> " + points.toString());
    }
}

export function external_debug_close_entity(e1: u32, pos_x1: f32, pos_y1: f32, e2: u32, pos_x2: f32, pos_y2: f32): void {
    if(use_external) {
        debug_close_entity(e1, pos_x1, pos_y1, e2, pos_x2, pos_y2);
    } else {
        console.log("ext -> debug_close_entity: " + e1.toString() + " at (" + pos_x1.toString() + ", " + pos_y1.toString() + ")" + " - " + e2.toString() + " at (" + pos_x2.toString() + ", " + pos_y2.toString() + ")");
    }
}