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
declare function create_player(entity: u32, pos_x: f32, pos_y: f32, radius: f32, team: i32): void;

@external("env", "host.update_entity_params")
declare function update_entity_params(entity: u32, is_dead: bool, life: u32, max_life: u32, shield: f32, max_shield: f32, select_radius: f32, atack_distance: f32, attack_time: f32): void;

@external("env", "host.remove_entity")
declare function remove_entity(entity: u32, actor_type: u32, remove_reason: u32): void;

@external("env", "host.create_monster")
declare function create_monster(entity: u32, pos_x: f32, pos_y: f32, angle: f32, radius: f32, search_radius: f32, search_spread: f32, team: i32): void;

@external("env", "host.create_bullet")
declare function create_bullet(entity: u32, pos_x: f32, pos_y: f32, target_x: f32, target_y: f32, angle: f32, bullet_type: u32): void;

@external("env", "host.define_person_changes")
declare function define_person_changes(entity: u32, pos_x: f32, pos_y: f32,
                                       angle: f32,
                                       move_status: u32,
                                       life: u32, max_life: u32,
                                       shield: f32, max_shield: f32,
                                       is_dead: bool): void;

@external("env", "host.define_bullet_changes")
declare function define_bullet_changes(entity: u32, pos_x: f32, pos_y: f32, angle: f32): void;

@external("env", "host.define_total_update_entities")
declare function define_total_update_entities(count: u32): void;

@external("env", "host.entity_start_shift")
declare function entity_start_shift(entity: u32): void;

@external("env", "host.entity_finish_shift")
declare function entity_finish_shift(entity: u32): void;

@external("env", "host.entity_activate_shield")
declare function entity_activate_shield(entity: u32): void;

@external("env", "host.entity_release_shield")
declare function entity_release_shield(entity: u32): void;

@external("env", "host.entity_start_melee_attack")
declare function entity_start_melee_attack(entity: u32, time: f32, damage_distance: f32, damage_spread: f32): void;

@external("env", "host.entity_finish_melee_attack")
declare function entity_finish_melee_attack(entity: u32, interrupt: bool): void;

@external("env", "host.entity_start_range_attack")
declare function entity_start_range_attack(entity: u32, time: f32): void;

@external("env", "host.entity_finish_range_attack")
declare function entity_finish_range_attack(entity: u32, interrupt: bool): void;

@external("env", "host.entity_start_hand_attack")
declare function entity_start_hand_attack(entity: u32, time: f32, damage_distance: f32): void;

@external("env", "host.entity_finish_hand_attack")
declare function entity_finish_hand_attack(entity: u32, interrupt: bool): void;

@external("env", "host.entity_start_shadow_attack")
declare function entity_start_shadow_attack(entity: u32, time: f32, damage_distance: f32): void;

@external("env", "host.entity_finish_shadow_attack")
declare function entity_finish_shadow_attack(entity: u32, interrupt: bool): void;

@external("env", "host.entity_finish_skill")
declare function entity_finish_skill(entity: u32, skill: u32, interrupt: bool): void;

@external("env", "host.entity_start_cooldawn")
declare function entity_start_cooldawn(entity: u32, cooldawn_id: u32, cooldawn_time: f32): void;

@external("env", "host.click_entity")
declare function click_entity(entity: u32, action: u32): void;

@external("env", "host.click_position")
declare function click_position(pos_x: f32, pos_y: f32): void;

@external("env", "host.entity_dead")
declare function entity_dead(entity: u32): void;

@external("env", "host.entity_damaged")
declare function entity_damaged(attacker_entity: u32, target_entity: u32, damage: u32, damage_type: u32): void;

@external("env", "host.entity_start_stun")
declare function entity_start_stun(entity: u32, duration: f32): void;

@external("env", "host.entity_finish_stun")
declare function entity_finish_stun(entity: u32): void;

@external("env", "host.entity_start_hide")
declare function entity_start_hide(entity: u32, activation_time: f32): void;

