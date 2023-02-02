import { ECS } from "./simple_ecs/simple_ecs";
import { Entity } from "./simple_ecs/types";
import { Level } from "./promethean/level";
import { 
    TILE_SIZE, 
    PLAYER_RADIUS,
    PLAYER_SPEED, 
    PLAYER_ROTATION_SPEED, 
    MONSTER_SPEED, 
    MONSTER_ROTATION_SPEED,
    MONSTER_RADIUS,
    MONSTER_IDDLE_TIME, 
    TILES_VISIBLE_RADIUS,
    MONSTERS_PER_ROOM} from "./game/constants";
import { PseudoRandom } from "./promethean/pseudo_random";
import { Point } from "./promethean/point";
import { List } from "./pathfinder/common/list";
import { DATA } from "./game/data_constants";
import { 
    PlayerComponent,
    NeighborhoodTilesComponent,
    NeighborhoodRadiusComponent,
    TilePositionComponent,
    PositionComponent,
    NavmeshTaskComponent, 
    PathfinderTaskComponent,
    SpeedComponent,
    AngleComponent,
    TargetAngleComponent,
    RotationSpeedComponent,
    PreviousPositionComponent,
    MoveTagComponent,
    MonsterComponent,
    PathfinderIdComponent,
    RadiusComponent,
    QuadGridIndexComponent,
    QuadGridNeighborhoodComponent,
    StateComponent,
    StateIddleComponent,
    StateWalkComponent,
    PathfinderStatusComponent} from "./game/components";
import { 
    PathfinderMoveSystem,
    NavmeshMoveSystem, 
    PositionToTileSystem,
    MoveTrackingSystem,
    RotateSystem,
    QuadGridTrackingSystem,
    QuadGridNeighborhoodSystem,
    StateIddleSystem,
    StateWalkSystem} from "./game/systems";
import { Navmesh } from "./pathfinder/navmesh/navmesh";
import { 
    generate_level, 
    generate_pathfinder } from "./game/generate";

// global ecs instance
var ecs: ECS | null = null;

// global level navigation mesh
var navmesh: Navmesh | null = null;
var level: Level | null = null;

// global buffer for output to client
var output_buffer = new List<f32>();

var random = new PseudoRandom();

