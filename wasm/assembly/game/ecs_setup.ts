import { ECS } from "../simple_ecs/simple_ecs";
import { Entity } from "../simple_ecs/types";
import { Navmesh } from "../pathfinder/navmesh/navmesh";
import { PseudoRandom } from "../promethean/pseudo_random";
import { Level } from "../promethean/level";

import { EPSILON, STATE, ACTOR, INVENTORY_ITEM_TYPE, WEAPON_TYPE, WEAPON_DAMAGE_TYPE, BULLET_TYPE } from "./constants";
import { DefaultWeapons, Defaults, ConstantsSettings } from "./settings";
import { direction_to_angle } from "./utilities";

// import components
import { AngleComponent } from "./components/angle";
import { NeighborhoodRadiusComponent } from "./components/neighborhood_radius";
import { NeighborhoodTilesComponent } from "./components/neighborhood_tiles";
import { PositionComponent,
         PreviousPositionComponent,
         TargetPositionComponent } from "./components/position";
import { VisibleQuadGridIndexComponent } from "./components/visible_quad_grid_index";
import { VisibleQuadGridNeighborhoodComponent } from "./components/visible_quad_grid_neighborhood";
import { RadiusComponent,
         RadiusSelectComponent,
         RadiusSearchComponent } from "./components/radius";
import { RotationSpeedComponent } from "./components/rotation_speed";
import { SpeedComponent } from "./components/speed";
import { StateComponent, 
         StateWalkToPointComponent,
         StateShiftComponent,
         StateCastComponent,
         StateShieldComponent,
         StateStunComponent } from "./components/state";
import { PlayerComponent,
         MonsterComponent,
         DeadComponent,
         BulletComponent } from "./components/tags";
import { TargetAngleComponent } from "./components/target_angle";
import { TilePositionComponent } from "./components/tile_position";
import { VelocityComponent } from "./components/velocity";
import { PreferredVelocityComponent } from "./components/preferred_velocity";
import { ActorTypeComponent } from "./components/actor_type"
import { NeighborhoodQuadGridIndexComponent } from "./components/neighborhood_quad_grid_index";
import { ShiftSpeedMultiplierComponent } from "./components/shift_speed";
import { ShiftDistanceComponent } from "./components/shift_distance";
import { ShiftCooldawnComponent } from "./components/shift_cooldawn";
import { MoveTagComponent } from "./components/move";
import { TargetActionComponent } from "./components/target_action";
import { AtackDistanceComponent } from "./components/atack_distance";
import { AtackTimeComponent } from "./components/atack_time";
import { AttackCooldawnComponent } from "./components/attack_cooldawn";
import { DamageDistanceComponent,
         DamageSpreadComponent,
         DamageDamageComponent,
         DamageSpeedComponent,
         DamageBulletTypeComponent,
         ShadowDamageDistanceComponent } from "./components/damage";
import { CastMeleeDamageComponent,
         CastShadowDamageComponent,
         CastRangeDamageComponent } from "./components/cast";
import { LifeComponent } from "./components/life";
import { ShieldComponent,
         ShieldIncreaseComponent } from "./components/shield";
import { ApplyDamageComponent } from "./components/apply_damage";
import { TeamComponent } from "./components/team";
import { SearchQuadGridIndexComponent } from "./components/search_quad_grid_index";
import { EnemiesListComponent } from "./components/enemies_list";
import { BehaviourComponent } from "./components/behaviour";
import { HideModeComponent } from "./components/hide_mode";
import { SpreadSearchComponent } from "./components/spread_search";
import { ShadowAttackCooldawnComponent } from "./components/shadow_attack_cooldawn";
import { ShadowAttackTimeComponent } from "./components/shadow_attack_time";
import { ShadowAttackDistanceComponent } from "./components/shadow_attack_distance";
import { WeaponDamageTypeComponent } from "./components/weapon_damage_type";
import { BulletTypeComponent } from "./components/bullet_type";
import { LifeTimerComponent } from "./components/life_timer";
import { HostComponent } from "./components/host";

import { EquipmentComponent } from "./components/inventar/equipment";
import { WeaponAttackDistanceComponent,
         WeaponAttackTimeComponent,
         WeaponAttackCooldawnComponent,
         WeaponDamageComponent,
         WeaponShieldeComponent,
         WeaponDamageSpreadComponent,
         WeaponDamageDistanceComponent,
         WeaponDamageSpeedComponent } from "./components/inventar/weapon";
import { InventarItemTypeComponent,
         InventarWeaponTypeComponent } from "./components/inventar/type";
import { InventarComponent } from "./components/inventar/inventar";

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
import { ApplyDamageSystem } from "./systems/apply_damage";
import { SearchQuadGridTrackingSystem } from "./systems/search_quad_grid_tracking";
import { SearchEnemiesSystem } from "./systems/search_enemies";
import { BehaviourSystem } from "./systems/behaviour";
import { BulletSystem } from "./systems/bullet";

import { BuffShiftCooldawnComponent,
         BuffMeleeAttackCooldawnComponent,
         BuffRangeAttackCooldawnComponent,
         BuffHandAttackCooldawnComponent,
         BuffHideCooldawnComponent,
         BuffShadowAttackCooldawnComponent,
         BuffTimerShiftCooldawnSystem,
         BuffTimerMeleeAttackCooldawnSystem,
         BuffTimerRangeAttackCooldawnSystem,
         BuffTimerHandAttackCooldawnSystem,
         BuffTimerHideCooldawnSystem,
         BuffTimerShadowAttackCooldawnSystem } from "./skills/buffs";

import { VirtualWeapon,
         VirtualWeaponEmpty,
         VirtualWeaponSword,
         VirtualWeaponBow } from "./virtuals";

import { DebugSettings, EngineSettings } from "./settings";

let level_width: f32 = 0.0;
let visible_quad_size: f32 = 0.0;

