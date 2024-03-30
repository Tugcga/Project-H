import { PseudoRandom } from "./promethean/pseudo_random";
import { ECS } from "./simple_ecs/simple_ecs";
import { Entity } from "./simple_ecs/types";
import { Navmesh } from "./pathfinder/navmesh/navmesh";
import { Level } from "./promethean/level";

import { generate_level, generate_navmesh } from "./game/generate";
import { Settings, ConstantsSettings } from "./game/settings";
import { EPSILON, ACTOR, TARGET_ACTION, STATE, DAMAGE_TYPE, INVENTORY_ITEM_TYPE, WEAPON_TYPE } from "./game/constants";
import { distance } from "./game/utilities";

import { external_define_level,
         external_define_navmesh,
         external_define_total_tiles,
         external_create_player,
         external_click_entity,
         external_click_position,
         external_define_entity_changes } from "./external";

import { setup_components, 
         setup_systems, 
         setup_player, 
         setup_monster,
         setup_weapon_sword,
         setup_weapon_bow } from "./game/ecs_setup";

import { PositionComponent } from "./game/components/position";
import { RadiusSelectComponent } from "./game/components/radius";
import { SpeedComponent } from "./game/components/speed";
import { ActorTypeComponent } from "./game/components/actor_type";
import { LifeComponent } from "./game/components/life";
import { ApplyDamageComponent } from "./game/components/apply_damage";
import { StateComponent } from "./game/components/state"
import { TeamComponent } from "./game/components/team";
import { ShieldComponent } from "./game/components/shield";
import { AtackDistanceComponent } from "./game/components/atack_distance";
import { AtackTimeComponent } from "./game/components/atack_time";
import { AngleComponent } from "./game/components/angle";
import { RadiusComponent } from "./game/components/radius";

import { InventarComponent } from "./game/components/inventar/inventar";
import { EquipmentComponent } from "./game/components/inventar/equipment";
import { InventarItemTypeComponent,
         InventarWeaponTypeComponent } from "./game/components/inventar/type";

import { UpdateToClientSystem } from "./game/systems/update_to_client";
import { UpdateDebugSystem } from "./game/systems/update_debug";
import { NeighborhoodQuadGridTrackingSystem } from "./game/systems/neighborhood_quad_grid_tracking";
import { RVOSystem } from "./game/systems/rvo";

import { VirtualWeapon,
         VirtualWeaponEmpty,
         VirtualWeaponSword,
         VirtualWeaponBow } from "./game/virtuals";

import { command_activate_shield, 
         command_init_attack, 
         command_move_to_point, 
         command_release_shield, 
         command_shift, 
         command_stun, 
         command_resurrect,
         command_toggle_hide_mode,
         command_equip_main_weapon,
         command_free_equip_weapon } from "./game/commands";
import { update_entity_parameters } from "./game/rpg";
import { output_update_entity_params } from "./game/states";

export class Game {
    private ecs: ECS | null = null;
    private navmesh: Navmesh | null = null;
    private level: Level | null = null;
    private random: PseudoRandom | null = null;
    private player_entity: Entity;
    private settings: Settings;

    private seed: u32 = 0;

