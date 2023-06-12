import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../promethean/pseudo_random";
import { Level } from "../promethean/level";

import { STATE, ACTOR } from "./constants";

// import components
import { AngleComponent } from "./components/angle";
import { NeighborhoodRadiusComponent } from "./components/neighborhood_radius";
import { NeighborhoodTilesComponent } from "./components/neighborhood_tiles";
import { PositionComponent } from "./components/position";
import { PreviousPositionComponent } from "./components/previous_position";
import { VisibleQuadGridIndexComponent } from "./components/visible_quad_grid_index";
import { VisibleQuadGridNeighborhoodComponent } from "./components/visible_quad_grid_neighborhood";
import { RadiusComponent } from "./components/radius";
import { RotationSpeedComponent } from "./components/rotation_speed";
import { SpeedComponent } from "./components/speed";
import { StateComponent, StateIddleWaitComponent, StateWalkToPointComponent } from "./components/state";
import { PlayerComponent, MonsterComponent, MoveTagComponent } from "./components/tags";
import { TargetAngleComponent } from "./components/target_angle";
import { TilePositionComponent } from "./components/tile_position";
import { VelocityComponent } from "./components/velocity";
import { PreferredVelocityComponent } from "./components/preferred_velocity";
import { ActorTypeComponent } from "./components/actor_type"
import { NeighborhoodQuadGridIndexComponent } from "./components/neighborhood_quad_grid_index";

// import systems
import { MoveTrackingSystem } from "./systems/move_tracking";
import { WalkToPointSystem } from "./systems/walk_to_point";
import { PositionToTileSystem } from "./systems/position_to_tile";
import { VisibleQuadGridNeighborhoodSystem } from "./systems/visible_quad_grid_neighborhood";
import { VisibleQuadGridTrackingSystem } from "./systems/visible_quad_grid_tracking";
import { NeighborhoodQuadGridTrackingSystem } from "./systems/neighborhood_quad_grid_tracking";
import { RotateSystem } from "./systems/rotate";
import { RVOSystem } from "./systems/rvo";
import { MoveSystem } from "./systems/move";
import { ResetVelocitySystem } from "./systems/reset_velocity";
import { WalkToPointSwitchSystem, IddleWaitSwitchSystem } from "./systems/state_switch";
import { UpdateToClientComponent } from "./components/update_to_client";
import { UpdateToClientSystem } from "./systems/update_to_client";
import { UpdateDebugSystem } from "./systems/update_debug"

import { DebugSettings } from "./settings";