export function create_game(seed: u32): void {
    ecs = new ECS();
    let local_ecs = ecs;
    if(local_ecs) {
        // generate the dungeon
        level = generate_level(seed);
        random = new PseudoRandom(seed, 2);
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
        let local_level = level;

        if(local_level) {
            let pathfinder = generate_pathfinder(local_level);
            navmesh = pathfinder.get_navmesh();

            // get room index
            const rooms_count = local_level.statistics().rooms_count;
            const start_room = 0;
            const start_point: Point = local_level.statistics().room_centers[start_room];
            const start_x: f32 = TILE_SIZE * <f32>start_point.y();  // in the level tile x - index of the row, y - index of the column, so, we should swap it
            const start_y: f32 = TILE_SIZE * <f32>start_point.x();

            // start player rotation angle
            const start_angle = <f32>random.next_float(0.0, 2* Math.PI);

            // next create some components and systems
            // register components
            local_ecs.register_component<PlayerComponent>();
            local_ecs.register_component<MonsterComponent>();
            local_ecs.register_component<PositionComponent>();
            local_ecs.register_component<PreviousPositionComponent>();
            local_ecs.register_component<NeighborhoodRadiusComponent>();
            local_ecs.register_component<NeighborhoodTilesComponent>();
            local_ecs.register_component<TilePositionComponent>();
            local_ecs.register_component<PathfinderIdComponent>();
            local_ecs.register_component<PathfinderTaskComponent>();
            local_ecs.register_component<NavmeshTaskComponent>();
            local_ecs.register_component<SpeedComponent>();
            local_ecs.register_component<RotationSpeedComponent>();
            local_ecs.register_component<AngleComponent>();
            local_ecs.register_component<TargetAngleComponent>();
            local_ecs.register_component<MoveTagComponent>();
            local_ecs.register_component<RadiusComponent>();
            local_ecs.register_component<QuadGridIndexComponent>();
            local_ecs.register_component<QuadGridNeighborhoodComponent>();
            local_ecs.register_component<StateComponent>();  // states only for monsters
            local_ecs.register_component<StateIddleComponent>();
            local_ecs.register_component<StateWalkComponent>();
            local_ecs.register_component<PathfinderStatusComponent>();

            // register systems
            const pathfinder_system = local_ecs.register_system<PathfinderMoveSystem>(new PathfinderMoveSystem(pathfinder));
            local_ecs.set_system_with_component<PathfinderMoveSystem, PathfinderTaskComponent>();
            local_ecs.set_system_with_component<PathfinderMoveSystem, PathfinderIdComponent>();
            local_ecs.set_system_with_component<PathfinderMoveSystem, PositionComponent>();
            local_ecs.set_system_with_component<PathfinderMoveSystem, PathfinderStatusComponent>();

            // register navmesh system after pathfinder
            // pathfinder will be executed first, but then navmesh will calculate actual player position
            const navmesh_system = local_ecs.register_system<NavmeshMoveSystem>(new NavmeshMoveSystem(pathfinder_system));
            local_ecs.set_system_with_component<NavmeshMoveSystem, PlayerComponent>();  // only for player
            local_ecs.set_system_with_component<NavmeshMoveSystem, NavmeshTaskComponent>();
            local_ecs.set_system_with_component<NavmeshMoveSystem, PositionComponent>();
            local_ecs.set_system_with_component<NavmeshMoveSystem, SpeedComponent>();
            local_ecs.set_system_with_component<NavmeshMoveSystem, PathfinderIdComponent>();

            local_ecs.register_system<PositionToTileSystem>(new PositionToTileSystem(local_level.width(), local_level.height()));
            local_ecs.set_system_with_component<PositionToTileSystem, PlayerComponent>();  // only for player
            local_ecs.set_system_with_component<PositionToTileSystem, PositionComponent>();
            local_ecs.set_system_with_component<PositionToTileSystem, TilePositionComponent>();
            local_ecs.set_system_with_component<PositionToTileSystem, NeighborhoodRadiusComponent>();
            local_ecs.set_system_with_component<PositionToTileSystem, NeighborhoodTilesComponent>();

            local_ecs.register_system<MoveTrackingSystem>(new MoveTrackingSystem());
            local_ecs.set_system_with_component<MoveTrackingSystem, PreviousPositionComponent>();
            local_ecs.set_system_with_component<MoveTrackingSystem, PositionComponent>();
            local_ecs.set_system_with_component<MoveTrackingSystem, MoveTagComponent>();
            local_ecs.set_system_with_component<MoveTrackingSystem, TargetAngleComponent>();  // set target angle with respect to prv and current position

            local_ecs.register_system<RotateSystem>(new RotateSystem());
            local_ecs.set_system_with_component<RotateSystem, MoveTagComponent>();  // rotate only if item is moved
            local_ecs.set_system_with_component<RotateSystem, AngleComponent>();
            local_ecs.set_system_with_component<RotateSystem, TargetAngleComponent>();
            local_ecs.set_system_with_component<RotateSystem, RotationSpeedComponent>();

            const tracking_system = local_ecs.register_system<QuadGridTrackingSystem>(new QuadGridTrackingSystem(<f32>local_level.width() * TILE_SIZE, <f32>local_level.height() * TILE_SIZE));
            local_ecs.set_system_with_component<QuadGridTrackingSystem, PositionComponent>();
            local_ecs.set_system_with_component<QuadGridTrackingSystem, MonsterComponent>();  // does not tracking player
            local_ecs.set_system_with_component<QuadGridTrackingSystem, QuadGridIndexComponent>();

            // use tracking_system as dependency for this system
            local_ecs.register_system<QuadGridNeighborhoodSystem>(new QuadGridNeighborhoodSystem(tracking_system));
            local_ecs.set_system_with_component<QuadGridNeighborhoodSystem, PlayerComponent>();  // only for player
            local_ecs.set_system_with_component<QuadGridNeighborhoodSystem, PositionComponent>();
            local_ecs.set_system_with_component<QuadGridNeighborhoodSystem, QuadGridNeighborhoodComponent>();

            local_ecs.register_system<StateIddleSystem>(new StateIddleSystem());
            local_ecs.set_system_with_component<StateIddleSystem, StateComponent>();
            local_ecs.set_system_with_component<StateIddleSystem, StateIddleComponent>();

            local_ecs.register_system<StateWalkSystem>(new StateWalkSystem(pathfinder_system));  // set pathfinder system as dependency, because we need it for reading positions
            local_ecs.set_system_with_component<StateWalkSystem, StateComponent>();
            local_ecs.set_system_with_component<StateWalkSystem, StateWalkComponent>();
            local_ecs.set_system_with_component<StateWalkSystem, PositionComponent>();
            local_ecs.set_system_with_component<StateWalkSystem, PathfinderIdComponent>();

            // setup player entity
            const player_entity = local_ecs.create_entity();
            local_ecs.add_component<PlayerComponent>(player_entity, new PlayerComponent());
            local_ecs.add_component<PositionComponent>(player_entity, new PositionComponent(start_x, start_y));
            local_ecs.add_component<PreviousPositionComponent>(player_entity, new PreviousPositionComponent(start_x, start_y));  // set the same position
            local_ecs.add_component<SpeedComponent>(player_entity, new SpeedComponent(PLAYER_SPEED));
            local_ecs.add_component<RadiusComponent>(player_entity, new RadiusComponent(PLAYER_RADIUS));
            local_ecs.add_component<RotationSpeedComponent>(player_entity, new RotationSpeedComponent(PLAYER_ROTATION_SPEED));
            local_ecs.add_component<AngleComponent>(player_entity, new AngleComponent(start_angle));
            local_ecs.add_component<TargetAngleComponent>(player_entity, new TargetAngleComponent(start_angle));  // set the same target angle at the start
            local_ecs.add_component<NeighborhoodTilesComponent>(player_entity, new NeighborhoodTilesComponent(local_level));
            local_ecs.add_component<NeighborhoodRadiusComponent>(player_entity, new NeighborhoodRadiusComponent(TILES_VISIBLE_RADIUS));
            local_ecs.add_component<TilePositionComponent>(player_entity, new TilePositionComponent());
            local_ecs.add_component<NavmeshTaskComponent>(player_entity, new NavmeshTaskComponent());
            local_ecs.add_component<MoveTagComponent>(player_entity, new MoveTagComponent());
            local_ecs.add_component<PathfinderIdComponent>(player_entity, new PathfinderIdComponent());
            local_ecs.add_component<QuadGridNeighborhoodComponent>(player_entity, new QuadGridNeighborhoodComponent());
            navmesh_system.add_agent(player_entity, start_x, start_y);

            // next generate monsters in each room
            let local_navmesh = navmesh;
            if(local_navmesh) {
                const level_stat = local_level.statistics();
                for(let i = 0; i < rooms_count; i++) {
                    const room_center: Point = level_stat.room_centers[i];
                    const room_radius = level_stat.room_sizes[i]

                    const emit_count = random.next(MONSTERS_PER_ROOM[0], MONSTERS_PER_ROOM[1]);
                    for(let j = 0; j < emit_count; j++) {
                        emit_one_monster(local_level, local_navmesh, local_ecs, room_center, room_radius);
                    }
                }
            }
        }
    }
}

