## What is it

This is small prototype of the web-game. In fact it is not a game, but something like techno-demo. The main idea is to use [AssemblyScript](https://www.assemblyscript.org/) for creating the core of a game and leave the graphics and all other outputs outside of this core. So, the main part of the game compiled into one single wasm module. The interaction part of the game, written on [TypeScript](https://www.typescriptlang.org/) use this core module to obtain game state and output it to the screen.

The main principles are the following. The main file of the Wasm module is ```game_api.ts```. It exports the following functions:
* ```create_settings()``` Return pointer to the object with settings of the game. These settings can be default or tweaked byt the following function:
    * ```settings_set_seed(settings: Settings, seed: u32)``` Set specific seed of the preudo random number generator. This generator used for generating the level.
    * ```settings_set_generate(settings: Settings, level_size: u32, room_min_size: u32, room_max_size: u32, rooms_count: u32)``` Define parameters of the procedural level.
    * ```settings_set_neighborhood_quad_size(settings: Settings, in_size: f32)``` Define the size of the grid quiad for finding neighborhood entities (it use psacial grdi decomposition)
    * ```settings_set_rvo_time_horizon(settings: Settings, in_time: f32)``` Define one specific parameter (so-called ```time horizon```) for RVO algorithm.
    * ```settings_set_use_debug(settings: Settings, in_use_debug: boolean)``` Activate debug output.
    * ```settings_set_debug_flags(settings: Settings, in_show_path: boolean, in_show_closest: boolean)``` Define data type for the debug.
* ```create_game(settings: Settings)``` Create game instance. It required settings object.
* ```game_update(game: Game, dt: f32)``` Update internal game states, ```dt``` is delta time.
* ```game_client_point(game: Game, in_x: f32, in_y: f32)``` Set coordinates of the destination point for the player.
* ```game_add_monsters(game: Game)``` Add several entities to the random room.

All interactions between wasm module and host can use only these functions. The data from the module to the host transfers by using several exteranl functions, which implemented in the base class of the client.

The host does not contains any game logic. It simply gets game data from the wasm module, recognize it and output to the screen items in different positions and states.

## How to build

**Step 1.** Build wasm module.

```
cd .\wasm\

npm run release
```

This will create ```game_api.wasm``` and ```game_api.js``` files in the ```wasm\build\ ``` directory, and also copy it to the distributive folder ```/dist/build/```.

**Step 2.** Bundle the application by using Parcel:

```
cd ..

npm run build
```

This will create ```build``` directory inside ```dist``` directory with minimized ```module.js```.

## How to play

You can try to play [here](https://tugcga.github.io/games/ProjectH/index.html)

When the application is running, it starts from generating the level. It can takes several seconds. After that it will output to the browser console the following data:

* Used seed for level generation
* Total generation time

Game controls:

* Click LMB (left mouse button) to set the destination point for the player
* ```m``` key in the keyboard to toggle the visibility of the level map
* ```+``` and ```-``` with active map for scale up and down
* ```s``` key in the keyboard to add some movable items to the random room
* ```Esc``` to pause the game

The player can only move over the level and see other movable items. These items also can only move to randomly selected positions.

There is a statistics at the top of the window:

* How many movable items in the level
* How many movable items in the neighborhood of the player
* The average fps. It updates every two seconds

![image](./assets/screen_01.png)

## Remarks

The wasm module based on the following side-projects:
* [AS Simple ECS](https://github.com/Tugcga/as_simple_ecs) as entity-component-system framework
* [Dungeons](https://github.com/Tugcga/Dungeons/tree/main/assemblyscript/promethean) for generating the level
* [Path Finder](https://github.com/Tugcga/Path-Finder/tree/main/assemblyscript) for baking navigation mesh of the level and use it for compute paths

May be the wasm module should be rewritten into [Rust](https://www.rust-lang.org/), at least to compare AssemplyScript module vs Rust module for the performance and compiled size.

For now the graphical front-end based on simple browser 2d-canvas without any addons and extensions. It's possible (and it's planned) to add the other front-end based on [Playcanvas](https://playcanvas.com/) for creating 3d-version of the game without any changes of the core wasm module.