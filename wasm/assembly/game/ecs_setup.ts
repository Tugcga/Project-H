import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../promethean/pseudo_random";
import { Level } from "../promethean/level";

import { STATE, ACTOR, EPSILON, TARGET_ACTION, CAST_ACTION, START_CAST_STATUS, COOLDAWN } from "./constants";

import { get_navmesh_path, direction_to_angle, distance } from "./utilities";

// import components
import { AngleComponent } from "./components/angle";
import { NeighborhoodRadiusComponent } from "./components/neighborhood_radius";
import { NeighborhoodTilesComponent } from "./components/neighborhood_tiles";
import { PositionComponent } from "./components/position";
import { PreviousPositionComponent } from "./components/previous_position";
import { VisibleQuadGridIndexComponent } from "./components/visible_quad_grid_index";
import { VisibleQuadGridNeighborhoodComponent } from "./components/visible_quad_grid_neighborhood";
import { RadiusComponent, RadiusSelectComponent } from "./components/radius";
import { RotationSpeedComponent } from "./components/rotation_speed";
import { SpeedComponent } from "./components/speed";
import { StateComponent, 
         StateWalkToPointComponent,
         StateShiftComponent,
         StateCastComponent,
         StateShieldComponent,
         StateStunComponent } from "./components/state";
import { PlayerComponent, MonsterComponent } from "./components/tags";
import { TargetAngleComponent } from "./components/target_angle";
import { TilePositionComponent } from "./components/tile_position";
import { VelocityComponent } from "./components/velocity";
import { PreferredVelocityComponent } from "./components/preferred_velocity";
import { ActorTypeComponent } from "./components/actor_type"
import { NeighborhoodQuadGridIndexComponent } from "./components/neighborhood_quad_grid_index";
import { BuffShiftCooldawnComponent, BuffMeleeAttackCooldawnComponent } from "./components/buffs";
import { ShiftSpeedMultiplierComponent } from "./components/shift_speed";
import { ShiftDistanceComponent } from "./components/shift_distance";
import { ShiftCooldawnComponent } from "./components/shift_cooldawn";
import { MoveTagComponent } from "./components/move";
import { TargetActionComponent } from "./components/target_action";
import { AtackDistanceComponent } from "./components/atack_distance";
import { AtackTimeComponent } from "./components/atack_time";
import { MeleeAttackCooldawnComponent } from "./components/melee_attack_cooldawn";
import { MeleeDamageDistanceComponent, MeleeDamageSpreadComponent, MeleeDamageDamageComponent } from "./components/damage";
import { CastMeleeDamageComponent } from "./components/cast";
import { LifeComponent } from "./components/life";
import { ShieldComponent, ShieldIncreaseComponent } from "./components/shield";
import { ApplyDamageComponent } from "./components/apply_damage";

// import systems
import { MoveTrackingSystem } from "./systems/move_tracking";
import { WalkToPointSystem } from "./systems/walk_to_point";
import { ShiftSystem } from "./systems/shift";
import { PositionToTileSystem } from "./systems/position_to_tile";
import { VisibleQuadGridNeighborhoodSystem } from "./systems/visible_quad_grid_neighborhood";
import { VisibleQuadGridTrackingSystem } from "./systems/visible_quad_grid_tracking";
import { NeighborhoodQuadGridTrackingSystem } from "./systems/neighborhood_quad_grid_tracking";
import { RotateSystem } from "./systems/rotate";
import { RVOSystem } from "./systems/rvo";
import { PrefToVelocitySystem } from "./systems/pref_velocity";
import { PostVelocitySystem } from "./systems/post_velocity";
import { MoveSystem } from "./systems/move";
import { ShieldSystem, ShieldIncreaseSystem } from "./systems/shield";
import { ResetVelocitySystem } from "./systems/reset_velocity";
import { WalkToPointSwitchSystem,
         ShiftSwitchSystem,
         CastSwitchSystem,
         StunSwitchSystem } from "./systems/state_switch";
import { UpdateToClientComponent } from "./components/update_to_client";
import { UpdateToClientSystem } from "./systems/update_to_client";
import { UpdateDebugSystem } from "./systems/update_debug"
import { BuffTimerShiftCooldawnSystem, BuffTimerMeleeAttackCooldawnSystem } from "./systems/buff_timer";
import { ApplyDamageSystem } from "./systems/apply_damage";

import { external_entity_start_shift,
         external_entity_start_melee_attack,
         external_entity_finish_melee_attack,
         external_entity_start_cooldawn,
         external_entity_activate_shield,
         external_entity_release_shield,
         external_entity_start_stun } from "../external";

