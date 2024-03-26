export class HideModeComponent {
    private m_active: bool;
    private m_hide_speed_multiplier: f32;
    private m_hide_cooldawn: f32;
    private m_activate_time: f32;

    constructor(in_hide_speed_multiplier: f32,
                in_hide_cooldawn: f32,
                in_activate_time: f32) {
        this.m_active = false;
        this.m_hide_speed_multiplier = in_hide_speed_multiplier;
        this.m_hide_cooldawn = in_hide_cooldawn;
        this.m_activate_time = in_activate_time;
    }

    cooldawn(): f32 {
        return this.m_hide_cooldawn;
    }

    activate_time(): f32 {
        return this.m_activate_time;
    }

    speed_multiplier(): f32 {
        return this.m_hide_speed_multiplier;
    }

    is_active(): bool {
        return this.m_active;
    }

    activate(): void {
        this.m_active = true;
    }

    deactivate(): void {
        this.m_active = false;
    }

    toString(): string {
        return this.m_active ? "hide" : "unhide";
    }
}