import { STATE, CAST_ACTION } from "../constants";

export class StateComponent {
    private m_state: STATE = STATE.IDDLE;

    set_state(in_state: STATE): void {
        this.m_state = in_state;
    }

    state(): STATE {
        return this.m_state;
    }

    toString(): string {
        if (this.m_state == STATE.IDDLE) {
            return "iddle";
        } else if (this.m_state == STATE.IDDLE_WAIT) {
            return "iddle wait";
        } else if (this.m_state == STATE.WALK_TO_POINT) {
            return "walk to point";
        } else if (this.m_state == STATE.SHIFTING) {
            return "faset shifting";
        } else if (this.m_state == STATE.CASTING) {
            return "casting";
        } else if (this.m_state == STATE.STAN) {
            return "stanning";
        } else if (this.m_state == STATE.SHIELD) {
            return "shield";
        } else if (this.m_state == STATE.TALK) {
            return "talk";
        } else {
            return "unknown";
        }
    }
}

export class StateIddleWaitComponent {
    private m_wait_time: f32 = 0.0;  // how many times we should hold this state
    private m_current_time: f32 = 0.0;  // how many time we already hold this state

    constructor(in_wait: f32 = 1.0) {
        this.m_wait_time = in_wait;
    }

    is_over(): bool {
        return this.m_current_time > this.m_wait_time;
    }

    increase_time(dt: f32): void {
        this.m_current_time += dt;
    }

    reset(in_time: f32): void {
        this.m_wait_time = in_time;
        this.m_current_time = 0.0;
    }

    toString(): string {
        return `state[${this.m_wait_time}:${this.m_current_time}]`;
    }
}

// store path in the navmesh and current target index point
export class StateWalkToPointComponent {
    private m_path_points: StaticArray<f32> = new StaticArray<f32>(0);
    private m_target_index: i32 = 0;
    private m_points_count: i32 = 0;
    private m_is_active: bool = false;

    // contorl path update
    private m_spend_time: f32 = 0.0;

    @inline
    active(): bool {
        return this.m_is_active;
    }

    @inline
    target_point_index(): i32 {
        return this.m_target_index;
    }

    @inline
    path_points_count(): i32 {
        return this.m_points_count;
    }

    @inline
    target_x(): f32 {
        return this.m_path_points[3 * this.m_target_index];
    }

    @inline
    target_y(): f32 {
        return this.m_path_points[3 * this.m_target_index + 2];
    }

    path_points(): StaticArray<f32> {
        return this.m_path_points;
    }

    @inline
    increate_target_index(): void {
        this.m_target_index += 1;
        if (this.m_target_index >= this.m_points_count) {
            this.deactivate();
        }
    }

    get_spend_time(): f32 {
        return this.m_spend_time;
    }

    increase_spend_time(dt: f32): void {
        this.m_spend_time += dt;
    }

    define_path(in_path: StaticArray<f32>): boolean {
        if (in_path.length > 0) {
            this.m_path_points = in_path;
            this.m_is_active = true;

            this.m_target_index = 1;  // first index in the path is start point
            this.m_points_count = in_path.length / 3;  // each point in the path contains 3 coordinates

            this.m_spend_time = 0.0;

            return true;
        }
        return false;
    }

    deactivate(): void {
        this.m_is_active = false;
        this.m_target_index = 0;
        this.m_points_count = 0;
    }
}

// data for state - fast shift
// it should store only target point, which calculated by shift distance
export class StateShiftComponent {
    private m_target_x: f32;
    private m_target_y: f32;
    private m_active: bool;

    constructor(in_target_x: f32, in_target_y: f32) {
        this.m_target_x = in_target_x;
        this.m_target_y = in_target_y;
        this.m_active = true;
    }

    target_x(): f32 { return this.m_target_x; }
    target_y(): f32 { return this.m_target_y; }
    active(): bool { return this.m_active; }

    deactivate(): void { this.m_active = false; }
}

// this component assigned when the entity start casting some action
// atack (malee or range), use item, use skill or something similar
// actual data for cast result shold be stored in separate component
// the type allows to identify required component
export class StateCastComponent {
    private m_type: CAST_ACTION;
    private m_time_length: f32;
    private m_time_spend: f32;
    private m_active: bool;

    constructor(in_type: CAST_ACTION, in_time: f32) {
        this.m_type = in_type;
        this.m_time_length = in_time;
        this.m_time_spend = 0.0;
        this.m_active = true;
    }

    type(): CAST_ACTION {
        return this.m_type;
    }

    increase(dt: f32): void {
        this.m_time_spend += dt;

        if (this.m_time_spend >= this.m_time_length) {
            this.m_active = false;
        }
    }

    active(): bool {
        return this.m_active;
    }
}

export class StateShieldComponent {
    private m_time: f32;

    constructor() {
        this.m_time = 0.0;
    }

    increase_time(dt: f32): void {
        this.m_time += dt;
    }

    time(): f32 {
        return this.m_time;
    }
}