import { DebugSettings, EngineSettings } from "./settings";

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
    //               WalkToPointSwitchSystem (to controll should we change the state to atack)
    //               NeighborhoodQuadGridTrackingSystem
    //               RVOSystem
    //               PostVelocitySystem
    //               PositionToTileSystem (obtain tile index)
    //               MoveTrackingSystem (check is entity is move by compare with previuos position)
    //               VisibleQuadGridTrackingSystem
    //               VisibleQuadGridNeighborhoodSystem
    //               UpdateToClientSystem (update data on cleint about the entity)
    //               UpdateDebugSystem (for debugging close positions)
    //               CastSwitchSystem (for rotate to target)
    //               ApplyDamageSystem (for rotate to attacker)
    // write systems: MoveSystem (make actual move)
    //                ShiftSystem (move at shift action)
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
    //               ShiftSystem
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
    //                CastSwitchSystem (when cast some action we should rotate to the target)
    //                ApplyDamageSystem (when shield is active, rotate to attacker)
    // comment: define the final target angle (for lerping between current angle and target angle) of the entity
    ecs.register_component<TargetAngleComponent>();

    // assigned: player, mosnters
    // read systems: UpdateToClientSystem (when update data to client about the entity we send, is it moved or not)
    //               RotateSystem (the rotation can happens only when the entity is moved)
    // write systems: MoveTrackingSystem (if the entity is moved, than activate the tag)
    // comment: not acutal tag
    // contains current move status (none, walk, shift)
    ecs.register_component<MoveTagComponent>();

    // assigned: player, monster
    // read systems: RVOSystem (for agent radius)
    // write systems: - value never changed, assigned when the entity is created
    // comment: data component with radius of the entity
    ecs.register_component<RadiusComponent>();

    // assigned: player, monster
    // does not used by any system
    // comment: data component, used for check is the player click to the actor entity or not
    ecs.register_component<RadiusSelectComponent>();

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
    //               MoveTrackingSystem (to define how the entity is moved)
    //               RotateSystem (get state to rotate if it equal to cast)
    //               MoveSystem (move only when we in walk to point state)
    //               RVOSystem (to check should we use rvo or not)
    //               ShieldIncreaseSystem (to check that shield increase outisde of the SHIELD state)
    //               UpdateToClientSystem (get dead state)
    // write systems: WalkToPointSwitchSystem
    //                ShiftSwitchSystem
    //                StunSwitchSystem
    //                ApplyDamageSystem (if the entity is dead), also read to define is shield activated o not
    // comment: store the action state of the entity
    // this component never delete from the entity
    // if the state is not IDDLE, then the entity should contains additional component what describe the properties of the selected state
    // used in all switch systems
    ecs.register_component<StateComponent>();

    // assigned: player, monsters (as result of state switch to WALK_TO_POINT)
    // read systems: WalkToPointSystem (to get target position in the trajectory)
    // write systems: WalkToPointSystem (update index of the target point in the trajectory)
    //                WalkToPointSwitchSystem (define is we need to sqitch to the other state)
    // comment:  data state component
    // contains trajectory (the path) for move entites to the destination point
    ecs.register_component<StateWalkToPointComponent>();

    // assigned: player (and may be monsters, if it can use this skill)
    // read systems: ShiftSystem (to get target point in the move process)
    //               ShiftSwitchSystem
    // write systems: - (contains only data)
    // comment: add this component when switch the state to fast shift
    // store speed multiplier and calculated target position
    ecs.register_component<StateShiftComponent>();

    // assign: player and monster (when it switch to cast state)
    // read systems: -
    // write systems: -
    // comment: store data for casting state
    // created at the end of walk to point state (when the character comes to the action distance)
    ecs.register_component<StateCastComponent>();

    // assign: player and monster when activate the shield
    // read systems: ShieldIncreaseSystem (this system executes WITHOUT this component)
    // write systems: ShieldSystem (update shield time)
    // comment: this component does not store actual shield value
    // is uses to measure the shield time (for attack interrupt effect)
    ecs.register_component<StateShieldComponent>();

    // assign: player and monsters, when turn into stun state
    // read systems: StateStunComponent (measure stun time)
    // write systems: -
    // comment: measure the stun time
    ecs.register_component<StateStunComponent>();

    // assigned: player, monsters
    // read systems: PostVelocitySystem (read and write to modify)
    //               MoveSystem (use velocity for actual move of the entity)
    // write systems: RVOSystem (calculate actual velocity vector from preferred velocities of the neighborhood entities)
    //                PrefToVelocitySystem (if RVO disabled)
    //                PostVelocitySystem
    // comment: contains final calculated velocity of the entity
    ecs.register_component<VelocityComponent>();

    // assigned: player, monsters
    // read systems: RVOSystem (get velocity for the algorithm) or PrefToVelocitySystem (if RVO disabled)
    // write systems: ResetVelocitySystem (at start clear preferred velocity vector)
    //                WalkToPointSystem (define preferred velocity to the walk target)
    //                ShiftSystem
    //                WalkToPointSwitchSystem (when entity comes to the target but does not ready, swith to iddle and reset velocity)
    // comment: target velocity of the entity
    // used as orientir for velocity in RVOSystem
    // this value does not used directly for moving
    ecs.register_component<PreferredVelocityComponent>();

    // assigned: player, monster
    // read systems: RVOSystem (for player we should not apply rvo), 
    //               WalkToPointSwitchSystem (for player and monster we should apply different strategise for state switches), 
    //               ShiftSwitchSystem
    //               UpdateToClientSystem (to call different method to update data for player or monsters)
    //               UpdateDebugSystem
    //               StunSwitchSystem (define switch to iddle or iddle wait)
    // write systems: -, the data assigned at create time and does not changed during the game
    // comment: data component
    // describe the type of the actor entity
    // now we have only player and monster actor type
    ecs.register_component<ActorTypeComponent>();

    // assigned: player, monsters
    // read systems: UpdateToClientSystem
    // write systems: MoveTrackingSystem (activate if the entity change position), 
    //                RotateSystem (activate when the entity change the angle)
    //                ShieldIncreaseSystem (when update the shield)
    //                ApplyDamageSystem (after apply damage life or shield is changed)
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

    // assigned: player (and may be monsers)
    // read systems: BuffTimerShiftCooldawnSystem (update value in the component), also used in ShiftSwitchSystem (to start cooldawn after action)
    // write systems: BuffTimerShiftCooldawnSystem
    // comment: add to the entity when it switch the state from fast shift to something different
    ecs.register_component<BuffShiftCooldawnComponent>();
    // BuffTimerMeleeAttackCooldawnSystem
    ecs.register_component<BuffMeleeAttackCooldawnComponent>();

    // assigned: player (and may be monsters)
    // read systems: ShiftSystem (to define actual speed, it calculated as general entity speed multiply to the value in the component)
    // write systems: -
    // comment: data component, used in fast shift state
    ecs.register_component<ShiftSpeedMultiplierComponent>();

    // assigned: player (and may be monsters)
    // read systems: - (used only when the entity command to stat fast shift action)
    // write systems: -
    // comment: data component, define fast shift action property
    ecs.register_component<ShiftDistanceComponent>();

    // assigned: player (and may be monsters)
    // read systems: ShiftSwitchSystem (used for apply cooldawn buff, when it needs)
    // write systems: -
    // comment: data component, define fast shift action propery
    ecs.register_component<ShiftCooldawnComponent>();

    // assigned: player, monster
    // read systems: CastSwitchSystem (when atack cast is over)
    // write systems: -
    // comment: data component, define cooldawn for melee atack
    ecs.register_component<MeleeAttackCooldawnComponent>();

    // assgined: player and monsters (to each player and monster, by default the action is none)
    // read systems: WalkToPointSystem (recalculate the path to the target, if action is not none)
    //               WalkToPointSwitchSystem (when come to target we should switch the state)
    // write systems: -
    // comment: assign this component when the entity start go to the target for some action
    // for atack, for exacmple, or to interact with another actor
    ecs.register_component<TargetActionComponent>();

    // assigned: all player and monsters
    // read systems: WalkToPointSwitchSystem (to start atack state at the end of walk)
    // write systems: -
    // comment: data class, store attack time properties of the character, it shold be defined by character equip
    ecs.register_component<AtackTimeComponent>();

    // assigned: each player and monster
    // read systems: WalkToPointSwitchSystem (to start cast state)
    // write system: -
    // comment: this parameter define the distance where the chracter start attack the enemy
    ecs.register_component<AtackDistanceComponent>();

    // assigned: player and monsters
    // read systems: WalkToPointSwitchSystem (to start atack cast)
    // write systems: -
    // comment: data components for damage cone
    ecs.register_component<MeleeDamageDistanceComponent>();
    ecs.register_component<MeleeDamageSpreadComponent>();
    ecs.register_component<MeleeDamageDamageComponent>();

    // assigned: player, mosnters
    // read systems: -
    // write systems: -
    // comment: data component, assign to entity when it start casting melee atack
    // contains data for post-cast process (apply damage and so on)
    ecs.register_component<CastMeleeDamageComponent>();

    // assigned: all players and monsters
    // read systems: -
    // write systems: ApplyDamageSystem
    // comment: stire the pair life/max life of the entity
    // these values are u32
    ecs.register_component<LifeComponent>();

    // assigned: all players and monsters
    // read systems: -
    // write systems: ShieldIncreaseSystem
    //                ApplyDamageSystem
    // comment: store the pair shield/ max shield for each entity
    // values are f32, the shield value incereased every time when entity in non-shield state
    ecs.register_component<ShieldComponent>();

    // assigned: all player and monsters
    // read systems: ShieldIncreaseSystem
    // write systems: -
    // comment: data component, define the value for increase the shield value each second
    ecs.register_component<ShieldIncreaseComponent>();

    // assigned: player and monsters when we should apply damage
    // read systems: -
    // write systems: -
    // comment: this component used for setting damage to entity
    // actual damage apply process executed in separate system in the same frame
    // after it the component is removed
    ecs.register_component<ApplyDamageComponent>();
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
                              path_to_target_recalculate_time: f32,
                              default_melee_stun: f32,
                              debug_settings: DebugSettings,
                              engine_settings: EngineSettings): void {
    // reset to zero preferred velocities for all movable entities (player, mosnters)
    ecs.register_system<ResetVelocitySystem>(new ResetVelocitySystem());
    ecs.set_system_with_component<ResetVelocitySystem, PreferredVelocityComponent>();

    // calculate preferred velocity for all entites which walks to the point
    // does not move entity here
    // we need position to define is the entity jamps over current target point or not
    // if yes, increase index of the target point in the trajectory path
    ecs.register_system<WalkToPointSystem>(new WalkToPointSystem(navmesh, path_recalculate_time, path_to_target_recalculate_time));
    ecs.set_system_with_component<WalkToPointSystem, PositionComponent>();
    ecs.set_system_with_component<WalkToPointSystem, SpeedComponent>();
    ecs.set_system_with_component<WalkToPointSystem, StateWalkToPointComponent>();
    ecs.set_system_with_component<WalkToPointSystem, PreferredVelocityComponent>();
    ecs.set_system_with_component<WalkToPointSystem, TargetActionComponent>();

    // alternative to walk to point system
    // calculate the proper velocity (in fact preferred velocity) for entities in the fast shift action state
    ecs.register_system<ShiftSystem>(new ShiftSystem());
    ecs.set_system_with_component<ShiftSystem, PositionComponent>();
    ecs.set_system_with_component<ShiftSystem, StateShiftComponent>();
    ecs.set_system_with_component<ShiftSystem, SpeedComponent>();
    ecs.set_system_with_component<ShiftSystem, ShiftSpeedMultiplierComponent>();
    ecs.set_system_with_component<ShiftSystem, PreferredVelocityComponent>();

    ecs.register_system<ShieldSystem>(new ShieldSystem());
    ecs.set_system_with_component<ShieldSystem, StateShieldComponent>();

    ecs.register_system<ShieldIncreaseSystem>(new ShieldIncreaseSystem());
    ecs.set_system_with_component<ShieldIncreaseSystem, ShieldComponent>();
    ecs.set_system_with_component<ShieldIncreaseSystem, ShieldIncreaseComponent>();
    ecs.set_system_with_component<ShieldIncreaseSystem, StateComponent>();
    ecs.set_system_with_component<ShieldIncreaseSystem, UpdateToClientComponent>();  // mark entity to update when update the shield
    ecs.set_system_without_component<ShieldIncreaseSystem, StateShieldComponent>();

    // calculate quad index (used for neigborhoods) from the position of the player and monsters
    // store it in the component
    // if the index is changed, then move entity index in the inner array of the system, whcich tracking all changes and store actual indices
    const neighborhood_tracking_system = ecs.register_system<NeighborhoodQuadGridTrackingSystem>(new NeighborhoodQuadGridTrackingSystem(<f32>level_width * tile_size, <f32>level_height * tile_size, neighborhood_quad_size));
    ecs.set_system_with_component<NeighborhoodQuadGridTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<NeighborhoodQuadGridTrackingSystem, NeighborhoodQuadGridIndexComponent>();

    // check is the entity comes to the target point of the path
    // if yes, switch to the iddle state (for the player) or iddle wait state (for mosnters)
    ecs.register_system<WalkToPointSwitchSystem>(new WalkToPointSwitchSystem());
    ecs.set_system_with_component<WalkToPointSwitchSystem, StateWalkToPointComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, StateComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, ActorTypeComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, TargetActionComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, PositionComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, PreferredVelocityComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, AtackTimeComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, AtackDistanceComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, MeleeDamageDistanceComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, MeleeDamageSpreadComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, MeleeDamageDamageComponent>();

    // controll when the action shift is over and change the entity state to iddle
    // for player to simple iddle
    // for monster to wait iddle (and that's why we need random and iddle times)
    ecs.register_system<ShiftSwitchSystem>(new ShiftSwitchSystem());
    ecs.set_system_with_component<ShiftSwitchSystem, StateComponent>();
    ecs.set_system_with_component<ShiftSwitchSystem, StateShiftComponent>();
    ecs.set_system_with_component<ShiftSwitchSystem, ShiftCooldawnComponent>();
    ecs.set_system_with_component<ShiftSwitchSystem, ActorTypeComponent>();

    // tracking_system required to find closed entities to the attacker entity
    ecs.register_system<CastSwitchSystem>(new CastSwitchSystem(neighborhood_tracking_system, navmesh));
    ecs.set_system_with_component<CastSwitchSystem, StateComponent>();
    ecs.set_system_with_component<CastSwitchSystem, StateCastComponent>();
    ecs.set_system_with_component<CastSwitchSystem, ActorTypeComponent>();
    ecs.set_system_with_component<CastSwitchSystem, TargetAngleComponent>();
    ecs.set_system_with_component<CastSwitchSystem, PositionComponent>();

    ecs.register_system<StunSwitchSystem>(new StunSwitchSystem());
    ecs.set_system_with_component<StunSwitchSystem, StateComponent>();
    ecs.set_system_with_component<StunSwitchSystem, ActorTypeComponent>();
    ecs.set_system_with_component<StunSwitchSystem, StateStunComponent>();

    if (engine_settings.use_rvo) {
        // system for rvo algorithm
        // for player we simply copy preferred velocity to velocity
        // for monsters calculate proper velocities
        ecs.register_system<RVOSystem>(new RVOSystem(neighborhood_tracking_system, rvo_time_horizon));
        ecs.set_system_with_component<RVOSystem, PreferredVelocityComponent>();
        ecs.set_system_with_component<RVOSystem, VelocityComponent>();
        ecs.set_system_with_component<RVOSystem, ActorTypeComponent>();
        ecs.set_system_with_component<RVOSystem, PositionComponent>();
        ecs.set_system_with_component<RVOSystem, RadiusComponent>();
        ecs.set_system_with_component<RVOSystem, SpeedComponent>();
        ecs.set_system_with_component<RVOSystem, StateComponent>();
    } else {
        ecs.register_system<PrefToVelocitySystem>(new PrefToVelocitySystem());
        ecs.set_system_with_component<PrefToVelocitySystem, PreferredVelocityComponent>();
        ecs.set_system_with_component<PrefToVelocitySystem, VelocityComponent>();
    }

    // we does not need this without active rvo
    // because velocity modified only by rvo
    // in all other cases the agents walk along navmesh path
    if (engine_settings.velocity_boundary_control) {
        ecs.register_system<PostVelocitySystem>(new PostVelocitySystem(navmesh));
        ecs.set_system_with_component<PostVelocitySystem, VelocityComponent>();
    }

    ecs.register_system<ApplyDamageSystem>(new ApplyDamageSystem(default_melee_stun));
    ecs.set_system_with_component<ApplyDamageSystem, UpdateToClientComponent>();  // if life or shield is changed, activate update
    ecs.set_system_with_component<ApplyDamageSystem, LifeComponent>();
    ecs.set_system_with_component<ApplyDamageSystem, ShieldComponent>();
    ecs.set_system_with_component<ApplyDamageSystem, StateComponent>();  // target entity can switch to another state
    ecs.set_system_with_component<ApplyDamageSystem, ApplyDamageComponent>();  // store actual damage
    ecs.set_system_with_component<ApplyDamageSystem, TargetAngleComponent>();  // to rotate entity to attacker with active shield
    ecs.set_system_with_component<ApplyDamageSystem, PositionComponent>();

    // move entities by using calculated velocities and curent positions
    // navmesh used for snapping to the walkable area
    // move along velocity AFTER all switches
    // because in some cases it can swith to idlle and does not require step to the point
    ecs.register_system<MoveSystem>(new MoveSystem(navmesh, engine_settings.snap_to_navmesh));
    ecs.set_system_with_component<MoveSystem, VelocityComponent>();
    ecs.set_system_with_component<MoveSystem, PositionComponent>();
    ecs.set_system_with_component<MoveSystem, StateComponent>();

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
    ecs.set_system_with_component<MoveTrackingSystem, TargetAngleComponent>();  // set target angle with respect to prev and current position
    ecs.set_system_with_component<MoveTrackingSystem, StateComponent>();  // to check how the entity is move
    ecs.set_system_with_component<MoveTrackingSystem, UpdateToClientComponent>();

    // rotate (change AngleComponent) if the target angle is different from current angle
    // the rotation can happens only when the entity is moved (MoveTagComponent is used)
    ecs.register_system<RotateSystem>(new RotateSystem());
    ecs.set_system_with_component<RotateSystem, MoveTagComponent>();  // rotate only if item is moved
    ecs.set_system_with_component<RotateSystem, AngleComponent>();
    ecs.set_system_with_component<RotateSystem, TargetAngleComponent>();
    ecs.set_system_with_component<RotateSystem, RotationSpeedComponent>();
    ecs.set_system_with_component<RotateSystem, UpdateToClientComponent>();
    ecs.set_system_with_component<RotateSystem, StateComponent>();

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

    // system for controll the time of the buff, which we assign to the entity after fast shif action
    // with this buff the new action is not allowed
    // when the timer is over, the component deleted by this system
    ecs.register_system<BuffTimerShiftCooldawnSystem>(new BuffTimerShiftCooldawnSystem());
    ecs.set_system_with_component<BuffTimerShiftCooldawnSystem, BuffShiftCooldawnComponent>();

    // similar system to cooldawn melee atack
    ecs.register_system<BuffTimerMeleeAttackCooldawnSystem>(new BuffTimerMeleeAttackCooldawnSystem());
    ecs.set_system_with_component<BuffTimerMeleeAttackCooldawnSystem, BuffMeleeAttackCooldawnComponent>();

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
                             shift_speed_multiplier: f32,
                             shift_distance: f32,
                             shift_cooldawn: f32,
                             melee_attack_cooldaw: f32,
                             radius: f32, 
                             angle: f32, 
                             rotation_speed: f32, 
                             tiles_visible_radius: i32, 
                             level_width: f32, 
                             neighborhood_quad_size: f32,
                             radius_select_delta: f32,
                             atack_distance: f32,
                             melee_timing: f32,
                             melee_damage_damage: u32,
                             melee_damage_distance: f32,
                             melee_damage_spread: f32,
                             life: u32,
                             shield: f32,
                             shield_resurect: f32): Entity {
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
    ecs.add_component<RadiusSelectComponent>(player_entity, new RadiusSelectComponent(radius + radius_select_delta));  // use slightly bigger select radius
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
    ecs.add_component<ShiftSpeedMultiplierComponent>(player_entity, new ShiftSpeedMultiplierComponent(shift_speed_multiplier));
    ecs.add_component<ShiftDistanceComponent>(player_entity, new ShiftDistanceComponent(shift_distance));
    ecs.add_component<ShiftCooldawnComponent>(player_entity, new ShiftCooldawnComponent(shift_cooldawn));
    ecs.add_component<MeleeAttackCooldawnComponent>(player_entity, new MeleeAttackCooldawnComponent(melee_attack_cooldaw));
    ecs.add_component<TargetActionComponent>(player_entity, new TargetActionComponent(0, TARGET_ACTION.NONE));
    ecs.add_component<AtackTimeComponent>(player_entity, new AtackTimeComponent(melee_timing));
    ecs.add_component<AtackDistanceComponent>(player_entity, new AtackDistanceComponent(atack_distance));
    ecs.add_component<MeleeDamageDamageComponent>(player_entity, new MeleeDamageDamageComponent(melee_damage_damage));
    ecs.add_component<MeleeDamageDistanceComponent>(player_entity, new MeleeDamageDistanceComponent(melee_damage_distance));
    ecs.add_component<MeleeDamageSpreadComponent>(player_entity, new MeleeDamageSpreadComponent(melee_damage_spread));
    ecs.add_component<LifeComponent>(player_entity, new LifeComponent(life));
    ecs.add_component<ShieldComponent>(player_entity, new ShieldComponent(shield));
    ecs.add_component<ShieldIncreaseComponent>(player_entity, new ShieldIncreaseComponent(shield_resurect));

    return player_entity;
}