    constructor(in_settings: Settings) {
        let local_seed = in_settings.get_seed();
        let local_level = generate_level(local_seed, in_settings.get_generate());

        // output to the host level data
        external_define_level(local_level.width(), local_level.height(), in_settings.get_constants().tile_size);
        external_define_total_tiles(local_level.statistics().walkable_tiles);

        let local_random = new PseudoRandom(local_seed, 2);

        // level contains tiles in array of arrays
        // the first array = the first row
        // the second array - second and so on
        // we should translte it to spatial position, by using tile size and center of the level
        // for simplicity assume that the first tile at (0, 0) and all tiles placed at right and top

        // toString print level from top to bottom and from left to right
        // in level x - index of the row, y - index of the column
        // but we should place columns (second index) at x-direction
        // rows (first index) at y-direction
        // and draw tiles from left to right and bottom to top

        // bake navmesh
        let local_navmesh = generate_navmesh(local_level, in_settings);
        // output to the host navigation mesh
        external_define_navmesh(local_navmesh.vertices(), local_navmesh.polygons(), local_navmesh.sizes());

        // get room index
        const level_stat = local_level.statistics();
        const rooms_count = level_stat.rooms_count;
        const start_room = 0;
        const start_point = level_stat.room_centers[start_room];

        const local_constants: ConstantsSettings = in_settings.get_constants();
        const local_engine = in_settings.get_engine();
        const local_defaults = in_settings.get_defaults();
        const default_player = local_defaults.default_player_parameters;
        const default_weapons = in_settings.get_default_weapons();

        const debug_settings = in_settings.get_debug();
        const engine_settings = in_settings.get_engine();

        const tile_size = local_constants.tile_size;
        const start_x: f32 = tile_size * <f32>start_point.y();  // in the level tile x - index of the row, y - index of the column, so, we should swap it
        const start_y: f32 = tile_size * <f32>start_point.x();

        // start player rotation angle
        const start_angle = <f32>local_random.next_float(0.0, 2* Math.PI);

        // init ecs
        let local_ecs = new ECS();

        // register components
        setup_components(local_ecs);

        // register systems
        setup_systems(local_ecs,
            local_navmesh,
            local_random,
            local_level.width(),
            local_level.height(),
            tile_size,
            local_defaults,
            local_constants,
            debug_settings,
            engine_settings);

        // setup player entity
        const player_entity = setup_player(local_ecs, local_level, 
                                           start_x, start_y, start_angle, <f32>local_level.width() * tile_size, 
                                           local_defaults, local_constants, local_engine);

        const update_system = local_ecs.get_system<UpdateToClientSystem>();
        update_system.init(player_entity);
        if (debug_settings.use_debug) {
            const debug_system = local_ecs.get_system<UpdateDebugSystem>();
            debug_system.init(player_entity);
        }

        update_entity_parameters(local_ecs, player_entity, default_weapons);
        
        // output player position and radius
        const position = local_ecs.get_component<PositionComponent>(player_entity);
        const radius = local_ecs.get_component<RadiusComponent>(player_entity);
        const team = local_ecs.get_component<TeamComponent>(player_entity);
        if (position && radius && team) {
            external_create_player(player_entity, position.x(), position.y(), radius.value(), team.team());
        }

        // send to the client actual player parameters
        output_update_entity_params(local_ecs, player_entity);
        // and also other parameters
        const life: LifeComponent | null = local_ecs.get_component<LifeComponent>(player_entity);
        const shield = local_ecs.get_component<ShieldComponent>(player_entity);
        const angle = local_ecs.get_component<AngleComponent>(player_entity);

        if (life && shield && position && angle) {
            external_define_entity_changes(player_entity, position.x(), position.y(), angle.value(), false, life.life(), life.max_life(), shield.shield(), shield.max_shield(), false);
        }

        // store in the class all local instances
        this.level = local_level;
        this.seed = local_seed;
        this.random = local_random;
        this.navmesh = local_navmesh;
        this.ecs = local_ecs;
        this.player_entity = player_entity;
        this.settings = in_settings;

        // emit mosnter at each room
        for (let i = 0; i < rooms_count; i++) {
            const room_center = level_stat.room_centers[i];
            const room_radius = level_stat.room_sizes[i]

            if (start_point.x() != room_center.x() && start_point.y() != room_center.y()) {
                this.add_monsters_at_room(room_center.x(), room_center.y(), room_radius.x(), room_radius.y())
            }
        }
    }

    update(dt: f32): void {
        let local_ecs = this.ecs;
        if(local_ecs) {
            if (dt > EPSILON) {
                local_ecs.update(dt);
            }
        }
    }