@external("env", "host.entity_finish_hide")
declare function entity_finish_hide(entity: u32, interrupt: bool): void;

@external("env", "host.entity_start_skill_round_attack")
declare function entity_start_skill_round_attack(entity: u32, cast_time: f32, area_size: f32): void;

@external("env", "host.entity_start_skill_stun_cone")
declare function entity_start_skill_stun_cone(entity: u32, cast_time: f32, cone_spread: f32, cone_size: f32): void;

@external("env", "host.entity_switch_hide")
declare function entity_switch_hide(entity: u32, hide_active: bool): void;

@external("env", "host.entity_resurrect")
declare function entity_resurrect(entity: u32, life: u32, max_life: u32): void;

@external("env", "host.debug_entity_walk_path")
declare function debug_entity_walk_path(entity: u32, points: StaticArray<f32>): void;

@external("env", "host.debug_close_entity")
declare function debug_close_entity(e1: u32, pos_x1: f32, pos_y1: f32, e2: u32, pos_x2: f32, pos_y2: f32): void;

@external("env", "host.debug_visible_quad")
declare function debug_visible_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void;

@external("env", "host.debug_neighbourhood_quad")
declare function debug_neighbourhood_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void;

@external("env", "host.debug_search_quad")
declare function debug_search_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void;

@external("env", "host.debug_mid_quad")
declare function debug_mid_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void;

@external("env", "host.debug_enemies_list")
declare function debug_enemies_list(entity: u32, search_radius: f32, enemies: StaticArray<u32>): void;


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

export function external_create_player(entity: u32, pos_x: f32, pos_y: f32, radius: f32, team: i32): void {
    if(use_external) {
        create_player(entity, pos_x, pos_y, radius, team);
    } else {
        console.log("ext -> create_player: id " + entity.toString() + " position (" + pos_x.toString() + ", " + pos_y.toString() + ") radius " + radius.toString() + " team " + team.toString());
    }
}

export function external_update_entity_params(entity: u32, 
                                              is_dead: bool,
                                              life: u32, max_life: u32, 
                                              shield: f32, max_shield: f32,
                                              select_radius: f32,
                                              atack_distance: f32, 
                                              atack_time: f32): void {
    if (use_external) {
        update_entity_params(entity, is_dead, life, max_life, shield, max_shield, select_radius, atack_distance, atack_time);
    } else {
        console.log("ext -> update_entity_params: entity " + entity.toString() + " is dead " + is_dead.toString() + " life " + life.toString() + "/" + max_life.toString() + " shield " + shield.toString() + "/" + max_shield.toString() + " select radius " + select_radius.toString() + " atack distance " + atack_distance.toString() + " attack time " + atack_time.toString());
    }
}

export function external_remove_entity(entity: u32, actor_type: u32, remove_reason: u32): void {
    if(use_external) {
        remove_entity(entity, actor_type, remove_reason);
    } else {
        console.log("ext -> remove_entity: " + entity.toString() + " actor " + actor_type.toString() + " reason " + remove_reason.toString());
    }
}

export function external_create_monster(entity: u32, pos_x: f32, pos_y: f32, angle: f32, radius: f32, search_radius: f32, search_spread: f32, team: i32): void {
    if(use_external) {
        create_monster(entity, pos_x, pos_y, angle, radius, search_radius, search_spread, team);
    } else {
        console.log("ext -> create_monster: id " + entity.toString() + 
                    " position (" + pos_x.toString() + ", " + pos_y.toString() + 
                    ") angle " + angle.toString() +
                    " radius " + radius.toString() + 
                    " search " + search_radius.toString() + ":" + search_spread.toString() + 
                    " team " + team.toString());
    }
}

export function external_create_bullet(entity: u32, pos_x: f32, pos_y: f32, target_x: f32, target_y: f32, angle: f32, bullet_type: u32): void {
    if (use_external) {
        create_bullet(entity, pos_x, pos_y, target_x, target_y, angle, bullet_type);
    } else {
        console.log("ecs -> create_bullet: id " + entity.toString() +
                    " position (" + pos_x.toString() + ", " + pos_y.toString() +
                    " target (" + target_x.toString() + ", " + target_y.toString() +
                    ") angle " + angle.toString() +
                    " type " + bullet_type.toString());
    }
}