export function setup_monster(ecs: ECS, 
                              pos_x: f32, 
                              pos_y: f32, 
                              angle: f32, 
                              speed: f32, 
                              melee_attack_cooldaw: f32,
                              radius: f32, 
                              rotation_speed: f32,
                              iddle_wait_time: f32,
                              level_width: f32, 
                              visible_quad_size: f32,
                              neighborhood_quad_size: f32,
                              radius_select_delta: f32,
                              atack_distance: f32,
                              melee_timing: f32,
                              melee_damage_damage: u32,
                              melee_damage_distance: f32,
                              melee_damage_spread: f32,
                              life: u32,
                              shield: f32,
                              shield_resurect: f32): Entity {
    const monster_entity = ecs.create_entity();
    ecs.add_component<ActorTypeComponent>(monster_entity, new ActorTypeComponent(ACTOR.MONSTER));
    ecs.add_component<MonsterComponent>(monster_entity, new MonsterComponent());
    const monster_state = new StateComponent();
    monster_state.set_state(STATE.IDDLE);
    ecs.add_component<StateComponent>(monster_entity, monster_state);
    ecs.add_component<PreferredVelocityComponent>(monster_entity, new PreferredVelocityComponent());
    ecs.add_component<VelocityComponent>(monster_entity, new VelocityComponent());
    ecs.add_component<PositionComponent>(monster_entity, new PositionComponent(pos_x, pos_y));
    ecs.add_component<PreviousPositionComponent>(monster_entity, new PreviousPositionComponent(pos_x, pos_y));  // set the same position
    ecs.add_component<SpeedComponent>(monster_entity, new SpeedComponent(speed));
    ecs.add_component<RadiusComponent>(monster_entity, new RadiusComponent(radius));
    ecs.add_component<RadiusSelectComponent>(monster_entity, new RadiusSelectComponent(radius + radius_select_delta));  // use slightly bigger select radius
    ecs.add_component<RotationSpeedComponent>(monster_entity, new RotationSpeedComponent(rotation_speed));
    ecs.add_component<AngleComponent>(monster_entity, new AngleComponent(angle));
    ecs.add_component<TargetAngleComponent>(monster_entity, new TargetAngleComponent(angle));
    ecs.add_component<MoveTagComponent>(monster_entity, new MoveTagComponent());
    ecs.add_component<VisibleQuadGridIndexComponent>(monster_entity, new VisibleQuadGridIndexComponent(level_width, visible_quad_size));
    ecs.add_component<UpdateToClientComponent>(monster_entity, new UpdateToClientComponent());
    ecs.add_component<NeighborhoodQuadGridIndexComponent>(monster_entity, new NeighborhoodQuadGridIndexComponent(level_width, neighborhood_quad_size));
    ecs.add_component<TargetActionComponent>(monster_entity, new TargetActionComponent(0, TARGET_ACTION.NONE));
    ecs.add_component<AtackTimeComponent>(monster_entity, new AtackTimeComponent(melee_timing));
    ecs.add_component<AtackDistanceComponent>(monster_entity, new AtackDistanceComponent(atack_distance));
    ecs.add_component<MeleeAttackCooldawnComponent>(monster_entity, new MeleeAttackCooldawnComponent(melee_attack_cooldaw));
    ecs.add_component<MeleeDamageDamageComponent>(monster_entity, new MeleeDamageDamageComponent(melee_damage_damage));
    ecs.add_component<MeleeDamageDistanceComponent>(monster_entity, new MeleeDamageDistanceComponent(melee_damage_distance));
    ecs.add_component<MeleeDamageSpreadComponent>(monster_entity, new MeleeDamageSpreadComponent(melee_damage_spread));
    ecs.add_component<LifeComponent>(monster_entity, new LifeComponent(life));
    ecs.add_component<ShieldComponent>(monster_entity, new ShieldComponent(shield));
    ecs.add_component<ShieldIncreaseComponent>(monster_entity, new ShieldIncreaseComponent(shield_resurect));

    return monster_entity;
}