function emit_one_monster(local_level: Level, local_navmesh: Navmesh, local_ecs: ECS,
    center: Point, radius: Point): void {
    // emit random world position
    var pos_x = <f32>random.next_float(<f32>(center.y() - radius.y()) * TILE_SIZE, <f32>(center.y() + radius.y()) * TILE_SIZE);
    var pos_y = <f32>random.next_float(<f32>(center.x() - radius.x()) * TILE_SIZE, <f32>(center.x() + radius.x()) * TILE_SIZE);

    // check is this position is valid in navmesh
    const sample = local_navmesh.sample(pos_x, 0.0, pos_y);
    if(sample.length == 4 && sample[3] > 0.5) {
        // the sample is valid
        pos_x = sample[0];
        pos_y = sample[2];

        // generate random angle
        const angle = <f32>random.next_float(0.0, 2.0 * Math.PI);
        
        // create an entity
        const monster_entity = local_ecs.create_entity();
        local_ecs.add_component<MonsterComponent>(monster_entity, new MonsterComponent());
        local_ecs.add_component<PositionComponent>(monster_entity, new PositionComponent(pos_x, pos_y));
        local_ecs.add_component<QuadGridIndexComponent>(monster_entity, new QuadGridIndexComponent(<f32>local_level.width() * TILE_SIZE));
        local_ecs.add_component<PreviousPositionComponent>(monster_entity, new PreviousPositionComponent(pos_x, pos_y));
        local_ecs.add_component<MoveTagComponent>(monster_entity, new MoveTagComponent());
        local_ecs.add_component<RotationSpeedComponent>(monster_entity, new RotationSpeedComponent(MONSTER_ROTATION_SPEED));
        local_ecs.add_component<RadiusComponent>(monster_entity, new RadiusComponent(MONSTER_RADIUS));
        local_ecs.add_component<AngleComponent>(monster_entity, new AngleComponent(angle));
        local_ecs.add_component<TargetAngleComponent>(monster_entity, new TargetAngleComponent(angle));
        local_ecs.add_component<PathfinderTaskComponent>(monster_entity, new PathfinderTaskComponent());
        local_ecs.add_component<PathfinderIdComponent>(monster_entity, new PathfinderIdComponent());
        local_ecs.add_component<StateComponent>(monster_entity, new StateComponent());  // by default it is iddle
        local_ecs.add_component<StateIddleComponent>(monster_entity, new StateIddleComponent(<f32>random.next_float(MONSTER_IDDLE_TIME[0], MONSTER_IDDLE_TIME[1])));
        local_ecs.add_component<PathfinderStatusComponent>(monster_entity, new PathfinderStatusComponent());

        // also we should add the entity to the pathfinder object
        // get it from the system
        const pathfinder_system = local_ecs.get_system<PathfinderMoveSystem>();
        // add as agent
        pathfinder_system.add_agent(monster_entity, pos_x, pos_y, MONSTER_SPEED);
    }
}