export function external_define_person_changes(entity: u32, 
                                               pos_x: f32, pos_y: f32, 
                                               angle: f32, 
                                               move_status: u32,
                                               life: u32, max_life: u32,
                                               shield: f32, max_shield: f32,
                                               is_dead: bool): void {
    if(use_external) {
        define_person_changes(entity, pos_x, pos_y, angle, move_status, life, max_life, shield, max_shield, is_dead);
    } else {
        console.log("ext -> define_person_changes: id " + entity.toString() + 
            " position " + pos_x.toString() + " " + pos_y.toString() + 
            " angle " + angle.toString() + 
            " move " + move_status.toString() +
            " life " + life.toString() + "/" + max_life.toString() +
            " shield " + shield.toString() + "/" + max_shield.toString() +
            " is dead " + is_dead.toString());
    }
}

export function external_define_bullet_changes(entity: u32, pos_x: f32, pos_y: f32, angle: f32): void {
    if (use_external) {
        define_bullet_changes(entity, pos_x, pos_y, angle);
    } else {
        console.log("ext -> define_bullet_changes: id: " + entity.toString() + " (" + pos_x.toString() + ", " + pos_y.toString() + ") angle " + angle.toString());
    }
}

export function external_define_total_update_entities(count: u32): void {
    if(use_external) {
        define_total_update_entities(count);
    } else {
        console.log("ext -> define_total_update_entities: " + count.toString());
    }
}

export function external_entity_start_shift(entity: u32): void {
    if(use_external) {
        entity_start_shift(entity);
    } else {
        console.log("ext -> entity_start_shift: " + entity.toString());
    }
}

export function external_entity_finish_shift(entity: u32): void {
    if(use_external) {
        entity_finish_shift(entity);
    } else {
        console.log("ext -> entity_finish_shift: " + entity.toString());
    }
}

export function external_entity_activate_shield(entity: u32): void {
    if(use_external) {
        entity_activate_shield(entity);
    } else {
        console.log("ext -> entity_activate_shield: " + entity.toString());
    }
}

export function external_entity_release_shield(entity: u32): void {
    if(use_external) {
        entity_release_shield(entity);
    } else {
        console.log("ext -> entity_release_shield: " + entity.toString());
    }
}

export function external_entity_start_melee_attack(entity: u32, time: f32, damage_distance: f32, damage_spread: f32): void {
    if (use_external) {
        entity_start_melee_attack(entity, time, damage_distance, damage_spread);
    } else {
        console.log("ext -> entity_start_melee_attack: " + entity.toString() + " time " + time.toString() + " damage params " + damage_distance.toString() + " " + damage_spread.toString());
    }
}

export function external_entity_finish_melee_attack(entity: u32, interrupt: bool): void {
    if (use_external) {
        entity_finish_melee_attack(entity, interrupt);
    } else {
        console.log("ext -> entity_finish_melee_attack: " + entity.toString() + " interrupt " + interrupt.toString());
    }
}

export function external_entity_start_range_attack(entity: u32, time: f32): void {
    if (use_external) {
        entity_start_range_attack(entity, time);
    } else {
        console.log("ext -> entity_start_range_attack: " + entity.toString() + " time " + time.toString());
    }
}

export function external_entity_finish_range_attack(entity: u32, interrupt: bool): void {
    if (use_external) {
        entity_finish_range_attack(entity, interrupt);
    } else {
        console.log("ext -> entity_finish_range_attack: " + entity.toString() + " interrupt " + interrupt.toString());
    }
}

export function external_entity_start_hand_attack(entity: u32, time: f32, damage_distance: f32): void {
    if (use_external) {
        entity_start_hand_attack(entity, time, damage_distance);
    } else {
        console.log("ext -> entity_start_hand_attack: " + entity.toString() + " time " + time.toString() + " damage params " + damage_distance.toString());
    }
}