export function clear_state_components(ecs: ECS, state_value: STATE, entity: Entity): void {
    if (state_value == STATE.WALK_TO_POINT) {
        ecs.remove_component<StateWalkToPointComponent>(entity);
    } else if (state_value == STATE.SHIFTING) {
        ecs.remove_component<StateShiftComponent>(entity);
    } else if (state_value == STATE.CASTING) {
        ecs.remove_component<StateCastComponent>(entity);
    } else if (state_value == STATE.SHIELD) {
        ecs.remove_component<StateShieldComponent>(entity);
    } else if(state_value == STATE.STUN) {
        ecs.remove_component<StateStunComponent>(entity);
    }
}

function assign_cast_state(ecs: ECS | null,
                           entity: Entity,
                           cast_time: f32,
                           target: Entity,
                           state: StateComponent,
                           cast_type: CAST_ACTION): START_CAST_STATUS {
    if (ecs) {
        if (cast_type == CAST_ACTION.MELEE_ATACK) {
            // check is there exist buff cooldawn
            const buff_melee: BuffMeleeAttackCooldawnComponent | null = ecs.get_component<BuffMeleeAttackCooldawnComponent>(entity);
            if (buff_melee) {
                // component exists, cooldawn is not over, fail to start the cast
                return START_CAST_STATUS.FAIL_COOLDAWN;
            }

            ecs.add_component(entity, new StateCastComponent(cast_type, cast_time));
            state.set_state(STATE.CASTING);
            return START_CAST_STATUS.OK;
        } else {
            return START_CAST_STATUS.FAIL_WRONG_CAST;
        }
    }

    return START_CAST_STATUS.FAIL;
}