export function setup_components(ecs: ECS): void {
    // assigned: player
    // read systems: PositionToTileSystem
    //               VisibleQuadGridNeighborhoodSystem (executed only for player entity)
    // write systems: -
    // comment: tag for the player entity
    ecs.register_component<PlayerComponent>();

    // assigned: monsters
    // read systems: VisibleQuadGridTrackingSystem (for tracking visiblemonsters by the player)
    // write systems: -
    // comment: tag, assigned to each monster entity
    ecs.register_component<MonsterComponent>();

    // assigned: player, monsters
    // read systems: WalkToPointSystem
    //               NeighborhoodQuadGridTrackingSystem
    //               RVOSystem
    //               IddleWaitSwitchSystem (to define path if we switch to the walk state)
    //               PositionToTileSystem (obtain tile index)
    //               MoveTrackingSystem (check is entity is move by compare with previuos position)
    //               VisibleQuadGridTrackingSystem
    //               VisibleQuadGridNeighborhoodSystem
    //               UpdateToClientSystem (update data on cleint about the entity)
    //               UpdateDebugSystem (for debugging close positions)
    // write systems: MoveSystem (make actual move)
    // comment: define the spatial position of the entity in the level
    ecs.register_component<PositionComponent>();

    // assigned: player, monsters
    // read systems: MoveTrackingSystem
    // write systems: MoveTrackingSystem (each update call reassign the component data from the current position)
    // comment: store in this component position of the entity from the previous update call
    // used to define is entity is moved or not (by compare the current position with the previous one)
    ecs.register_component<PreviousPositionComponent>();

    // assigned: player
    // read systems: PositionToTileSystem
    // write systems: - component never changed
    // comment: data component, does not changed during the game
    // define how many tiles are visible for player
    ecs.register_component<NeighborhoodRadiusComponent>();

    // assigned: player
    // read systems: PositionToTileSystem
    // write systems: PositionToTileSystem
    // comment: store actual visible tiles, and also tiles to delete after update and create after update
    // when the component is create requires the link to the level object
    ecs.register_component<NeighborhoodTilesComponent>();

    // assigned: player
    // read systems: PositionToTileSystem
    // write systems: PositionToTileSystem
    // comment: store tile position (the pair of integer values) where the player is in current time
    // if coordinates in the component is changed, then update client data (call external functions)
    ecs.register_component<TilePositionComponent>();

    // assigned: player, mosnters
    // read systems: WalkToPointSystem (to calculate preffered velocity)
    //               RVOSystem (for the algorithm)
    // write systems: - the value of the component never changed
    // comment: data component with move speed of the entity
    ecs.register_component<SpeedComponent>();

    // assigned: player, mosnters
    // read systems: RotateSystem (for rotation process)
    // write systems: - the value does not changed, it defines at the create moment
    // comment: data component with rotation spedd of the entity
    ecs.register_component<RotationSpeedComponent>();

    // assigned: player, monsters
    // read systems: UpdateToClientSystem (to send data to the client)
    // write systems: RotateSystem (calculate actual angle)
    // comment: current angle (rotation in 2d) of the entity
    ecs.register_component<AngleComponent>();

    // assigned: player, mosnters
    // read systems: RotateSystem (component define the target rotation)
    // write systems: MoveTrackingSystem (define target rotation as direction where the entity is move on)
    // comment: define the final target angle (for lerping between current angle and target angle) of the entity
    ecs.register_component<TargetAngleComponent>();

    // assigned: player, mosnters
    // read systems: UpdateToClientSystem (when update data to client about the entity we send, is it moved or not)
    //               RotateSystem (the rotation can happens only when the entity is moved)
    // write systems: MoveTrackingSystem (if the entity is moved, than activate the tag)
    // comment: not acutal tag
    // contains true/false data for moved or non-moved entity
    ecs.register_component<MoveTagComponent>();

    // assigned: player, monster
    // read systems: RVOSystem (for agent radius)
    // write systems: - value never changed, assigned when the entity is created
    // comment: data component with radius of the entity
    ecs.register_component<RadiusComponent>();

    // assigned: mosnters
    // read systems: -
    // write systems: VisibleQuadGridTrackingSystem (get quad index from monster position and write it to the component)
    //                if the quad index is different from the previous one (from previuos update call), move entity id in the system inner variable
    // comment: store the quad index of the spatial grid of the entity
    // this grid splits the plane into chunks
    // it used to find entities near the player
    // used in VisibleQuadGridTrackingSystem
    ecs.register_component<VisibleQuadGridIndexComponent>();

    // assigned: player
    // read systems: -
    // write systems: VisibleQuadGridNeighborhoodComponent (write ids of entities in the neighborhood of the player)
    //                these ids obtained from VisibleQuadGridTrackingSystem inner variable from player position
    // comment: contains actual data of visible entites for the player (and also what entities are appear and disappear at the update call)
    // used in VisibleQuadGridNeighborhoodSystem
    ecs.register_component<VisibleQuadGridNeighborhoodComponent>();

    // assigned: player (start with IDDLE state), monsters (start with IDDLE_WAIT state)
    // read systems: UpdateDebugSystem (for debug only, so, does not required in system registers)
    // write systems: IddleWaitSwitchSystem (change state when it should switch to other)
    //                WalkToPointSwitchSystem
    // comment: store the action state of the entity
    // this component never delete from the entity
    // if the state is not IDDLE, then the entity should contains additional component what describe the properties of the selected state
    // used in all switch systems
    ecs.register_component<StateComponent>();

    // assigned: monsters (at create), monsters (as result of state switch, after walt to point)
    // read systems: IddleWaitSwitchSystem (check the time and then switch to walk state)
    // write systems: IddleWaitSwitchSystem (increase iddle time)
    // comment: data state component
    // describe iddle wait state (in this state the entity wait some time and then switch to move state)
    // assigne only to monster (when create), player use simple iddle state
    ecs.register_component<StateIddleWaitComponent>();

    // assigned: player, monsters (as result of state switch to WALK_TO_POINT)
    // read systems: WalkToPointSystem (to get target position in the trajectory)
    // write systems: WalkToPointSystem (update index of the target point in the trajectory)
    //                WalkToPointSwitchSystem (define is we need to sqitch to the other state)
    // comment:  data state component
    // contains trajectory (the path) for move entites to the destination point
    ecs.register_component<StateWalkToPointComponent>();

    // assigned: player, monsters
    // read systems: MoveSystem (use velocity for actual move of the entity)
    // write systems: RVOSystem (calculate actual velocity vector from preferred velocities of the neighborhood entities)
    // comment: contains final calculated velocity of the entity
    ecs.register_component<VelocityComponent>();

    // assigned: player, monsters
    // read systems: RVOSystem (get velocity for the algorithm)
    // write systems: ResetVelocitySystem (at start clear preferred velocity vector)
    //                WalkToPointSystem (define preferred velocity to the walk target)
    // comment: target velocity of the entity
    // used as orientir for velocity in RVOSystem
    // this value does not used directly for moving
    ecs.register_component<PreferredVelocityComponent>();

    // assigned: player, monster
    // read systems: RVOSystem (for player we should not apply rvo), 
    //               IddleWaitSwitchSystem, WalkToPointSwitchSystem (for player and monster we should apply different strategise for state switches), 
    //               UpdateToClientSystem (to call different method to update data for player or monsters)
    //               UpdateDebugSystem
    // write systems: -, the data assigned at create time and does not changed during the game
    // comment: data component
    // describe the type of the actor entity
    // now we have only player and monster actor type
    ecs.register_component<ActorTypeComponent>();

    // assigned: player, monsters
    // read systems: UpdateToClientSystem
    // write systems: MoveTrackingSystem (activate if the entity change position), 
    //                RotateSystem (activate when the entity change the angle)
    // comment: contains the flag (bool value) is the data about the entity should be updated on the client
    // at the end of the update call the system UpdateToClientSystem check each component
    // if it contains active flag, then it update data about corresponding entity at the client
    ecs.register_component<UpdateToClientComponent>();

    // assigned: player, monsters
    // read systems: -, actual grid data stored in the system, component needed only for tracking changes (and rewrite quad index in the system variable)
    // write systems: NeighborhoodQuadGridTrackingSystem (calculate quad index from position coordinates)
    // comment: store the index of the quad in spatial grid on the plane
    // this quad grid is similar to visible quad grid
    // but use smaller chunk size
    // used to tracking the quad index of each entity (from it position)
    ecs.register_component<NeighborhoodQuadGridIndexComponent>();
}