export function external_entity_finish_hand_attack(entity: u32, interrupt: bool): void {
    if (use_external) {
        entity_finish_hand_attack(entity, interrupt);
    } else {
        console.log("ext -> entity_finish_hand_attack: " + entity.toString() + " interrupt " + interrupt.toString());
    }
}

export function external_entity_start_shadow_attack(entity: u32, time: f32, damage_distance: f32): void {
    if (use_external) {
        entity_start_shadow_attack(entity, time, damage_distance);
    } else {
        console.log("ext -> entity_start_shadow_attack: " + entity.toString() + " time " + time.toString() + " distance " + damage_distance.toString());
    }
}

export function external_entity_finish_shadow_attack(entity: u32, interrupt: bool): void {
    if (use_external) {
        entity_finish_shadow_attack(entity, interrupt);
    } else {
        console.log("ext -> entity_finish_shadow_attack: " + entity.toString() + " interrupt " + interrupt.toString());
    }
}

export function external_entity_finish_skill(entity: u32, skill: u32, interrupt: bool): void {
    if (use_external) {
        entity_finish_skill(entity, skill, interrupt);
    } else {
        console.log("ext -> entity_finish_skill: " + entity.toString() + " skill " + skill.toString() + " interrupt " + interrupt.toString());
    }
}

export function external_entity_start_cooldawn(entity: u32, cooldawn_id: u32, cooldawn_time: f32): void {
    if(use_external) {
        entity_start_cooldawn(entity, cooldawn_id, cooldawn_time);
    } else {
        console.log("ext -> entity_start_cooldawn: " + entity.toString() + " " + cooldawn_id.toString() + " " + cooldawn_time.toString());
    }
}

export function external_click_entity(entity: u32, action: u32): void {
    if (use_external) {
        click_entity(entity, action);
    } else {
        console.log("ext -> click_entity: " + entity.toString() + " action " + action.toString());
    }
}

export function external_click_position(pos_x: f32, pos_y: f32): void {
    if (use_external) {
        click_position(pos_x, pos_y);
    } else {
        console.log("ext -> click_position: " + pos_x.toString() + " " + pos_y.toString());
    }
}

export function external_entity_dead(entity: u32): void {
    if (use_external) {
        entity_dead(entity);
    } else {
        console.log("ext -> entity_dead: " + entity.toString());
    }
}

export function external_entity_damaged(attacker_entity: u32, target_entity: u32, damage: u32, damage_type: u32): void {
    if (use_external) {
        entity_damaged(attacker_entity, target_entity, damage, damage_type);
    } else {
        console.log("ext -> entity_damaged: " + attacker_entity.toString() + " to " + target_entity.toString() + " apply " + damage.toString() + " of type " + damage_type.toString());
    }
}

export function external_entity_start_stun(entity: u32, duration: f32): void {
    if (use_external) {
        entity_start_stun(entity, duration);
    } else {
        console.log("ext -> entity_start_stun: " + entity.toString() + " duration " + duration.toString());
    }
}

export function external_entity_finish_stun(entity: u32): void {
    if (use_external) {
        entity_finish_stun(entity);
    } else {
        console.log("ext -> entity_finish_stun: " + entity.toString());
    }
}

export function external_entity_start_hide(entity: u32, activation_time: f32): void {
    if (use_external) {
        entity_start_hide(entity, activation_time);
    } else {
        console.log("ext -> entity_start_hide: " + entity.toString() + " activation " + activation_time.toString());
    }
}

export function external_entity_finish_hide(entity: u32, interrupt: bool): void {
    if (use_external) {
        entity_finish_hide(entity, interrupt);
    } else {
        console.log("ext -> entity_finish_hide: " + entity.toString() + " interrupt " + interrupt.toString());
    }
}