export function try_start_melee_attack(ecs: ECS, entity: Entity, target_entity: Entity,
                                       position: PositionComponent,
                                       attack_distance: AtackDistanceComponent,
                                       attack_time: AtackTimeComponent,
                                       damage_damage: MeleeDamageDamageComponent,
                                       damage_distance: MeleeDamageDistanceComponent,
                                       damage_spread: MeleeDamageSpreadComponent,
                                       state: StateComponent,
                                       entity_target_action: TargetActionComponent,
                                       target_position: PositionComponent,
                                       target_radius: RadiusComponent,
                                       target_state: StateComponent): START_CAST_STATUS {
    const state_value = state.state();
    if (state_value == STATE.SHIFTING || state_value == STATE.CASTING || state_value == STATE.SHIELD || state_value == STATE.DEAD || state_value == STATE.STUN) {
        return START_CAST_STATUS.FAIL_FORBIDDEN;
    }

    const radius_value = target_radius.value();
    // calculate the distance from entity to the target
    const to_target_distance = distance(position.x(), position.y(), target_position.x(), target_position.y());
    // here we use target action = atack, so, check the distance with atack distance value
    // for other action (talk or use item, use another distance value)
    if (to_target_distance < attack_distance.value() + radius_value && target_state.state() != STATE.SHIFTING) {
        // come to the active cast distance
        // we should delete the walk state and assign cast state
        // use melee atack for simplicity
        // in general case it should be defined by character weapon
        const attack_time_value = attack_time.value();
        const damage_distance_value = damage_distance.value();
        const damage_spread_value = damage_spread.value();
        const damage_damage_value = damage_damage.value();

        const cast_state: START_CAST_STATUS = assign_cast_state(ecs, entity, attack_time_value, target_entity, state, CAST_ACTION.MELEE_ATACK);
        if (cast_state == START_CAST_STATUS.OK) {
            // ready to start cast
            // make target action = None
            entity_target_action.reset();
            external_entity_start_melee_attack(entity, attack_time_value, damage_distance_value, damage_spread_value);
            // add component with post-cast data
            ecs.add_component(entity, new CastMeleeDamageComponent(target_entity, damage_distance_value, damage_spread_value, damage_damage_value));

            // add melee cooldawn
            const melee_cooldawn: MeleeAttackCooldawnComponent | null = ecs.get_component<MeleeAttackCooldawnComponent>(entity);
            if (melee_cooldawn) {
                const melee_cooldawn_value = melee_cooldawn.value();
                ecs.add_component(entity, new BuffMeleeAttackCooldawnComponent(melee_cooldawn_value));
                external_entity_start_cooldawn(entity, COOLDAWN.MELEE_ATTACK, melee_cooldawn_value);
            }

            return START_CAST_STATUS.OK;
        } else {
            return cast_state;
        }
    } else {
        return START_CAST_STATUS.FAIL_DISTANCE;
    }
}

