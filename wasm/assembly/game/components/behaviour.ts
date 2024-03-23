// store data needed for monster behaviour
export class BehaviourComponent {
    private m_iddle_wait_active: bool = false;
    private m_iddle_wait_timer: f32;
    private m_iddle_wait_time_length: f32;

    activate_iddle_wait(in_length: f32): void {
        this.m_iddle_wait_time_length = in_length;
        this.m_iddle_wait_timer = 0.0;
        this.m_iddle_wait_active = true;
    }

    // return true if after update the time is over
    // true in other cases
    update_iddle_wait(dt: f32): bool {
        this.m_iddle_wait_timer += dt;
        if (this.m_iddle_wait_timer > this.m_iddle_wait_time_length) {
            this.m_iddle_wait_active = false;
            return false;
        }

        return true;
    }

    iddle_wait_active(): bool {
        return this.m_iddle_wait_active;
    }
}