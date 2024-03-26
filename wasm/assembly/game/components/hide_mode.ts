export class HideModeComponent {
    private m_active: bool;
    private m_hide_speed_multiplier: f32;

    constructor(in_hide_speed_multiplier: f32) {
        this.m_active = false;
        this.m_hide_speed_multiplier = in_hide_speed_multiplier;
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