// return true if correctly switch to iddle
// false if something is not ok
export function interrupt_to_iddle(ecs: ECS, entity: Entity, entity_state: StateComponent): boolean {
    const state_value = entity_state.state();
    if (state_value == STATE.IDDLE) {
        // nothing to do
        // start as usual
    } else if (state_value == STATE.WALK_TO_POINT) {
        // switch to iddle
        entity_state.set_state(STATE.IDDLE);  // iddle does not required any additional component
        clear_state_components(ecs, STATE.WALK_TO_POINT, entity);
    } else if (state_value == STATE.SHIFTING) {
        // under shift we can not do anything
        return false;
    } else if (state_value == STATE.CASTING) {
        // get casting component
        const entity_cast: StateCastComponent | null = ecs.get_component<StateCastComponent>(entity);
        if (entity_cast) {
            const entity_cast_type = entity_cast.type();
            if (entity_cast_type == CAST_ACTION.MELEE_ATACK) {
                ecs.remove_component<CastMeleeDamageComponent>(entity);
                entity_state.set_state(STATE.IDDLE);
                clear_state_components(ecs, STATE.CASTING, entity);

                // notify client about cast interruption
                external_entity_finish_melee_attack(entity, true);
            } else {
                // unsupported cast type

                return false;
            }
        } else {
            // cast conmponent is invalid
            // something wrong
            return false;
        }
    } else if (state_value == STATE.SHIELD) {
        entity_state.set_state(STATE.IDDLE);
        clear_state_components(ecs, STATE.SHIELD, entity);
        external_entity_release_shield(entity);
    } else if (state_value == STATE.DEAD) {
        // fail to switch dead state to iddle
        return false;
    } else if (state_value == STATE.STUN) {
        return false;
    } else {
        // unknown state
        return false;
    }

    return true;
}