export function setup_systems(ecs: ECS,
                              navmesh: Navmesh,
                              random: PseudoRandom,
                              level_width: i32,
                              level_height: i32,
                              tile_size: f32,
                              visible_quad_size: f32,
                              neighborhood_quad_size: f32,
                              rvo_time_horizon: f32,
                              monster_random_walk_target_radius: f32,
                              monster_iddle_time: Array<f32>,
                              path_recalculate_time: f32,
                              debug_settings: DebugSettings): void {
    // reset to zero preferred velocities for all movable entities (player, mosnters)
    ecs.register_system<ResetVelocitySystem>(new ResetVelocitySystem());
    ecs.set_system_with_component<ResetVelocitySystem, PreferredVelocityComponent>();

    // calculate preferred velocity for all entites which walks to the point
    // does not move entity here
    // we need position to define is the entity jamps over current target point or not
    // if yes, increase index of the target point in the trajectory path
    ecs.register_system<WalkToPointSystem>(new WalkToPointSystem(navmesh, path_recalculate_time));
    ecs.set_system_with_component<WalkToPointSystem, PositionComponent>();
    ecs.set_system_with_component<WalkToPointSystem, SpeedComponent>();
    ecs.set_system_with_component<WalkToPointSystem, StateWalkToPointComponent>();
    ecs.set_system_with_component<WalkToPointSystem, PreferredVelocityComponent>();

    // calculate quad index (used for neigborhoods) from the position of the player and monsters
    // store it in the component
    // if the index is changed, then move entity index in the inner array of the system, whcich tracking all changes and store actual indices
    const neighborhood_tracking_system = ecs.register_system<NeighborhoodQuadGridTrackingSystem>(new NeighborhoodQuadGridTrackingSystem(<f32>level_width * tile_size, <f32>level_height * tile_size, neighborhood_quad_size));
    ecs.set_system_with_component<NeighborhoodQuadGridTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<NeighborhoodQuadGridTrackingSystem, NeighborhoodQuadGridIndexComponent>();

    // system for rvo algorithm
    // for player we simply copy preferred velocity to velocity
    // for monsters calculate proper velocities
    // navmesh used for control movement through boundary edges
    const rvo_system = ecs.register_system<RVOSystem>(new RVOSystem(navmesh, neighborhood_tracking_system, rvo_time_horizon));
    ecs.set_system_with_component<RVOSystem, PreferredVelocityComponent>();
    ecs.set_system_with_component<RVOSystem, VelocityComponent>();
    ecs.set_system_with_component<RVOSystem, ActorTypeComponent>();
    ecs.set_system_with_component<RVOSystem, PositionComponent>();
    ecs.set_system_with_component<RVOSystem, RadiusComponent>();
    ecs.set_system_with_component<RVOSystem, SpeedComponent>();

    // move entities by using calculated velocities and curent positions
    // navmesh used for snapping to the walkable area
    ecs.register_system<MoveSystem>(new MoveSystem(navmesh));
    ecs.set_system_with_component<MoveSystem, VelocityComponent>();
    ecs.set_system_with_component<MoveSystem, PositionComponent>();

    // check the time in the state component
    // if it over, dwitch to the walk state
    // we present ActorComponent, but it never realy used, because in our case only monster contains StateIddleWaitComponent
    ecs.register_system<IddleWaitSwitchSystem>(new IddleWaitSwitchSystem(navmesh, random, monster_random_walk_target_radius));
    ecs.set_system_with_component<IddleWaitSwitchSystem, StateIddleWaitComponent>();  // this component assigned only to monsters
    ecs.set_system_with_component<IddleWaitSwitchSystem, ActorTypeComponent>();
    ecs.set_system_with_component<IddleWaitSwitchSystem, StateComponent>();
    ecs.set_system_with_component<IddleWaitSwitchSystem, PositionComponent>();

    // check is the entity comes to the target point of the path
    // if yes, switch to the iddle state (for the player) or iddle wait state (for mosnters)
    ecs.register_system<WalkToPointSwitchSystem>(new WalkToPointSwitchSystem(random, monster_iddle_time));
    ecs.set_system_with_component<WalkToPointSwitchSystem, StateWalkToPointComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, StateComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, ActorTypeComponent>();

    // calculate tile index for the current player position
    // also find new, current and old tiles
    // send external call to the client
    ecs.register_system<PositionToTileSystem>(new PositionToTileSystem(level_width, level_height, tile_size));
    ecs.set_system_with_component<PositionToTileSystem, PlayerComponent>();  // only for player
    ecs.set_system_with_component<PositionToTileSystem, PositionComponent>();
    ecs.set_system_with_component<PositionToTileSystem, TilePositionComponent>();
    ecs.set_system_with_component<PositionToTileSystem, NeighborhoodRadiusComponent>();
    ecs.set_system_with_component<PositionToTileSystem, NeighborhoodTilesComponent>();

    // check is the entity is moved or not
    // by compare current position with the previous one
    // at the end rewrite previous position
    ecs.register_system<MoveTrackingSystem>(new MoveTrackingSystem());
    ecs.set_system_with_component<MoveTrackingSystem, PreviousPositionComponent>();
    ecs.set_system_with_component<MoveTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<MoveTrackingSystem, MoveTagComponent>();
    ecs.set_system_with_component<MoveTrackingSystem, TargetAngleComponent>();  // set target angle with respect to prv and current position
    ecs.set_system_with_component<MoveTrackingSystem, UpdateToClientComponent>();

    // rotate (change AngleComponent) if the target angle is different from current angle
    // the rotation can happens only when the entity is moved (MoveTagComponent is used)
    ecs.register_system<RotateSystem>(new RotateSystem());
    ecs.set_system_with_component<RotateSystem, MoveTagComponent>();  // rotate only if item is moved
    ecs.set_system_with_component<RotateSystem, AngleComponent>();
    ecs.set_system_with_component<RotateSystem, TargetAngleComponent>();
    ecs.set_system_with_component<RotateSystem, RotationSpeedComponent>();
    ecs.set_system_with_component<RotateSystem, UpdateToClientComponent>();

    // calculate quad index from monster position
    // if index is changed, update data in the inner system variable
    const visible_tracking_system = ecs.register_system<VisibleQuadGridTrackingSystem>(new VisibleQuadGridTrackingSystem(<f32>level_width * tile_size, <f32>level_height * tile_size, visible_quad_size));
    ecs.set_system_with_component<VisibleQuadGridTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<VisibleQuadGridTrackingSystem, MonsterComponent>();  // does not tracking player
    ecs.set_system_with_component<VisibleQuadGridTrackingSystem, VisibleQuadGridIndexComponent>();

    // tracking old and new monsters in the neighborhood of the player
    // call external method when the monster should be removed from the client
    // use visible_tracking_system as dependency for this system
    ecs.register_system<VisibleQuadGridNeighborhoodSystem>(new VisibleQuadGridNeighborhoodSystem(visible_tracking_system));
    ecs.set_system_with_component<VisibleQuadGridNeighborhoodSystem, PlayerComponent>();  // only for player
    ecs.set_system_with_component<VisibleQuadGridNeighborhoodSystem, PositionComponent>();
    ecs.set_system_with_component<VisibleQuadGridNeighborhoodSystem, VisibleQuadGridNeighborhoodComponent>();

    // update data at client for required entities
    // send some debug data if it is active
    ecs.register_system<UpdateToClientSystem>(new UpdateToClientSystem());
    ecs.set_system_with_component<UpdateToClientSystem, ActorTypeComponent>();
    ecs.set_system_with_component<UpdateToClientSystem, UpdateToClientComponent>();
    ecs.set_system_with_component<UpdateToClientSystem, PositionComponent>();
    ecs.set_system_with_component<UpdateToClientSystem, AngleComponent>();
    ecs.set_system_with_component<UpdateToClientSystem, MoveTagComponent>();

    if (debug_settings.use_debug) {
        ecs.register_system<UpdateDebugSystem>(new UpdateDebugSystem(debug_settings, neighborhood_tracking_system, visible_tracking_system));
        ecs.set_system_with_component<UpdateDebugSystem, ActorTypeComponent>();
        ecs.set_system_with_component<UpdateDebugSystem, PositionComponent>();
        ecs.set_system_with_component<UpdateDebugSystem, StateComponent>();
    }
}

