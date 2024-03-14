class BuffCooldawn {
    private m_cooldawn_time: f32;
    private m_spend_time: f32;

    constructor(in_cooldawn: f32) {
        this.m_cooldawn_time = in_cooldawn;
        this.m_spend_time = 0.0;
    }

    increase_time(dt: f32): void {
        this.m_spend_time += dt;
    }

    is_over(): bool {
        if (this.m_spend_time >= this.m_cooldawn_time) {
            return true;
        }

        return false;
    }
}

export class BuffShiftCooldawnComponent extends BuffCooldawn {}

export class BuffMeleeAttackCooldawnComponent extends BuffCooldawn {}