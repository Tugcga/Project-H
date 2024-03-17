import { OneFloatComponent } from "./one_value";

export class ShieldComponent {
    private m_shield: f32;
    private m_max_shield: f32;
    private m_is_over: bool;  // activate when shield is zero
    private m_is_full: bool;  // activate when the shield is full

    constructor(in_shield: f32) {
        this.m_shield = in_shield;
        this.m_max_shield = in_shield;
        this.m_is_over = false;
        this.m_is_full = true;
    }

    // return true if we change the shield value
    update(in_value: f32): bool {
        const is_full = this.m_is_full;
        this.m_shield += in_value;
        if (this.m_shield >= this.m_max_shield) {
            this.m_shield = this.m_max_shield;
            this.m_is_full = true;
        }
        this.m_is_over = false;

        return !is_full;
    }

    damage(in_value: f32): void {
        this.m_shield -= in_value;
        if (this.m_shield <= 0.0) {
            this.m_shield = 0.0;
            this.m_is_over = true;
        }
        this.m_is_full = false;
    }

    is_over(): bool {
        return this.m_is_over;
    }

    shield(): f32 {
        return this.m_shield;
    }

    max_shield(): f32 {
        return this.m_max_shield;
    }

    toString(): string {
        return `[${this.m_shield}/${this.m_max_shield}]`;
    }
}

export class ShieldIncreaseComponent extends OneFloatComponent { }