export function define_local_values(in_level_width: f32, in_visible_quad_size: f32): void {
    level_width = in_level_width;
    visible_quad_size = in_visible_quad_size;
}

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

    // assigned: player and monsters
    // read systems: -
    // write systems: -
    // comment: use this tag for exclude entities from systems
    ecs.register_component<DeadComponent>();

    // assigned: bullet (arrow or magic ball)
    // read systems: -
    // write systems: -
    // comment: tag for bullet entity
    ecs.register_component<BulletComponent>();

    // assigned: player, monsters
    // read systems: WalkToPointSystem
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
    //               SearchEnemiesSystem
    //               BehaviourSystem
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

    // assigned: bullet
    // read systems: -
    // write systems: -
    // comment: define the finall position target for the bullet
    ecs.register_component<TargetPositionComponent>();

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
    //               SearchEnemiesSystem
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
    // read systems: SearchEnemiesSystem
    // wrute system: -
    // comment: data to define the radius value for search enemies
    ecs.register_component<RadiusSearchComponent>();

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
    //               SearchEnemiesSystem
    //               BehaviourSystem
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
    //               ShiftSwitchSystem
    //               UpdateToClientSystem (to call different method to update data for player or monsters)
    //               UpdateDebugSystem
    //               StunSwitchSystem (define switch to iddle or iddle wait)
    //               SearchEnemiesSystem
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
    // BuffTimerRangeAttackCooldawnSystem
    ecs.register_component<BuffRangeAttackCooldawnComponent>();
    // BuffTimerHandAttackCooldawnSystem
    ecs.register_component<BuffHandAttackCooldawnComponent>();
    // BuffTimerHideCooldawnSystem
    ecs.register_component<BuffHideCooldawnComponent>();
    // BuffTimerShadowAttackCooldawnSystem
    ecs.register_component<BuffShadowAttackCooldawnComponent>();

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
    ecs.register_component<AttackCooldawnComponent>();
    // the same for shadow attack
    ecs.register_component<ShadowAttackCooldawnComponent>();

    // assgined: player and monsters (to each player and monster, by default the action is none)
    // read systems: WalkToPointSystem (recalculate the path to the target, if action is not none)
    //               WalkToPointSwitchSystem (when come to target we should switch the state)
    // write systems: -
    // comment: assign this component when the entity start go to the target for some action
    // for atack, for exacmple, or to interact with another actor
    ecs.register_component<TargetActionComponent>();

    // assigned: all player and monsters
    // read systems: -
    // write systems: -
    // comment: data class, store attack time properties of the character, it shold be defined by character equip
    ecs.register_component<AtackTimeComponent>();
    ecs.register_component<ShadowAttackTimeComponent>();

    // assigned: each player and monster
    // read systems: -
    // write system: -
    // comment: this parameter define the distance where the chracter start attack the enemy
    ecs.register_component<AtackDistanceComponent>();
    ecs.register_component<ShadowAttackDistanceComponent>();

    // assigned: player and monsters
    // read systems: -
    // write systems: -
    // comment: data components for damage cone
    ecs.register_component<DamageDistanceComponent>();
    ecs.register_component<DamageSpreadComponent>();
    ecs.register_component<DamageDamageComponent>();
    ecs.register_component<DamageSpeedComponent>();
    ecs.register_component<DamageBulletTypeComponent>();

    ecs.register_component<ShadowDamageDistanceComponent>();

    // assigned: player, mosnters
    // read systems: -
    // write systems: -
    // comment: data component, assign to entity when it start casting melee atack
    // contains data for post-cast process (apply damage and so on)
    ecs.register_component<CastMeleeDamageComponent>();
    // the same for shadow attack result
    ecs.register_component<CastShadowDamageComponent>();
    ecs.register_component<CastRangeDamageComponent>();

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
    // read systems: ApplyDamageSystem
    // write systems: -
    // comment: this component used for setting damage to entity
    // actual damage apply process executed in separate system in the same frame
    // after it the component is removed
    ecs.register_component<ApplyDamageComponent>();

    // assgined: every player and monster
    // read systems: SearchEnemiesSystem
    //               ApplyDamageSystem
    // write systems: -
    // comment: store the list of teams for each actor entity
    // this list allows to understand is two entities are enemies for each other or friends
    // if lsists are intersecs, then it friends, if not - then enemies
    ecs.register_component<TeamComponent>();

    // assigned: every player and monster
    // read systems: -
    // write systems: SearchQuadGridTrackingSystem
    // comments: split the space into quads to help to search enemies for each entity
    ecs.register_component<SearchQuadGridIndexComponent>();

    // assigned: monsters, driven by computer
    // read systems: BehaviourSystem
    // write systems: SearchEnemiesSystem (update the list values)
    // comment: store data about monster enemies in search radius
    ecs.register_component<EnemiesListComponent>();

    // assigned: monster, driven by computer
    // read systems: BehaviourSystem
    // write systems: BehaviourSystem
    // comment: store data required for behaviours
    ecs.register_component<BehaviourComponent>();

    // assigned: each player and monster
    // read systems: -
    // write systems: -
    // comment: indicate is player in hide mode or not
    // each actor entity contains this component, but only player can change it
    ecs.register_component<HideModeComponent>();

    // assigned: monsters
    // read systems: SearchEnemiesSystem
    // write systems: -
    // comment: data component, store value for the spread angle of the search cone
    ecs.register_component<SpreadSearchComponent>();

    // assgined: only bullets
    // read system: -
    // write systems: -
    // comment: data component, store the bullet type (arrow, fire ball or something similar)
    ecs.register_component<BulletTypeComponent>();

    // assigned: bullets
    // read_systems: -
    // write systems: -
    // comment: store bullet life time
    // it should be used in apply damage when we store cast duration (to allow block attack by the target entity)
    ecs.register_component<LifeTimerComponent>();

    // assigned: bullet
    // read systems: -
    // write systems: -
    // comment: store the host of the bullet, entity which create it
    ecs.register_component<HostComponent>();

    // assigned: only monsters
    // read systems: -
    // write systems: -
    // comment: use to identify the weapon type for mosnters
    // for player we use equipment component for these perposes
    ecs.register_component<WeaponDamageTypeComponent>();

    /*---Inventar items---*/
    ecs.register_component<WeaponAttackDistanceComponent>();
    ecs.register_component<WeaponAttackTimeComponent>();
    ecs.register_component<WeaponAttackCooldawnComponent>();
    ecs.register_component<WeaponDamageComponent>();
    ecs.register_component<WeaponShieldeComponent>();
    ecs.register_component<WeaponDamageSpreadComponent>();
    ecs.register_component<WeaponDamageDistanceComponent>();
    ecs.register_component<WeaponDamageSpeedComponent>();

    ecs.register_component<InventarItemTypeComponent>();
    ecs.register_component<InventarWeaponTypeComponent>();

    ecs.register_component<EquipmentComponent>();
    ecs.register_component<InventarComponent>();
}