export function add_monster(): void {
    let local_level = level;
    let local_navmesh = navmesh;
    let local_ecs = ecs;
    if(local_level && local_navmesh && local_ecs) {
        const level_stat = local_level.statistics();
        // get random room
        const r_index = random.next(0, level_stat.rooms_count - 1);
        
        // get center of the room
        const r_center = level_stat.room_centers[r_index];
        // and radius
        const r_radius = level_stat.room_sizes[r_index];

        const emit_count = random.next(MONSTERS_PER_ROOM[0], MONSTERS_PER_ROOM[1]);
        for(let j = 0; j < emit_count; j++) {
            emit_one_monster(local_level, local_navmesh, local_ecs, r_center, r_radius);
        }
    }
}

export function define_player_target_position(in_x: f32, in_y: f32): boolean {
    let local_ecs = ecs;
    let local_navmesh = navmesh;
    if(local_ecs && local_navmesh) {
        // get player entity
        const entities = local_ecs.get_entities<NavmeshMoveSystem>();
        if(entities.length == 1) {  // it should be unique
            const player_entity: Entity = entities[0];
            const navmesh_task: NavmeshTaskComponent | null = local_ecs.get_component<NavmeshTaskComponent>(player_entity);
            const player_position: PositionComponent | null = local_ecs.get_component<PositionComponent>(player_entity);

            // we should calculate path between current player position and target position
            if(player_position && navmesh_task) {
                const path: StaticArray<f32> = local_navmesh.search_path(player_position.x(), 0.0, player_position.y(), in_x, 0.0, in_y);
                return navmesh_task.define_path(path);
            } else {
                return false;
            }
        }
    }

    return false;
}