export function command_move_to_point(ecs: ECS, navmesh: Navmesh, entity: Entity, in_x: f32, in_y: f32): boolean {
    // get state
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        const state_value = state.state();
        if (state_value == STATE.DEAD || state_value == STATE.STUN) {
            // can not move in dead or stun state
            return false;
        }

        const is_interrupt = interrupt_to_iddle(ecs, entity, state);
        if (is_interrupt == false) {
            return false;
        }

        const position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
        const target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);
        if (position && target_action) {
            const path = get_navmesh_path(navmesh, position.x(), position.y(), in_x, in_y);
            if (path.length > 0) {
                // find valid path
                // set neutral narget
                target_action.reset();

                state.set_state(STATE.WALK_TO_POINT);
                const walk_to_point = new StateWalkToPointComponent();
                // assign path
                const is_define = walk_to_point.define_path(path);
                // add this component to the entity
                ecs.add_component<StateWalkToPointComponent>(entity, walk_to_point);
                return is_define;
            } else {
                // path is invalid
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function command_move_to_target(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity, target_x: f32, target_y: f32, action_type: TARGET_ACTION): boolean {
    if (action_type == TARGET_ACTION.ATACK) {
        // at first we chould check is we can start the attack cast
        const entity_position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
        const entity_attack_distance: AtackDistanceComponent | null = ecs.get_component<AtackDistanceComponent>(entity);
        const entity_attack_time: AtackTimeComponent | null = ecs.get_component<AtackTimeComponent>(entity);
        const entity_damage_damage: MeleeDamageDamageComponent | null = ecs.get_component<MeleeDamageDamageComponent>(entity);
        const entity_damage_distance: MeleeDamageDistanceComponent | null = ecs.get_component<MeleeDamageDistanceComponent>(entity);
        const entity_damage_spread: MeleeDamageSpreadComponent | null = ecs.get_component<MeleeDamageSpreadComponent>(entity);
        const entity_state: StateComponent | null = ecs.get_component<StateComponent>(entity);
        const entity_target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);

        // get some components for target
        const target_position: PositionComponent | null = ecs.get_component<PositionComponent>(target_entity);
        const target_radius: RadiusComponent | null = ecs.get_component<RadiusComponent>(target_entity);
        const target_state: StateComponent | null = ecs.get_component<StateComponent>(target_entity);

        if (entity_position && entity_attack_distance && entity_attack_time && entity_damage_damage && entity_damage_distance && entity_damage_spread && entity_state && entity_target_action &&
            target_position && target_radius && target_state) {
            const entity_state_value = entity_state.state();
            
            // check, may be nothing to do special
            let should_update: boolean = true;
            // check what entity is doing
            if (entity_state_value == STATE.WALK_TO_POINT) {
                if (entity_target_action.type() == TARGET_ACTION.ATACK && entity_target_action.entity() == target_entity) {
                    // it already goes to the same target, nothign to do
                    should_update = false;
                }
            } else if (entity_state_value == STATE.SHIFTING) {
                // forbidden do anything
                return false;
            } else if (entity_state_value == STATE.CASTING) {
                const entity_cast: StateCastComponent | null = ecs.get_component<StateCastComponent>(entity);
                if (entity_cast) {
                    // what type of the acst and what is target
                    if (entity_cast.type() == CAST_ACTION.MELEE_ATACK) {
                        const entity_cast_melee: CastMeleeDamageComponent | null = ecs.get_component<CastMeleeDamageComponent>(entity);
                        if (entity_cast_melee) {
                            if (entity_cast_melee.target() == target_entity) {
                                // already make melee cast to the same entity, nothig to do
                                should_update = false;
                            }
                        }
                    } else if (entity_cast.type() == CAST_ACTION.RANGE_ATACK) {
                        // is not supported yet
                    } else {
                        // unknown type of cast action
                    }
                }
            } else if (entity_state_value == STATE.SHIELD) {
                // from shield we can start move action
            } else if (entity_state_value == STATE.STUN) {
                // forbiddent to start move at stun state
                return false;
            }

            // entity make the same, nothing to do
            if (should_update == false) {
                return true;
            }

            // we preffer another action for the entity
            // it should skip current action and start the new one
            const is_interrupt = interrupt_to_iddle(ecs, entity, entity_state);
            // if false, then something wrong
            if (is_interrupt == false) {
                return false;
            }

            const melee_status = try_start_melee_attack(ecs, entity, target_entity,
                                                        entity_position,
                                                        entity_attack_distance,
                                                        entity_attack_time,
                                                        entity_damage_damage,
                                                        entity_damage_distance,
                                                        entity_damage_spread,
                                                        entity_state,
                                                        entity_target_action,
                                                        target_position,
                                                        target_radius,
                                                        target_state);
            if (melee_status == START_CAST_STATUS.OK) {
                // we switch the state to cast
                // here we should not clear state component, because it start from iddle

                return true;
            } else {
                // fail to start the cast
                // may be the distance or cooldawn
                // create the path to the point
                const is_create_path = command_move_to_point(ecs, navmesh, entity, target_x, target_y);
                if (is_create_path) {
                    // we create path and swith the state
                    // next we should define target action
                    // to track that the entity moves to the target, not just to point
                    const target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);
                    if (target_action) {
                        target_action.set_target(target_entity, action_type);
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    // fail to create path to target position
                }
            }
        } else {
            // some component is invalid
        }
    } else {
        // unknown target action
    }
    // other actions are not suppported yet

    return false;
}

// this method called by client and also by switching system when the cast is over
export function command_init_attack(ecs: ECS, navmesh: Navmesh, entity: Entity, target_entity: Entity): boolean {
    const target_position: PositionComponent | null = ecs.get_component<PositionComponent>(target_entity);
    if (target_position) {
        return command_move_to_target(ecs, navmesh, entity, target_entity, target_position.x(), target_position.y(), TARGET_ACTION.ATACK);
    }

    return false;
}

export function command_shift(ecs: ECS, navmesh: Navmesh, entity: Entity, cursor_x: f32, cursor_y: f32): void {
    const delta: f32 = 0.1;
    // chek the sate of the entity
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        // we can start the shift from any state, except the actual shift and dead
        const state_value = state.state();
        if (state_value != STATE.SHIFTING && state_value != STATE.DEAD && state_value != STATE.STUN) {
            // check is the player contains shift cooldawn
            const shift_cooldawn: BuffShiftCooldawnComponent | null = ecs.get_component<BuffShiftCooldawnComponent>(entity);
            if (!shift_cooldawn) {
                // there are no buff in the player
                // so, we can start the shift
                // get player angle
                // we will use it if fails to use the terget (if it close to position)
                const angle: AngleComponent | null = ecs.get_component<AngleComponent>(entity);
                const target_angle: TargetAngleComponent | null = ecs.get_component<TargetAngleComponent>(entity);
                // and current position
                const position: PositionComponent | null = ecs.get_component<PositionComponent>(entity);
                const shift_distance: ShiftDistanceComponent | null = ecs.get_component<ShiftDistanceComponent>(entity);
                const target_action: TargetActionComponent | null = ecs.get_component<TargetActionComponent>(entity);
                if (angle && target_angle && position && shift_distance && target_action) {
                    const pos_x = position.x();
                    const pos_y = position.y();
                    const a = angle.value();
                    let dir_x = Mathf.cos(a);
                    let dir_y = Mathf.sin(a);
                    const to_cursor_x = cursor_x - pos_x;
                    const to_cursor_y = cursor_y - pos_y;
                    const to_cursor_length = Mathf.sqrt(to_cursor_x*to_cursor_x + to_cursor_y*to_cursor_y);
                    if (to_cursor_length > EPSILON) {
                        dir_x = to_cursor_x / to_cursor_length;
                        dir_y = to_cursor_y / to_cursor_length;

                        // set angle and target angle
                        const new_a = direction_to_angle(dir_x, dir_y);
                        // it's question: should we immediately set the angle, or rotate it to target angle
                        angle.set_value(new_a);
                        target_angle.set_value(new_a);
                    }

                    // get distance from settings
                    const distance = shift_distance.value();
                    
                    // calculate target point
                    const target_x = pos_x + dir_x * distance;
                    const target_y = pos_y + dir_y * distance;

                    // check is the line from pos to target intersect the navmesh boundary
                    // use slightly bigger interval
                    const t = navmesh.intersect_boundary(pos_x - dir_x * delta, pos_y - dir_y * delta, target_x, target_y, true);
                    const mod_t = ((distance + delta) * t - delta) / distance;

                    // use actual target position defined by mod_t\in [0; 1]
                    const shift = new StateShiftComponent(pos_x + dir_x * (distance * mod_t - EPSILON), pos_y + dir_y * (distance * mod_t - EPSILON));

                    // switch the state
                    const is_interrupt = interrupt_to_iddle(ecs, entity, state);
                    if (is_interrupt) {
                        // assign new state
                        state.set_state(STATE.SHIFTING);
                        // add the component
                        ecs.add_component<StateShiftComponent>(entity, shift);
                        external_entity_start_shift(entity);
                    }
                }
            }
        }
    }
}