export function setup_systems(ecs: ECS,
                              navmesh: Navmesh,
                              random: PseudoRandom,
                              level_width_int: i32,
                              level_height: i32,
                              tile_size: f32,
                              defaults: Defaults,
                              constants: ConstantsSettings,
                              debug_settings: DebugSettings,
                              engine_settings: EngineSettings): void {
    // reset to zero preferred velocities for all movable entities (player, monsters)
    ecs.register_system<ResetVelocitySystem>(new ResetVelocitySystem());
    ecs.set_system_with_component<ResetVelocitySystem, PreferredVelocityComponent>();
    ecs.set_system_without_component<ResetVelocitySystem, DeadComponent>();

    // calculate preferred velocity for all entites which walks to the point
    // does not move entity here
    // we need position to define is the entity jamps over current target point or not
    // if yes, increase index of the target point in the trajectory path
    ecs.register_system<WalkToPointSystem>(new WalkToPointSystem(navmesh, engine_settings.path_recalculate_time, engine_settings.path_to_target_recalculate_time));
    ecs.set_system_with_component<WalkToPointSystem, PositionComponent>();
    ecs.set_system_with_component<WalkToPointSystem, SpeedComponent>();
    ecs.set_system_with_component<WalkToPointSystem, StateWalkToPointComponent>();
    ecs.set_system_with_component<WalkToPointSystem, PreferredVelocityComponent>();
    ecs.set_system_with_component<WalkToPointSystem, TargetActionComponent>();
    ecs.set_system_without_component<WalkToPointSystem, DeadComponent>();

    // alternative to walk to point system
    // calculate the proper velocity (in fact preferred velocity) for entities in the fast shift action state
    ecs.register_system<ShiftSystem>(new ShiftSystem());
    ecs.set_system_with_component<ShiftSystem, PositionComponent>();
    ecs.set_system_with_component<ShiftSystem, StateShiftComponent>();
    ecs.set_system_with_component<ShiftSystem, SpeedComponent>();
    ecs.set_system_with_component<ShiftSystem, ShiftSpeedMultiplierComponent>();
    ecs.set_system_with_component<ShiftSystem, PreferredVelocityComponent>();
    ecs.set_system_without_component<ShiftSystem, DeadComponent>();

    ecs.register_system<ShieldSystem>(new ShieldSystem());
    ecs.set_system_with_component<ShieldSystem, StateShieldComponent>();
    ecs.set_system_without_component<ShieldSystem, DeadComponent>();

    ecs.register_system<ShieldIncreaseSystem>(new ShieldIncreaseSystem());
    ecs.set_system_with_component<ShieldIncreaseSystem, ShieldComponent>();
    ecs.set_system_with_component<ShieldIncreaseSystem, ShieldIncreaseComponent>();
    ecs.set_system_with_component<ShieldIncreaseSystem, StateComponent>();
    ecs.set_system_with_component<ShieldIncreaseSystem, UpdateToClientComponent>();  // mark entity to update when update the shield
    ecs.set_system_without_component<ShieldIncreaseSystem, StateShieldComponent>();
    ecs.set_system_without_component<ShieldIncreaseSystem, DeadComponent>();

    // calculate quad index (used for neigborhoods) from the position of the player and monsters
    // store it in the component
    // if the index is changed, then move entity index in the inner array of the system, whcich tracking all changes and store actual indices
    const neighborhood_tracking_system = ecs.register_system<NeighborhoodQuadGridTrackingSystem>(new NeighborhoodQuadGridTrackingSystem(<f32>level_width_int * tile_size, <f32>level_height * tile_size, engine_settings.neighborhood_quad_size));
    ecs.set_system_with_component<NeighborhoodQuadGridTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<NeighborhoodQuadGridTrackingSystem, NeighborhoodQuadGridIndexComponent>();
    // for dead entity we should not required update it grid index
    ecs.set_system_without_component<NeighborhoodQuadGridTrackingSystem, DeadComponent>();

    const search_tracking_system = ecs.register_system<SearchQuadGridTrackingSystem>(new SearchQuadGridTrackingSystem(<f32>level_width_int * tile_size, <f32>level_height * tile_size, engine_settings.search_quad_size));
    ecs.set_system_with_component<SearchQuadGridTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<SearchQuadGridTrackingSystem, SearchQuadGridIndexComponent>();
    // the same for search grid tracking
    ecs.set_system_without_component<SearchQuadGridTrackingSystem, DeadComponent>();

    // check is the entity comes to the target point of the path
    // if yes, switch to the iddle state (for the player) or iddle wait state (for mosnters)
    ecs.register_system<WalkToPointSwitchSystem>(new WalkToPointSwitchSystem());
    ecs.set_system_with_component<WalkToPointSwitchSystem, StateWalkToPointComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, StateComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, PreferredVelocityComponent>();
    ecs.set_system_with_component<WalkToPointSwitchSystem, TargetActionComponent>();
    ecs.set_system_without_component<WalkToPointSwitchSystem, DeadComponent>();

    // controll when the action shift is over and change the entity state to iddle
    // for player to simple iddle
    // for monster to wait iddle (and that's why we need random and iddle times)
    ecs.register_system<ShiftSwitchSystem>(new ShiftSwitchSystem());
    ecs.set_system_with_component<ShiftSwitchSystem, StateComponent>();
    ecs.set_system_with_component<ShiftSwitchSystem, StateShiftComponent>();
    ecs.set_system_with_component<ShiftSwitchSystem, ShiftCooldawnComponent>();
    ecs.set_system_with_component<ShiftSwitchSystem, ActorTypeComponent>();
    ecs.set_system_without_component<ShiftSwitchSystem, DeadComponent>();

    // tracking_system required to find closed entities to the attacker entity
    ecs.register_system<CastSwitchSystem>(new CastSwitchSystem(neighborhood_tracking_system, navmesh, constants.bullet_max_distance));
    ecs.set_system_with_component<CastSwitchSystem, StateComponent>();
    ecs.set_system_with_component<CastSwitchSystem, StateCastComponent>();
    ecs.set_system_with_component<CastSwitchSystem, ActorTypeComponent>();
    ecs.set_system_with_component<CastSwitchSystem, TargetAngleComponent>();
    ecs.set_system_with_component<CastSwitchSystem, PositionComponent>();
    ecs.set_system_without_component<CastSwitchSystem, DeadComponent>();

    ecs.register_system<StunSwitchSystem>(new StunSwitchSystem());
    ecs.set_system_with_component<StunSwitchSystem, StateComponent>();
    ecs.set_system_with_component<StunSwitchSystem, ActorTypeComponent>();
    ecs.set_system_with_component<StunSwitchSystem, StateStunComponent>();
    ecs.set_system_without_component<StunSwitchSystem, DeadComponent>();

    ecs.register_system<SearchEnemiesSystem>(new SearchEnemiesSystem(search_tracking_system, navmesh, engine_settings.search_system_chunks_count));
    ecs.set_system_with_component<SearchEnemiesSystem, PositionComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, ActorTypeComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, TeamComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, EnemiesListComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, RadiusSearchComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, SpreadSearchComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, AngleComponent>();
    ecs.set_system_with_component<SearchEnemiesSystem, StateComponent>();
    ecs.set_system_without_component<SearchEnemiesSystem, DeadComponent>();

    const monster_iddle_time = constants.monster_iddle_time;
    ecs.register_system<BehaviourSystem>(new BehaviourSystem(navmesh, random, monster_iddle_time[0], monster_iddle_time[1], constants.monster_random_walk_target_radius));
    ecs.set_system_with_component<BehaviourSystem, StateComponent>();
    ecs.set_system_with_component<BehaviourSystem, EnemiesListComponent>();
    ecs.set_system_with_component<BehaviourSystem, PositionComponent>();
    ecs.set_system_with_component<BehaviourSystem, BehaviourComponent>();
    ecs.set_system_without_component<BehaviourSystem, DeadComponent>();

    if (engine_settings.use_rvo) {
        // system for rvo algorithm
        // for player we simply copy preferred velocity to velocity
        // for monsters calculate proper velocities
        ecs.register_system<RVOSystem>(new RVOSystem(neighborhood_tracking_system, engine_settings.rvo_time_horizon));
        ecs.set_system_with_component<RVOSystem, PreferredVelocityComponent>();
        ecs.set_system_with_component<RVOSystem, VelocityComponent>();
        ecs.set_system_with_component<RVOSystem, ActorTypeComponent>();
        ecs.set_system_with_component<RVOSystem, PositionComponent>();
        ecs.set_system_with_component<RVOSystem, RadiusComponent>();
        ecs.set_system_with_component<RVOSystem, SpeedComponent>();
        ecs.set_system_with_component<RVOSystem, StateComponent>();
        ecs.set_system_without_component<RVOSystem, DeadComponent>();
    } else {
        ecs.register_system<PrefToVelocitySystem>(new PrefToVelocitySystem());
        ecs.set_system_with_component<PrefToVelocitySystem, PreferredVelocityComponent>();
        ecs.set_system_with_component<PrefToVelocitySystem, VelocityComponent>();
        ecs.set_system_without_component<PrefToVelocitySystem, DeadComponent>();
    }

    // we does not need this without active rvo
    // because velocity modified only by rvo
    // in all other cases the agents walk along navmesh path
    if (engine_settings.velocity_boundary_control) {
        ecs.register_system<PostVelocitySystem>(new PostVelocitySystem(navmesh));
        ecs.set_system_with_component<PostVelocitySystem, VelocityComponent>();
        ecs.set_system_without_component<PostVelocitySystem, BulletComponent>();  // ignore for bullets
        ecs.set_system_without_component<PostVelocitySystem, DeadComponent>();
    }

    ecs.register_system<ApplyDamageSystem>(new ApplyDamageSystem(defaults.default_stun_time));
    ecs.set_system_with_component<ApplyDamageSystem, UpdateToClientComponent>();  // if life or shield is changed, activate update
    ecs.set_system_with_component<ApplyDamageSystem, LifeComponent>();
    ecs.set_system_with_component<ApplyDamageSystem, ShieldComponent>();
    ecs.set_system_with_component<ApplyDamageSystem, StateComponent>();  // target entity can switch to another state
    ecs.set_system_with_component<ApplyDamageSystem, ApplyDamageComponent>();  // store actual damage
    ecs.set_system_with_component<ApplyDamageSystem, TargetAngleComponent>();  // to rotate entity to attacker with active shield
    ecs.set_system_with_component<ApplyDamageSystem, PositionComponent>();
    ecs.set_system_with_component<ApplyDamageSystem, TeamComponent>();
    ecs.set_system_without_component<ApplyDamageSystem, DeadComponent>();

    // move entities by using calculated velocities and curent positions
    // navmesh used for snapping to the walkable area
    // move along velocity AFTER all switches
    // because in some cases it can swith to idlle and does not require step to the point
    ecs.register_system<MoveSystem>(new MoveSystem(navmesh, engine_settings.snap_to_navmesh));
    ecs.set_system_with_component<MoveSystem, VelocityComponent>();
    ecs.set_system_with_component<MoveSystem, PositionComponent>();
    ecs.set_system_without_component<MoveSystem, StateCastComponent>();  // exclue entities under cast state
    ecs.set_system_without_component<MoveSystem, DeadComponent>();

    // calculate tile index for the current player position
    // also find new, current and old tiles
    // send external call to the client
    ecs.register_system<PositionToTileSystem>(new PositionToTileSystem(level_width_int, level_height, tile_size));
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
    ecs.set_system_without_component<MoveTrackingSystem, DeadComponent>();

    // rotate (change AngleComponent) if the target angle is different from current angle
    // the rotation can happens only when the entity is moved (MoveTagComponent is used)
    ecs.register_system<RotateSystem>(new RotateSystem());
    ecs.set_system_with_component<RotateSystem, MoveTagComponent>();  // rotate only if item is moved
    ecs.set_system_with_component<RotateSystem, AngleComponent>();
    ecs.set_system_with_component<RotateSystem, TargetAngleComponent>();
    ecs.set_system_with_component<RotateSystem, RotationSpeedComponent>();
    ecs.set_system_with_component<RotateSystem, UpdateToClientComponent>();
    ecs.set_system_with_component<RotateSystem, StateComponent>();
    ecs.set_system_without_component<RotateSystem, DeadComponent>();

    // calculate quad index from monster position
    // if index is changed, update data in the inner system variable
    const visible_tracking_system = ecs.register_system<VisibleQuadGridTrackingSystem>(new VisibleQuadGridTrackingSystem(<f32>level_width_int * tile_size, <f32>level_height * tile_size, engine_settings.visible_quad_size));
    ecs.set_system_with_component<VisibleQuadGridTrackingSystem, PositionComponent>();
    ecs.set_system_with_component<VisibleQuadGridTrackingSystem, VisibleQuadGridIndexComponent>();
    // if mosnter is dead, then it placed in the same grid cell, so, it should not be tracked
    ecs.set_system_without_component<VisibleQuadGridTrackingSystem, DeadComponent>();

    // this system track current bullet position, check collide with enemies and destroy when the bullet comes to the target
    ecs.register_system<BulletSystem>(new BulletSystem(neighborhood_tracking_system, visible_tracking_system));
    ecs.set_system_with_component<BulletSystem, BulletComponent>();
    ecs.set_system_with_component<BulletSystem, PositionComponent>();
    ecs.set_system_with_component<BulletSystem, PreviousPositionComponent>();
    ecs.set_system_with_component<BulletSystem, TargetPositionComponent>();
    ecs.set_system_with_component<BulletSystem, LifeTimerComponent>();
    ecs.set_system_with_component<BulletSystem, HostComponent>();
    ecs.set_system_with_component<BulletSystem, UpdateToClientComponent>();

    // tracking old and new monsters in the neighborhood of the player
    // call external method when the monster should be removed from the client
    // use visible_tracking_system as dependency for this system
    ecs.register_system<VisibleQuadGridNeighborhoodSystem>(new VisibleQuadGridNeighborhoodSystem(visible_tracking_system));
    ecs.set_system_with_component<VisibleQuadGridNeighborhoodSystem, PlayerComponent>();  // only for player
    ecs.set_system_with_component<VisibleQuadGridNeighborhoodSystem, PositionComponent>();
    ecs.set_system_with_component<VisibleQuadGridNeighborhoodSystem, VisibleQuadGridNeighborhoodComponent>();
    // this system should be executed every time, even if the player is dead (because some mosnter can come to the visible area)

    // system for controll the time of the buff, which we assign to the entity after fast shif action
    // with this buff the new action is not allowed
    // when the timer is over, the component deleted by this system
    ecs.register_system<BuffTimerShiftCooldawnSystem>(new BuffTimerShiftCooldawnSystem());
    ecs.set_system_with_component<BuffTimerShiftCooldawnSystem, BuffShiftCooldawnComponent>();

    // similar system to cooldawn melee atack
    ecs.register_system<BuffTimerMeleeAttackCooldawnSystem>(new BuffTimerMeleeAttackCooldawnSystem());
    ecs.set_system_with_component<BuffTimerMeleeAttackCooldawnSystem, BuffMeleeAttackCooldawnComponent>();

    ecs.register_system<BuffTimerRangeAttackCooldawnSystem>(new BuffTimerRangeAttackCooldawnSystem());
    ecs.set_system_with_component<BuffTimerRangeAttackCooldawnSystem, BuffRangeAttackCooldawnComponent>();

    ecs.register_system<BuffTimerHandAttackCooldawnSystem>(new BuffTimerHandAttackCooldawnSystem());
    ecs.set_system_with_component<BuffTimerHandAttackCooldawnSystem, BuffHandAttackCooldawnComponent>();

    // cooldawns for hide action
    ecs.register_system<BuffTimerHideCooldawnSystem>(new BuffTimerHideCooldawnSystem());
    ecs.set_system_with_component<BuffTimerHideCooldawnSystem, BuffHideCooldawnComponent>();

    ecs.register_system<BuffTimerShadowAttackCooldawnSystem>(new BuffTimerShadowAttackCooldawnSystem());
    ecs.set_system_with_component<BuffTimerShadowAttackCooldawnSystem, BuffShadowAttackCooldawnComponent>();

    // update data at client for required entities
    // send some debug data if it is active
    ecs.register_system<UpdateToClientSystem>(new UpdateToClientSystem());
    ecs.set_system_with_component<UpdateToClientSystem, ActorTypeComponent>();
    ecs.set_system_with_component<UpdateToClientSystem, UpdateToClientComponent>();
    ecs.set_system_without_component<UpdateToClientSystem, DeadComponent>();

    if (debug_settings.use_debug) {
        ecs.register_system<UpdateDebugSystem>(new UpdateDebugSystem(debug_settings, neighborhood_tracking_system, visible_tracking_system));
        ecs.set_system_with_component<UpdateDebugSystem, ActorTypeComponent>();
        ecs.set_system_with_component<UpdateDebugSystem, PositionComponent>();
        ecs.set_system_with_component<UpdateDebugSystem, StateComponent>();
        // update debug system works as for player entity and for monsters entities
        // we need it for enemies list, which exists only for mosnters, but does not exist for player
        // so, register system without this component and skip the player in it update
    }
}