// return global game settings as one plane array
// client should recognize this data and use it
export function get_game_settings(): StaticArray<f32> {
    // return the following data:
    // 1. Level width and height
    // 2. One tile size
    // 3. Data for navigation mesh
    // 4. Total number of tiles (for statistics only)
    output_buffer.reset();
    
    let local_level = level;
    let local_navmesh = navmesh;
    if(local_level && local_navmesh) {
        // format of the data:
        // [key, the number of values, actual values, ...]
        output_buffer.push(<f32>DATA.LEVEL_WIDHT);
        output_buffer.push(<f32>1);
        output_buffer.push(<f32>local_level.width());

        output_buffer.push(<f32>DATA.LEVEL_HEIGHT);
        output_buffer.push(<f32>1);
        output_buffer.push(<f32>local_level.height());

        output_buffer.push(<f32>DATA.TILE_SIZE);
        output_buffer.push(<f32>1);
        output_buffer.push(<f32>TILE_SIZE);

        // export navmesh (we will use it for the level map)
        const nm_vertices = local_navmesh.vertices();
        const nm_polygons = local_navmesh.polygons();
        const nm_sizes = local_navmesh.sizes();
        output_buffer.push(<f32>DATA.NAVMESH_VERTICES);
        output_buffer.push(<f32>nm_vertices.length);
        for(let i = 0, len = nm_vertices.length; i < len; i++) {
            output_buffer.push(nm_vertices[i]);
        }

        output_buffer.push(<f32>DATA.NAVMESH_POLYGONS);
        output_buffer.push(<f32>nm_polygons.length);
        for(let i = 0, len = nm_polygons.length; i < len; i++) {
            output_buffer.push(<f32>nm_polygons[i]);
        }

        output_buffer.push(<f32>DATA.NAVMESH_SIZES);
        output_buffer.push(<f32>nm_sizes.length);
        for(let i = 0, len = nm_sizes.length; i < len; i++) {
            output_buffer.push(<f32>nm_sizes[i]);
        }

        output_buffer.push(<f32>DATA.LEVEL_TOTAL_TILES);
        output_buffer.push(<f32>1.0);
        output_buffer.push(<f32>local_level.statistics().walkable_tiles);
    }
    return output_buffer.to_static();
}

export function game_update(dt: f32): void {
    let local_ecs = ecs;
    if(local_ecs) {
        local_ecs.update(dt);
    }
}

