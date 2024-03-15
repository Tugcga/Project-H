export class LifeComponent {
    private m_life: u32;
    private m_max_life: u32;

    constructor(in_life: u32) {
        this.m_life = in_life;
        this.m_max_life = in_life;
    }

    life(): u32 {
        return this.m_life;
    }

    max_life(): u32 {
        return this.m_max_life
    }

    damage(in_damage: u32): void {
        if (this.m_life <= in_damage) {
            this.m_life = 0;
        } else {
            this.m_life -= in_damage;
        }
    }

    heal(in_value: u32): void {
        this.m_life += in_value;
        if (this.m_life > this.m_max_life) {
            this.m_life = this.m_max_life;
        }
    }

    toString(): str {
        return `{${this.m_life}/${this.m_max_life}}`;
    }
}