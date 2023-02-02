import { add_monster, create_game, game_update, get_game_data, get_game_settings } from "../wasm/build/game_api";
import { Scene } from "./scene";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
var is_mouse_press: boolean = false;
var mouse_event: MouseEvent | null = null;

function click_coordinates(canvas: HTMLCanvasElement, mouse_event: MouseEvent): number[] {
    const canvas_rect = canvas.getBoundingClientRect()
    return [mouse_event.clientX - canvas_rect.left, mouse_event.clientY - canvas_rect.top];
}

if(canvas) {
    const ctx = canvas.getContext("2d")!;

    // global variables
    var current_time: number = performance.now();

    // start the game in the server side
    const seed = Math.floor(Math.random() * 4294967295);
    //const seed = 2616276912;
    console.log("use seed " + seed);
    create_game(seed);
    console.log("generate level time:", (performance.now() - current_time) / 1000.0, "seconds");

    // disable start screen
    var loading = document.getElementById("loading");
    if(loading) {
        loading.hidden = true;
    }

    // get common game settings
    var game_settings: ArrayLike<number> = get_game_settings();

    // create scene
    // and use obtained game settings
    var scene: Scene = new Scene(ctx, canvas.width, canvas.height, game_settings);

    canvas.addEventListener("mousedown", function(event) {
        mouse_event = event;
        is_mouse_press = true;

        const c = click_coordinates(canvas, mouse_event);
        scene.click_position(c[0], c[1], true);
    });

    canvas.addEventListener("mouseup", function(event) {
        is_mouse_press = false;
        scene.reset_click();
    });

    document.onmousemove = function(event) {
        mouse_event = event;
    }

    // press the keyboard button
    document.onkeydown = function(event) {
        const key = event.key;
        if(key == "s") {
            add_monster();
        } else {
            scene.press_key(key);
        }
    }

    // start game loop
    update();

    function update() {
        // at first we send interactions
        if(is_mouse_press && mouse_event && canvas) {
            const c = click_coordinates(canvas, mouse_event);
            scene.click_position(c[0], c[1]);
        }

        const time = performance.now();
        const delta_time = (time - current_time) / 1000.0;
        current_time = time;
        game_update(delta_time);

        // get current game state
        var game_state = get_game_data();
        
        // update the scene
        scene.update(game_state, delta_time);

        window.requestAnimationFrame(update);
    }
}