export function command_activate_shield(ecs: ECS, entity: Entity): void {
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        // entity can start shield state at iddle, walk and cast
        const state_value = state.state();
        if (state_value == STATE.IDDLE || state_value == STATE.WALK_TO_POINT || state_value == STATE.CASTING) {
            const is_interrupt = interrupt_to_iddle(ecs, entity, state);
            if (is_interrupt) {
                // now entity at iddle state
                state.set_state(STATE.SHIELD);
                const shield: StateShieldComponent = new StateShieldComponent();
                ecs.add_component<StateShieldComponent>(entity, shield);

                external_entity_activate_shield(entity);
            }
        }
    }
}

export function command_release_shield(ecs: ECS, entity: Entity): void {
    const shield: StateShieldComponent | null = ecs.get_component<StateShieldComponent>(entity);
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (shield && state) {
        const state_value = state.state();
        if (state_value == STATE.SHIELD) {
            // should not require to send external call, because it already called from interrupt function
            interrupt_to_iddle(ecs, entity, state);
            // TODO: be more carefull with mosnters, because they don't move in iddle state
        }
        // if the state is another, then nothig to do
    }
}

export function command_stun(ecs: ECS, entity: Entity, duration: f32): void {
    const state: StateComponent | null = ecs.get_component<StateComponent>(entity);
    if (state) {
        const state_value = state.state();

        if (state_value != STATE.STUN && state_value != STATE.DEAD) {
            const is_iddle = interrupt_to_iddle(ecs, entity, state);
            if (is_iddle) {
                state.set_state(STATE.STUN);
                ecs.add_component<StateStunComponent>(entity, new StateStunComponent(duration));

                external_entity_start_stun(entity, duration);
            }
        }
    }
}