export function setup_player(ecs: ECS, level: Level, 
                             pos_x: f32, pos_y: f32, angle: f32, level_width: f32, defaults: Defaults, constants: ConstantsSettings, engine: EngineSettings): Entity {
    const default_weapons = defaults.default_weapons;
    const default_player = defaults.default_player_parameters;

    const player_entity = ecs.create_entity();
    ecs.add_component<ActorTypeComponent>(player_entity, new ActorTypeComponent(ACTOR.PLAYER));
    ecs.add_component<PlayerComponent>(player_entity, new PlayerComponent());
    ecs.add_component<InventarComponent>(player_entity, new InventarComponent());  // cerate player with empty inventar and equipment
    ecs.add_component<EquipmentComponent>(player_entity, new EquipmentComponent());

    ecs.add_component<StateComponent>(player_entity, new StateComponent());
    ecs.add_component<PreferredVelocityComponent>(player_entity, new PreferredVelocityComponent());
    ecs.add_component<VelocityComponent>(player_entity, new VelocityComponent());
    ecs.add_component<PositionComponent>(player_entity, new PositionComponent(pos_x, pos_y));
    ecs.add_component<PreviousPositionComponent>(player_entity, new PreviousPositionComponent(pos_x, pos_y));  // set the same position
    ecs.add_component<RadiusComponent>(player_entity, new RadiusComponent(default_player.radius));
    ecs.add_component<RadiusSelectComponent>(player_entity, new RadiusSelectComponent(default_player.radius + constants.radius_select_delta));  // use slightly bigger select radius
    ecs.add_component<RotationSpeedComponent>(player_entity, new RotationSpeedComponent(default_player.rotation_speed));
    ecs.add_component<AngleComponent>(player_entity, new AngleComponent(angle));
    ecs.add_component<TargetAngleComponent>(player_entity, new TargetAngleComponent(angle));  // set the same target angle at the start
    ecs.add_component<NeighborhoodTilesComponent>(player_entity, new NeighborhoodTilesComponent(level));
    ecs.add_component<NeighborhoodRadiusComponent>(player_entity, new NeighborhoodRadiusComponent(engine.tiles_visible_radius));
    ecs.add_component<TilePositionComponent>(player_entity, new TilePositionComponent());
    ecs.add_component<MoveTagComponent>(player_entity, new MoveTagComponent());
    ecs.add_component<VisibleQuadGridNeighborhoodComponent>(player_entity, new VisibleQuadGridNeighborhoodComponent());
    ecs.add_component<UpdateToClientComponent>(player_entity, new UpdateToClientComponent());
    ecs.add_component<NeighborhoodQuadGridIndexComponent>(player_entity, new NeighborhoodQuadGridIndexComponent(level_width, engine.neighborhood_quad_size));
    ecs.add_component<TeamComponent>(player_entity, new TeamComponent(default_player.default_team));
    ecs.add_component<SearchQuadGridIndexComponent>(player_entity, new SearchQuadGridIndexComponent(level_width, engine.search_quad_size));
    ecs.add_component<HideModeComponent>(player_entity, new HideModeComponent(default_player.hide_speed_multiplier, default_player.hide_cooldawn, default_player.hide_activate_time));
    ecs.add_component<TargetActionComponent>(player_entity, new TargetActionComponent());

    // standart parameters, which should not change
    ecs.add_component<SpeedComponent>(player_entity, new SpeedComponent(default_player.speed));
    ecs.add_component<ShieldIncreaseComponent>(player_entity, new ShieldIncreaseComponent(default_player.shield_resurrect));

    // parameters, defined by the equip
    // when create player we use default weapons (with empty equipment), then we will update these parameters
    // shift
    ecs.add_component<ShiftSpeedMultiplierComponent>(player_entity, new ShiftSpeedMultiplierComponent(default_player.shift_speed_multiplier));
    ecs.add_component<ShiftDistanceComponent>(player_entity, new ShiftDistanceComponent(default_player.shift_distance));
    ecs.add_component<ShiftCooldawnComponent>(player_entity, new ShiftCooldawnComponent(default_player.shift_cooldawn));

    // life and shield
    ecs.add_component<LifeComponent>(player_entity, new LifeComponent(default_player.life));
    ecs.add_component<ShieldComponent>(player_entity, new ShieldComponent(Infinity));

    // attack
    // values for these components defined by weapons
    // and used for actions
    ecs.add_component<AtackTimeComponent>(player_entity, new AtackTimeComponent(default_weapons.empty_weapon_attack_time));
    ecs.add_component<AtackDistanceComponent>(player_entity, new AtackDistanceComponent(default_weapons.empty_weapon_attack_distance));
    ecs.add_component<AttackCooldawnComponent>(player_entity, new AttackCooldawnComponent(default_weapons.empty_weapon_attack_cooldawn));

    // components for empty weapon
    ecs.add_component<DamageDamageComponent>(player_entity, new DamageDamageComponent(default_weapons.empty_weapon_damage));
    // here we define only damage distance component, because empty weapon does not contains spread paramater
    // but it contains damage distance parameter
    ecs.add_component<DamageDistanceComponent>(player_entity, new DamageDistanceComponent(default_weapons.empty_weapon_damage_distance));
    
    // in shadow mode use separate constants
    ecs.add_component<ShadowAttackCooldawnComponent>(player_entity, new ShadowAttackCooldawnComponent(default_weapons.shadow_attack_cooldawn));
    ecs.add_component<ShadowAttackTimeComponent>(player_entity, new ShadowAttackTimeComponent(default_weapons.shadow_attack_time));
    ecs.add_component<ShadowAttackDistanceComponent>(player_entity, new ShadowAttackDistanceComponent(default_weapons.shadow_attack_distance));
    ecs.add_component<ShadowDamageDistanceComponent>(player_entity, new ShadowDamageDistanceComponent(default_weapons.shadow_damage_distance));
    
    return player_entity;
}

