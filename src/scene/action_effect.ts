import { ACTION_EFFECT } from "../constants";

export class ActionEffect {
    // key - entity id
    // value - array of effects over this entity
    private m_effects: Map<number, Array<ActionEffectBase>> = new Map<number, Array<ActionEffectBase>>();

    add_melee_attack(entity: number, time: number, distance: number, spread: number) {
        if (!this.m_effects.has(entity)) {
            this.m_effects.set(entity, new Array<ActionEffectBase>());
        }

        const effects = this.m_effects.get(entity);
        if (effects) {
            effects.push(new MeleeAttackActionEffect(time, ACTION_EFFECT.MELEE_ATTACK, distance, spread));
        }
    }

    remove_melee_attack(entity: number) {
        const effects = this.m_effects.get(entity);
        // select all effects of the current entity
        if (effects) {
            let i = effects.length - 1;
            while (i >= 0) {
                const effect = effects[i];
                // remove all effects which are melee attack
                if (effect.type() == ACTION_EFFECT.MELEE_ATTACK) {
                    effects.splice(i, 1);
                }
                i--;
            }
        }
    }

    update(dt: number) {
        for (const [entity, effects] of this.m_effects) {
            let i = effects.length - 1;
            while (i >= 0) {
                const effect = effects[i];
                const is_active = effect.update(dt);
                if (!is_active) {
                    effects.splice(i, 1);
                }
                i--;
            }
        }
    }

    get_entity_effects(entity: number): Array<ActionEffectBase> {
        const effects = this.m_effects.get(entity);
        if (effects) {
            return effects;
        } else {
            return [];
        }
    }
}

export class ActionEffectBase {
    private m_total_time: number;
    private m_spend_time: number
    private m_type: ACTION_EFFECT;

    constructor(in_total_time: number,
                in_type: ACTION_EFFECT) {
        this.m_total_time = in_total_time;
        this.m_spend_time = 0.0;
        this.m_type = in_type;
    }

    // return true if effect is active, false if it should be erased
    update(dt: number): boolean {
        this.m_spend_time += dt;

        if (this.m_total_time <= this.m_spend_time) {
            return false;
        }

        return true;
    }

    type(): ACTION_EFFECT {
        return this.m_type;
    }

    proportion(): number {
        return this.m_spend_time / this.m_total_time;
    }
}

export class MeleeAttackActionEffect extends ActionEffectBase {
    private m_distance: number;
    private m_spread: number;

    constructor(in_total_time: number,
                in_type: ACTION_EFFECT,
                in_distance: number,
                in_spread: number) {
        super(in_total_time, in_type);

        this.m_distance = in_distance;
        this.m_spread = in_spread;
    }

    distance(): number {
        return this.m_distance;
    }

    spread(): number {
        return this.m_spread;
    }
}