export function external_entity_start_skill_round_attack(entity: u32, cast_time: f32, area_size: f32): void {
    if (use_external) {
        entity_start_skill_round_attack(entity, cast_time, area_size);
    } else {
        console.log("ext -> entity_start_skill_round_attack: " + entity.toString() + " cast time " + cast_time.toString() + " area " + area_size.toString());
    }
}

export function external_entity_start_skill_stun_cone(entity: u32, cast_time: f32, cone_spread: f32, cone_size: f32): void {
    if (use_external) {
        entity_start_skill_stun_cone(entity, cast_time, cone_spread, cone_size);
    } else {
        console.log("ext -> entity_start_skill_stun_cone: " + entity.toString() + " cast time " + cast_time.toString() + " cone spread " + cone_spread.toString() + " size " + cone_size.toString());
    }
}

export function external_entity_switch_hide(entity: u32, hide_active: bool): void {
    if (use_external) {
        entity_switch_hide(entity, hide_active);
    } else {
        console.log("ext -> entity_switch_hide: " + entity.toString() + " " + hide_active.toString());
    }
}

export function external_entity_resurrect(entity: u32, life: u32, max_life: u32): void {
    if (use_external) {
        entity_resurrect(entity, life, max_life);
    } else {
        console.log("ext -> entity_resurrect: " + entity.toString() + " life " + life.toString() + "/" + max_life.toString());
    }
}

export function external_debug_entity_walk_path(entity: u32, points: StaticArray<f32>): void {
    if(use_external) {
        debug_entity_walk_path(entity, points);
    } else {
        console.log("ext -> debug_entity_walk_path: " + entity.toString() + " > " + points.toString());
    }
}

export function external_debug_close_entity(e1: u32, pos_x1: f32, pos_y1: f32, e2: u32, pos_x2: f32, pos_y2: f32): void {
    if(use_external) {
        debug_close_entity(e1, pos_x1, pos_y1, e2, pos_x2, pos_y2);
    } else {
        console.log("ext -> debug_close_entity: " + e1.toString() + " at (" + pos_x1.toString() + ", " + pos_y1.toString() + ")" + " - " + e2.toString() + " at (" + pos_x2.toString() + ", " + pos_y2.toString() + ")");
    }
}

export function external_debug_visible_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void {
    if(use_external) {
        debug_visible_quad(start_x, start_y, end_x, end_y);
    } else {
        console.log("ext -> debug_visible_quad: " + "(" + start_x.toString() + ", " + start_y.toString() + ") - (" + end_x.toString() + ", " + end_y.toString() + ")");
    }
}

export function external_debug_neighborhood_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void {
    if(use_external) {
        debug_neighbourhood_quad(start_x, start_y, end_x, end_y);
    } else {
        console.log("ext -> debug_neighbourhood_quad: " + "(" + start_x.toString() + ", " + start_y.toString() + ") - (" + end_x.toString() + ", " + end_y.toString() + ")");
    }
}

export function external_debug_search_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void {
    if(use_external) {
        debug_search_quad(start_x, start_y, end_x, end_y);
    } else {
        console.log("ext -> debug_search_quad: " + "(" + start_x.toString() + ", " + start_y.toString() + ") - (" + end_x.toString() + ", " + end_y.toString() + ")");
    }
}

export function external_debug_mid_quad(start_x: f32, start_y: f32, end_x: f32, end_y: f32): void {
    if(use_external) {
        debug_mid_quad(start_x, start_y, end_x, end_y);
    } else {
        console.log("ext -> debug_mid_quad: " + "(" + start_x.toString() + ", " + start_y.toString() + ") - (" + end_x.toString() + ", " + end_y.toString() + ")");
    }
}

export function external_debug_enemies_list(entity: u32, search_radius: f32, enemies_list: StaticArray<u32>): void {
    if (use_external) {
        debug_enemies_list(entity, search_radius, enemies_list);
    } else {
        console.log("ext -> debug_enemies_list: " + entity.toString() + " search " + search_radius.toString() + " find " + enemies_list.toString());
    }
}