export function setup_monster(ecs: ECS, level_width: f32, 
                              pos_x: f32, pos_y: f32, angle: f32, speed: f32, radius: f32, life: u32,
                              team: i32, search_radius: f32, search_spread: f32,
                              weapon: VirtualWeapon, defaults: Defaults, constants: ConstantsSettings, engine: EngineSettings): Entity {
    const default_monster = defaults.default_monster_parameters;
    const default_weapons = defaults.default_weapons;

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
    ecs.add_component<RadiusComponent>(monster_entity, new RadiusComponent(radius));
    ecs.add_component<RadiusSelectComponent>(monster_entity, new RadiusSelectComponent(radius + constants.radius_select_delta));  // use slightly bigger select radius
    ecs.add_component<RotationSpeedComponent>(monster_entity, new RotationSpeedComponent(default_monster.rotation_speed));
    ecs.add_component<AngleComponent>(monster_entity, new AngleComponent(angle));
    ecs.add_component<TargetAngleComponent>(monster_entity, new TargetAngleComponent(angle));
    ecs.add_component<MoveTagComponent>(monster_entity, new MoveTagComponent());
    ecs.add_component<VisibleQuadGridIndexComponent>(monster_entity, new VisibleQuadGridIndexComponent(level_width, engine.visible_quad_size));
    ecs.add_component<UpdateToClientComponent>(monster_entity, new UpdateToClientComponent());
    ecs.add_component<NeighborhoodQuadGridIndexComponent>(monster_entity, new NeighborhoodQuadGridIndexComponent(level_width, engine.neighborhood_quad_size));
    ecs.add_component<TargetActionComponent>(monster_entity, new TargetActionComponent());
    ecs.add_component<TeamComponent>(monster_entity, new TeamComponent(team));
    ecs.add_component<SearchQuadGridIndexComponent>(monster_entity, new SearchQuadGridIndexComponent(level_width, engine.search_quad_size));
    ecs.add_component<EnemiesListComponent>(monster_entity, new EnemiesListComponent());
    ecs.add_component<RadiusSearchComponent>(monster_entity, new RadiusSearchComponent(search_radius));
    ecs.add_component<SpreadSearchComponent>(monster_entity, new SpreadSearchComponent(search_spread));
    ecs.add_component<BehaviourComponent>(monster_entity, new BehaviourComponent());
    ecs.add_component<HideModeComponent>(monster_entity, new HideModeComponent(default_monster.hide_speed_multiplier, default_monster.hide_cooldawn, default_monster.hide_activate_time));

    ecs.add_component<SpeedComponent>(monster_entity, new SpeedComponent(speed));
    ecs.add_component<ShieldIncreaseComponent>(monster_entity, new ShieldIncreaseComponent(default_monster.shield_resurrect));

    ecs.add_component<LifeComponent>(monster_entity, new LifeComponent(life));

    // define weapon
    ecs.add_component<ShieldComponent>(monster_entity, new ShieldComponent(weapon.shield()));

    // attack
    ecs.add_component<AtackTimeComponent>(monster_entity, new AtackTimeComponent(weapon.attack_time()));
    ecs.add_component<AtackDistanceComponent>(monster_entity, new AtackDistanceComponent(weapon.attack_distance()));
    ecs.add_component<AttackCooldawnComponent>(monster_entity, new AttackCooldawnComponent(weapon.attack_cooldawn()));

    // damage
    ecs.add_component<DamageDamageComponent>(monster_entity, new DamageDamageComponent(weapon.damage()));
    // but other parameters can be defined with respect to input virtual weapon
    // all components for damage we store on the entity
    const weapon_type = weapon.type();
    if (weapon_type == WEAPON_TYPE.UNKNOWN) {
        const weapon_hands = weapon as VirtualWeaponEmpty;

        ecs.add_component<DamageDistanceComponent>(monster_entity, new DamageDistanceComponent(weapon_hands.damage_distance()));

        ecs.add_component<WeaponDamageTypeComponent>(monster_entity, new WeaponDamageTypeComponent(WEAPON_DAMAGE_TYPE.EMPTY));
    } else if (weapon_type == WEAPON_TYPE.SWORD) {
        const weapon_sword = weapon as VirtualWeaponSword;

        ecs.add_component<DamageDistanceComponent>(monster_entity, new DamageDistanceComponent(weapon_sword.damage_distance()));
        ecs.add_component<DamageSpreadComponent>(monster_entity, new DamageSpreadComponent(weapon_sword.damage_spread()));

        ecs.add_component<WeaponDamageTypeComponent>(monster_entity, new WeaponDamageTypeComponent(WEAPON_DAMAGE_TYPE.MELEE));
    } else if (weapon_type == WEAPON_TYPE.BOW) {
        const weapon_bow = weapon as VirtualWeaponBow;

        ecs.add_component<DamageSpeedComponent>(monster_entity, new DamageSpeedComponent(weapon_bow.bullet_speed()));
        ecs.add_component<DamageBulletTypeComponent>(monster_entity, new DamageBulletTypeComponent(BULLET_TYPE.ARROW));
        ecs.add_component<WeaponDamageTypeComponent>(monster_entity, new WeaponDamageTypeComponent(WEAPON_DAMAGE_TYPE.RANGE));
    }
    

    // shadow
    // use the same defaults as player
    ecs.add_component<ShadowAttackCooldawnComponent>(monster_entity, new ShadowAttackCooldawnComponent(default_weapons.shadow_attack_cooldawn));
    ecs.add_component<ShadowAttackTimeComponent>(monster_entity, new ShadowAttackTimeComponent(default_weapons.shadow_attack_time));
    ecs.add_component<ShadowAttackDistanceComponent>(monster_entity, new ShadowAttackDistanceComponent(default_weapons.shadow_attack_distance));
    ecs.add_component<ShadowDamageDistanceComponent>(monster_entity, new ShadowDamageDistanceComponent(default_weapons.shadow_damage_distance));

    return monster_entity;
}