export function get_game_data(): StaticArray<f32> {
    output_buffer.reset();
    // for test output array from entities inside trivial system
    let local_ecs = ecs;
    if(local_ecs) {
        // get player entity
        const player_to_tiles_entities = local_ecs.get_entities<PositionToTileSystem>();
        if(player_to_tiles_entities.length > 0) {
            const player_entity = player_to_tiles_entities[0];
            const player_position: PositionComponent | null = local_ecs.get_component<PositionComponent>(player_entity);
            const player_move: MoveTagComponent | null = local_ecs.get_component<MoveTagComponent>(player_entity);
            const player_angle: AngleComponent | null = local_ecs.get_component<AngleComponent>(player_entity);
            const player_radius: RadiusComponent | null = local_ecs.get_component<RadiusComponent>(player_entity);
            const visible_monsters: QuadGridNeighborhoodComponent | null = local_ecs.get_component<QuadGridNeighborhoodComponent>(player_entity);

            if(player_position) {
                // player position
                output_buffer.push(<f32>DATA.PLAYER_POSITION);
                output_buffer.push(<f32>2);
                output_buffer.push(player_position.x());
                output_buffer.push(player_position.y());
            }

            if(player_radius) {
                output_buffer.push(<f32>DATA.PLAYER_RADIUS);
                output_buffer.push(<f32>1);
                output_buffer.push(player_radius.value());
            }

            if(player_move) {
                output_buffer.push(<f32>DATA.PLAYER_MOVE);
                output_buffer.push(<f32>1);
                output_buffer.push(player_move.value() ? 1.0 : 0.0);
            }

            if(player_angle) {
                output_buffer.push(<f32>DATA.PLAYER_ANGLE);
                output_buffer.push(<f32>1);
                output_buffer.push(player_angle.value());
            }

            // tiles to delete
            output_buffer.push(<f32>DATA.TILES_TO_DELETE);
            const player_tiles: NeighborhoodTilesComponent | null = local_ecs.get_component<NeighborhoodTilesComponent>(player_entity);
            if(player_tiles) {
                const to_delete = player_tiles.delete_tiles();
                const to_delete_count = to_delete.length;
                output_buffer.push(<f32>to_delete_count);
                for(let i = 0; i < to_delete_count; i++) {
                    output_buffer.push(<f32>to_delete.get(i));
                }

                // tiles to create
                output_buffer.push(<f32>DATA.TILES_TO_CREATE);
                const to_create = player_tiles.create_tiles();
                const to_create_count = to_create.length;
                output_buffer.push(<f32>to_create_count);
                for(let i = 0; i < to_create_count; i++) {
                    output_buffer.push(<f32>to_create.get(i));
                }
            }

            if(visible_monsters) {
                const visible: List<Entity> = visible_monsters.current();
                for(let i = 0, len = visible.length; i < len; i++) {
                    const monster_entity: Entity = visible.get(i);
                    // write data about visible monster
                    const monster_position: PositionComponent | null = local_ecs.get_component<PositionComponent>(monster_entity);
                    const monster_radius: RadiusComponent | null = local_ecs.get_component<RadiusComponent>(monster_entity);
                    const monster_move: MoveTagComponent | null = local_ecs.get_component<MoveTagComponent>(monster_entity);
                    const monster_angle: AngleComponent | null = local_ecs.get_component<AngleComponent>(monster_entity);
                    const monster_pathfinder_status: PathfinderStatusComponent | null = local_ecs.get_component<PathfinderStatusComponent>(monster_entity);
        
                    // for each component write entity and then data
                    if(monster_position) {
                        output_buffer.push(<f32>DATA.MONSTER_POSITION);
                        output_buffer.push(3.0);
                        output_buffer.push(<f32>monster_entity);
                        output_buffer.push(monster_position.x());
                        output_buffer.push(monster_position.y());
                    }
        
                    if(monster_radius) {
                        output_buffer.push(<f32>DATA.MONSTER_RADIUS);
                        output_buffer.push(2.0);
                        output_buffer.push(<f32>monster_entity);
                        output_buffer.push(monster_radius.value());
                    }
        
                    if(monster_move && monster_pathfinder_status) {
                        output_buffer.push(<f32>DATA.MONSTER_MOVE);
                        output_buffer.push(2.0);
                        output_buffer.push(<f32>monster_entity);
                        output_buffer.push((monster_move.value() || monster_pathfinder_status.value()) ? 1.0 : 0.0);
                    }
        
                    if(monster_angle) {
                        output_buffer.push(<f32>DATA.MONSTER_ANGLE);
                        output_buffer.push(2.0);
                        output_buffer.push(<f32>monster_entity);
                        output_buffer.push(monster_angle.value());
                    }
                }

                const to_delete: List<Entity> = visible_monsters.to_delete();
                output_buffer.push(<f32>DATA.MONSTERS_TO_DELETE);
                output_buffer.push(<f32>to_delete.length);
                for(let i = 0, len = to_delete.length; i < len; i++) {
                    output_buffer.push(<f32>to_delete.get(i));
                }
            }
        }

        const monsters_entities = local_ecs.get_entities<PathfinderMoveSystem>();
        // monsters in the level
        // the count
        output_buffer.push(<f32>DATA.MONSTERS_COUNT);
        output_buffer.push(1.0);
        output_buffer.push(<f32>monsters_entities.length);
    }

    return output_buffer.to_static();
}