    // for development only
    _set_player_position(in_x: f32, in_y: f32): void {
        const local_ecs = this.ecs;
        if (local_ecs) {
            const player_entity = this.player_entity;
            const position: PositionComponent | null = local_ecs.get_component<PositionComponent>(player_entity);
            if (position) {
                position.set(in_x, in_y);
            }
        }
    }

    _zero_speed(): void {
        const local_ecs = this.ecs;
        if (local_ecs) {
            const player_entity = this.player_entity;
            const speed: SpeedComponent | null = local_ecs.get_component<SpeedComponent>(player_entity);
            if (speed) {
                speed.set_value(0.0);
            }
        }
    }

    client_point(in_x: f32, in_y: f32): void {
        let local_ecs = this.ecs;
        let local_navmesh = this.navmesh;
        if (local_ecs && local_navmesh) {
            // get player entity
            const player_entity = this.player_entity;

            // we should properly assign the action when the player click at some position
            // if there is an monster near the click point, then start to atack it
            // if there is another iteractible item (actor) - go to them and interact
            // if nothing in the point, then try to go to this point
            const neighborhood_tracking_system = local_ecs.get_system<NeighborhoodQuadGridTrackingSystem>();
            const neight_entities = neighborhood_tracking_system.get_items_from_position(in_x, in_y);
            let assign_target = false;
            for (let i = 0, len = neight_entities.length; i < len; i++) {
                const e = neight_entities[i];
                const e_actor_type: ActorTypeComponent | null = local_ecs.get_component<ActorTypeComponent>(e);
                if (e_actor_type && !assign_target) {
                    if (e_actor_type.type() == ACTOR.MONSTER) {
                        // if the close entity is a monster
                        // check is we click inside the select radius
                        const pos: PositionComponent | null = local_ecs.get_component<PositionComponent>(e);
                        const sel_radius: RadiusSelectComponent | null = local_ecs.get_component<RadiusSelectComponent>(e);
                        const st: StateComponent | null = local_ecs.get_component<StateComponent>(e);
                        if (pos && sel_radius && st) {
                            if (st.state() != STATE.DEAD) {
                                // calculate the distance between click point and actor position
                                const pos_x = pos.x();
                                const pos_y = pos.y();
                                const d = distance(pos_x, pos_y, in_x, in_y);
                                if (d < sel_radius.value()) {
                                    // find the first actor near the click point
                                    // try to start the action
                                    assign_target = command_init_attack(local_ecs, local_navmesh, player_entity, e);
                                    if (assign_target) {
                                        external_click_entity(e, TARGET_ACTION.ATTACK);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (!assign_target) {
                // find valid point
                const sample = local_navmesh.sample(in_x, 0.0, in_y);
                if (sample.length == 4 && sample[3] > 0.5) {
                    const pos_x = sample[0];
                    const pos_y = sample[2];
                    const is_point = command_move_to_point(local_ecs, local_navmesh, player_entity, pos_x, pos_y);
                    if (is_point) {
                        external_click_position(in_x, in_y);
                    }
                }
            }
        }
    }

    // use cursor x/y for direction of the shift
    player_shift(cursor_x: f32, cursor_y: f32): void {
        const local_ecs = this.ecs;
        const local_navmesh = this.navmesh;
        if (local_ecs && local_navmesh) {
            const player_entity = this.player_entity;

            command_shift(local_ecs, local_navmesh, player_entity, cursor_x, cursor_y);
        }
    }

    player_shield(): void {
        const local_ecs = this.ecs;
        const player_entity = this.player_entity;
        if (local_ecs) {
            command_activate_shield(local_ecs, player_entity);
        }
    }

    player_release_shield(): void {
        const local_ecs = this.ecs;
        const player_entity = this.player_entity;
        if (local_ecs) {
            command_release_shield(local_ecs, player_entity);
        }
    }

    player_toggle_hide(): void {
        const local_ecs = this.ecs;
        const player_entity = this.player_entity;
        if (local_ecs) {
            command_toggle_hide_mode(local_ecs, player_entity);
        }
    }

    emit_one_monster(radius: f32, position_x: f32, position_y: f32, look_angle: f32, move_speed: f32,
                     life: u32, virtual_weapon: VirtualWeapon, search_radius: f32, search_spread: f32, team: i32): Entity {
        const local_ecs = this.ecs;
        const local_level = this.level;
        const local_settings = this.settings;
        const local_constants = local_settings.get_constants();
        const local_defaults = local_settings.get_defaults();
        const lolca_engine = local_settings.get_engine();
        if (local_ecs && local_level && local_constants) {
            const tile_size = local_constants.tile_size;

            const monster_entity = setup_monster(local_ecs, <f32>local_level.width() * tile_size,
                                                 position_x, position_y, look_angle, move_speed, radius, life,
                                                 team, search_radius, search_spread,
                                                 virtual_weapon, local_defaults, local_constants, lolca_engine);
            // we should not call any external methods
            // because created monster entity can be outside of the player visibility
            return monster_entity;
        }

        return 0;
    }

    emit_one_monster_default(pos_x: f32, pos_y: f32, angle: f32): void {
        const local_ecs = this.ecs;
        const local_level = this.level;
        if (local_ecs && local_level) {
            const local_settings = this.settings;
            const local_defaults = local_settings.get_defaults();
            const def = local_defaults.default_monster_parameters;
            // create virtual weapon for this monster
            const wdef = local_defaults.default_monster_weapon;
            const weapon = new VirtualWeaponEmpty(wdef.attack_distance, wdef.attack_time, wdef.attack_cooldawn, wdef.shield, wdef.damage,
                                                  wdef.damage_distance);

            this.emit_one_monster(def.radius, pos_x, pos_y, angle, def.speed,
                                  def.life, weapon, def.search_radius, def.search_spread, def.team);
        }
    }

    private add_monsters_at_room(center_x: u32, center_y: u32, radius_x: u32, radius_y: u32): void {
        const local_random = this.random;
        const local_settings = this.settings;
        const local_constants = local_settings.get_constants();
        const tile_size = local_constants.tile_size;
        const local_navmesh = this.navmesh;

        const monsters_per_room = local_constants.monsters_per_room;

        if (local_random && local_navmesh) {
            const emit_count = local_random.next(monsters_per_room[0], monsters_per_room[1]);

            for (let j = 0; j < emit_count; j++) {
                // select random position
                var pos_x = <f32>local_random.next_float(<f32>(center_y - radius_y) * tile_size, <f32>(center_y + radius_y) * tile_size);
                var pos_y = <f32>local_random.next_float(<f32>(center_x - radius_x) * tile_size, <f32>(center_x + radius_x) * tile_size);
                const sample = local_navmesh.sample(pos_x, 0.0, pos_y);
                if (sample.length == 4 && sample[3] > 0.5) {
                    pos_x = sample[0];
                    pos_y = sample[2];

                    // and angle
                    const angle = <f32>local_random.next_float(0.0, 2.0 * Math.PI);

                    this.emit_one_monster_default(pos_x, pos_y, angle);
                }
            }
        }
    }

    add_monsters(): void {
        let local_level = this.level;
        let local_random = this.random;
        if (local_level && local_random) {
            const level_stat = local_level.statistics();
            // get random room
            const r_index = local_random.next(0, level_stat.rooms_count - 1);
            
            // get center of the room
            const r_center = level_stat.room_centers[r_index];
            // and radius
            const r_radius = level_stat.room_sizes[r_index];

            this.add_monsters_at_room(r_center.x(), r_center.y(), r_radius.x(), r_radius.y());
        }
    }

    // for tests only
    // make all monsters atack the player
    make_aggressive(): void {
        const local_ecs = this.ecs;
        const local_navmesh = this.navmesh;
        if (local_ecs && local_navmesh) {
            const rvo_entities: Array<Entity> = local_ecs.get_entities<RVOSystem>();
            const player_entity = this.player_entity;

            const player_position: PositionComponent | null = local_ecs.get_component<PositionComponent>(player_entity);
            const player_team = local_ecs.get_component<TeamComponent>(player_entity);
            if (player_position && player_team) {
                const player_team_value = player_team.team();
                for (let i = 0, len = rvo_entities.length; i < len; i++) {
                    const entity: Entity = rvo_entities[i];

                    const actor_type: ActorTypeComponent | null = local_ecs.get_component<ActorTypeComponent>(entity);

                    if (actor_type) {
                        if (actor_type.type() == ACTOR.MONSTER && entity != player_entity) {
                            command_init_attack(local_ecs, local_navmesh, entity, player_entity);
                        }
                    }
                }
            }
        }
    }

    //for test only
    damage_all_entities(damage: u32): void {
        const local_ecs = this.ecs;

        if (local_ecs) {
            const rvo_entities: Array<Entity> = local_ecs.get_entities<RVOSystem>();
            for (let i = 0, len = rvo_entities.length; i < len; i++) {
                const entity: Entity = rvo_entities[i];
                const entity_damage: ApplyDamageComponent | null = local_ecs.get_component<ApplyDamageComponent>(entity);
                if (entity_damage) {
                    entity_damage.extend(0, damage, DAMAGE_TYPE.UNKNOWN, 0.0);  // attacker, damage value, type and duration
                } else {
                    local_ecs.add_component<ApplyDamageComponent>(entity, new ApplyDamageComponent(0, damage, DAMAGE_TYPE.UNKNOWN, 0.0));
                }
            }
        }
    }

    stun_all_entities(duration: f32): void {
        const local_ecs = this.ecs;

        if (local_ecs) {
            const rvo_entities: Array<Entity> = local_ecs.get_entities<RVOSystem>();
            for (let i = 0, len = rvo_entities.length; i < len; i++) {
                const entity: Entity = rvo_entities[i];
                command_stun(local_ecs, entity, duration);
            }
        }
    }

    dev_emit_one_monster(radius: f32, position_x: f32, position_y: f32, move_speed: f32,
                         life: u32, virtual_weapon: VirtualWeapon, search_radius: f32, search_spread: f32, team: i32, friend_for_player: bool): void {
        // find valid position
        const local_navmesh = this.navmesh;
        const local_random = this.random;
        if (local_navmesh && local_random) {
            const sample = local_navmesh.sample(position_x, 0.0, position_y);
            if (sample.length == 4 && sample[3] > 0.5) {
                const pos_x = sample[0];
                const pos_y = sample[2];

                const look_angle = <f32>local_random.next_float(0.0, 2.0 * Math.PI);

                const monster_entity = this.emit_one_monster(radius, pos_x, pos_y, look_angle, move_speed,
                                                             life, virtual_weapon, search_radius, search_spread, team);
                const local_ecs = this.ecs;
                const local_settings = this.settings;
                const local_defaults = local_settings.get_defaults();
                const local_default_player = local_defaults.default_player_parameters;

                if (local_ecs && monster_entity != 0) {
                    const monster_team: TeamComponent | null = local_ecs.get_component<TeamComponent>(monster_entity);
                    if (monster_team) {
                        if (friend_for_player) {
                            monster_team.extend(local_default_player.default_team);
                        }
                    }
                }
            }
        }
    }

    dev_move_entity(entity: Entity, target_pos_x: f32, target_pos_y: f32): void {
        const local_navmesh = this.navmesh;
        const local_ecs = this.ecs;
        if (local_navmesh && local_ecs) {
            const sample = local_navmesh.sample(target_pos_x, 0.0, target_pos_y);
            if (sample.length == 4 && sample[3] > 0.5) {
                const pos_x = sample[0];
                const pos_y = sample[2];

                const position = local_ecs.get_component<PositionComponent>(entity);
                if (position) {
                    position.set(pos_x, pos_y);
                }
            }
        }
    }

    dev_resurrect_player(): void {
        const local_ecs = this.ecs;
        const player_entity = this.player_entity;
        if (local_ecs) {
            command_resurrect(local_ecs, player_entity);
        }
    }

    // test method
    // create sword item and add it to the player inventar
    dev_create_sword(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, damage: u32, shield: f32,
                     damage_spread: f32, damage_distance: f32): void {
        const local_ecs = this.ecs;

        if (local_ecs) {
            const sword_entity = setup_weapon_sword(local_ecs,
                                                    attack_distance, attack_time, attack_cooldawn, damage, shield,
                                                    damage_spread, damage_distance);
            // add this sword to the inventar of the player
            const player_entity = this.player_entity;
            const player_inventar = local_ecs.get_component<InventarComponent>(player_entity);
            if (player_inventar) {
                player_inventar.add_item(sword_entity);
            }
        }
    }

    dev_create_bow(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, damage: u32, shield: f32): void {
        const local_ecs = this.ecs;

        if (local_ecs) {
            const bow_entity = setup_weapon_bow(local_ecs,
                                                attack_distance, attack_time, attack_cooldawn, damage, shield);
            const player_entity = this.player_entity;
            const player_inventar = local_ecs.get_component<InventarComponent>(player_entity);
            if (player_inventar) {
                player_inventar.add_item(bow_entity);
            }
        }
    }

    private _equip_weapon(weapon_type: WEAPON_TYPE): void {
        const local_ecs = this.ecs;
        const player_entity= this.player_entity;
        if (local_ecs) {
            const player_inventar = local_ecs.get_component<InventarComponent>(player_entity);

            if (player_inventar) {
                const items = player_inventar.all_items();
                for (let i = 0, len = items.length; i < len; i++) {
                    const item_entity: Entity = items[i];
                    const item_type = local_ecs.get_component<InventarItemTypeComponent>(item_entity);
                    if (item_type) {
                        const item_type_value = item_type.type();
                        if (item_type_value == INVENTORY_ITEM_TYPE.WEAPON) {
                            // this item is a weapon
                            const item_weapon_type = local_ecs.get_component<InventarWeaponTypeComponent>(item_entity);
                            if (item_weapon_type) {
                                const item_weapon_type_value = item_weapon_type.type();
                                if (item_weapon_type_value == weapon_type) {
                                    command_equip_main_weapon(local_ecs, player_entity, item_entity, this.settings.get_default_weapons());
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            output_update_entity_params(local_ecs, player_entity);
        }
    }

    // test method
    // find the first sword weapon item in the player inventar
    // and equip it
    dev_equip_sword(): void {
        this._equip_weapon(WEAPON_TYPE.SWORD);
    }

    dev_equip_bow(): void {
        this._equip_weapon(WEAPON_TYPE.BOW);
    }

    // remove weapond from equip and add it to the inventar
    // only for the player
    dev_equip_free_hands(): void {
        const local_ecs = this.ecs;
        const player_entity = this.player_entity;
        const settings = this.settings;
        if (local_ecs) {
            command_free_equip_weapon(local_ecs, player_entity, settings.get_default_weapons());

            output_update_entity_params(local_ecs, player_entity);
        }
    }

    dev_create_virtual_sword(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32,
                             damage_distance: f32, damage_spread: f32): VirtualWeaponSword {
        return new VirtualWeaponSword(attack_distance, attack_time, attack_cooldawn, shield, damage, damage_distance, damage_spread);
    }

    dev_create_virtual_bow(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32): VirtualWeaponBow {
        return new VirtualWeaponBow(attack_distance, attack_time, attack_cooldawn, shield, damage);
    }

    dev_create_virtual_empty_weapon(attack_distance: f32, attack_time: f32, attack_cooldawn: f32, shield: f32, damage: u32,
                                    damage_distance: f32): VirtualWeaponEmpty {
        return new VirtualWeaponEmpty(attack_distance, attack_time, attack_cooldawn, shield, damage, damage_distance);
    }

    toString(): string {
        return `Game<${this.seed}>`;
    }
}