export function setup_bullet(ecs: ECS,
                             bullet_type: BULLET_TYPE, host: Entity,
                             pos_x: f32, pos_y: f32, target_x: f32, target_y: f32, speed: f32, damage: u32): Entity {
    const bullet = ecs.create_entity();

    // calculate velocity
    // at first get direction
    let to_x = target_x - pos_x;
    let to_y = target_y - pos_y;
    const length = Mathf.sqrt(to_x * to_x + to_y * to_y);
    if (length > EPSILON) {
        to_x /= length;
        to_y /= length;
    }
    const angle = direction_to_angle(to_x, to_y);
    // create velocity component
    const velocity = new VelocityComponent(to_x * speed, to_y * speed);

    ecs.add_component<BulletComponent>(bullet, new BulletComponent());
    ecs.add_component<ActorTypeComponent>(bullet, new ActorTypeComponent(ACTOR.BULLET));
    ecs.add_component<HostComponent>(bullet, new HostComponent(host));
    ecs.add_component<BulletTypeComponent>(bullet, new BulletTypeComponent(bullet_type));
    ecs.add_component<PositionComponent>(bullet, new PositionComponent(pos_x, pos_y));
    ecs.add_component<PreviousPositionComponent>(bullet, new PreviousPositionComponent(pos_x, pos_y));
    ecs.add_component<TargetPositionComponent>(bullet, new TargetPositionComponent(target_x, target_y));
    ecs.add_component<LifeTimerComponent>(bullet, new LifeTimerComponent(0.0));
    ecs.add_component<VelocityComponent>(bullet, velocity);
    ecs.add_component<AngleComponent>(bullet, new AngleComponent(angle));
    ecs.add_component<DamageDamageComponent>(bullet, new DamageDamageComponent(damage));  // this value obtained from initial weapon
    ecs.add_component<VisibleQuadGridIndexComponent>(bullet, new VisibleQuadGridIndexComponent(level_width, visible_quad_size));  // for visibility controll
    ecs.add_component<UpdateToClientComponent>(bullet, new UpdateToClientComponent());

    return bullet;
}