export function setup_player(ecs: ECS, 
                             level: Level, 
                             pos_x: f32, 
                             pos_y: f32, 
                             speed: f32, 
                             radius: f32, 
                             angle: f32, 
                             rotation_speed: f32, 
                             tiles_visible_radius: i32, 
                             level_width: f32, 
                             neighborhood_quad_size: f32): Entity {
    const player_entity = ecs.create_entity();
    ecs.add_component<ActorTypeComponent>(player_entity, new ActorTypeComponent(ACTOR.PLAYER));
    ecs.add_component<PlayerComponent>(player_entity, new PlayerComponent());
    ecs.add_component<StateComponent>(player_entity, new StateComponent());
    ecs.add_component<PreferredVelocityComponent>(player_entity, new PreferredVelocityComponent());
    ecs.add_component<VelocityComponent>(player_entity, new VelocityComponent());
    ecs.add_component<PositionComponent>(player_entity, new PositionComponent(pos_x, pos_y));
    ecs.add_component<PreviousPositionComponent>(player_entity, new PreviousPositionComponent(pos_x, pos_y));  // set the same position
    ecs.add_component<SpeedComponent>(player_entity, new SpeedComponent(speed));
    ecs.add_component<RadiusComponent>(player_entity, new RadiusComponent(radius));
    ecs.add_component<RotationSpeedComponent>(player_entity, new RotationSpeedComponent(rotation_speed));
    ecs.add_component<AngleComponent>(player_entity, new AngleComponent(angle));
    ecs.add_component<TargetAngleComponent>(player_entity, new TargetAngleComponent(angle));  // set the same target angle at the start
    ecs.add_component<NeighborhoodTilesComponent>(player_entity, new NeighborhoodTilesComponent(level));
    ecs.add_component<NeighborhoodRadiusComponent>(player_entity, new NeighborhoodRadiusComponent(tiles_visible_radius));
    ecs.add_component<TilePositionComponent>(player_entity, new TilePositionComponent());
    ecs.add_component<MoveTagComponent>(player_entity, new MoveTagComponent());
    ecs.add_component<VisibleQuadGridNeighborhoodComponent>(player_entity, new VisibleQuadGridNeighborhoodComponent());
    ecs.add_component<UpdateToClientComponent>(player_entity, new UpdateToClientComponent());
    ecs.add_component<NeighborhoodQuadGridIndexComponent>(player_entity, new NeighborhoodQuadGridIndexComponent(level_width, neighborhood_quad_size));

    return player_entity;
}