export function setup_weapon_sword(ecs: ECS,
                                   attack_distance: f32, attack_time: f32, attack_cooldawn: f32, damage: u32, shield: f32,
                                   damage_spread: f32, damage_distance: f32): Entity {
    const weapon_entity = ecs.create_entity();
    ecs.add_component(weapon_entity, new WeaponAttackDistanceComponent(attack_distance));
    ecs.add_component(weapon_entity, new WeaponAttackTimeComponent(attack_time));
    ecs.add_component(weapon_entity, new WeaponAttackCooldawnComponent(attack_cooldawn));
    ecs.add_component(weapon_entity, new WeaponDamageComponent(damage));
    ecs.add_component(weapon_entity, new WeaponShieldeComponent(shield));

    ecs.add_component(weapon_entity, new WeaponDamageSpreadComponent(damage_spread));
    ecs.add_component(weapon_entity, new WeaponDamageDistanceComponent(damage_distance));

    ecs.add_component(weapon_entity, new InventarItemTypeComponent(INVENTORY_ITEM_TYPE.WEAPON));
    ecs.add_component(weapon_entity, new InventarWeaponTypeComponent(WEAPON_TYPE.SWORD));

    return weapon_entity;
}

export function setup_weapon_bow(ecs: ECS,
                                 attack_distance: f32, attack_time: f32, attack_cooldawn: f32, damage: u32, shield: f32, speed: f32): Entity {
    const weapon_entity = ecs.create_entity();
    ecs.add_component(weapon_entity, new WeaponAttackDistanceComponent(attack_distance));
    ecs.add_component(weapon_entity, new WeaponAttackTimeComponent(attack_time));
    ecs.add_component(weapon_entity, new WeaponAttackCooldawnComponent(attack_cooldawn));
    ecs.add_component(weapon_entity, new WeaponDamageComponent(damage));
    ecs.add_component(weapon_entity, new WeaponShieldeComponent(shield));

    ecs.add_component(weapon_entity, new WeaponDamageSpeedComponent(speed));

    ecs.add_component(weapon_entity, new InventarItemTypeComponent(INVENTORY_ITEM_TYPE.WEAPON));
    ecs.add_component(weapon_entity, new InventarWeaponTypeComponent(WEAPON_TYPE.BOW));

    return weapon_entity;
}