export function setup_monster(ecs: ECS, 
                              pos_x: f32, 
                              pos_y: f32, 
                              angle: f32, 
                              speed: f32, 
                              radius: f32, 
                              rotation_speed: f32,
                              iddle_wait_time: f32,
                              level_width: f32, 
                              visible_quad_size: f32,
                              neighborhood_quad_size: f32): Entity {
    const monster_entity = ecs.create_entity();
    ecs.add_component<ActorTypeComponent>(monster_entity, new ActorTypeComponent(ACTOR.MONSTER));
    ecs.add_component<MonsterComponent>(monster_entity, new MonsterComponent());
    const monster_state = new StateComponent();
    monster_state.set_state(STATE.IDDLE_WAIT);
    ecs.add_component<StateComponent>(monster_entity, monster_state);
    ecs.add_component<StateIddleWaitComponent>(monster_entity, new StateIddleWaitComponent(iddle_wait_time));
    ecs.add_component<PreferredVelocityComponent>(monster_entity, new PreferredVelocityComponent());
    ecs.add_component<VelocityComponent>(monster_entity, new VelocityComponent());
    ecs.add_component<PositionComponent>(monster_entity, new PositionComponent(pos_x, pos_y));
    ecs.add_component<PreviousPositionComponent>(monster_entity, new PreviousPositionComponent(pos_x, pos_y));  // set the same position
    ecs.add_component<SpeedComponent>(monster_entity, new SpeedComponent(speed));
    ecs.add_component<RadiusComponent>(monster_entity, new RadiusComponent(radius));
    ecs.add_component<RotationSpeedComponent>(monster_entity, new RotationSpeedComponent(rotation_speed));
    ecs.add_component<AngleComponent>(monster_entity, new AngleComponent(angle));
    ecs.add_component<TargetAngleComponent>(monster_entity, new TargetAngleComponent(angle));
    ecs.add_component<MoveTagComponent>(monster_entity, new MoveTagComponent());
    ecs.add_component<VisibleQuadGridIndexComponent>(monster_entity, new VisibleQuadGridIndexComponent(level_width, visible_quad_size));
    ecs.add_component<UpdateToClientComponent>(monster_entity, new UpdateToClientComponent());
    ecs.add_component<NeighborhoodQuadGridIndexComponent>(monster_entity, new NeighborhoodQuadGridIndexComponent(level_width, neighborhood_quad_size));

    return monster_entity;
}