import { EFFECT } from "../constants";

export class EffectsCollection {
    // key - entity id
    // value - array of effects over this entity
    private m_effects: Map<number, Array<EffectBase>> = new Map<number, Array<EffectBase>>();

    private add_effect(id: number, effect: EffectBase) {
        if (!this.m_effects.has(id)) {
            this.m_effects.set(id, new Array<EffectBase>());
        }

        const effects = this.m_effects.get(id);
        if (effects) {
            effects.push(effect);
        }
    }

    private remove_by_type(id: number, type: EFFECT) {
        const effects = this.m_effects.get(id);
        // select all effects of the current entity
        if (effects) {
            let i = effects.length - 1;
            while (i >= 0) {
                const effect = effects[i];
                // remove all effects which are melee attack
                if (effect.type() == type) {
                    effects.splice(i, 1);
                }
                i--;
            }
        }
    }

    add_melee_attack(entity: number, time: number, distance: number, spread: number) {
        this.add_effect(entity, new MeleeAttackEffect(time, distance, spread));
    }

    add_range_attack(entity: number, time: number) {
        this.add_effect(entity, new RangeAttackEffect(time));
    }

    add_hand_attack(entity: number, time: number, distance: number) {
        this.add_effect(entity, new HandAttackEffect(time, distance));
    }

    add_shadow_attack(entity: number, time: number, distance: number) {
        this.add_effect(entity, new ShadowAttackEffect(time, distance));
    }

    add_stun(entity: number, duration: number) {
        this.add_effect(entity, new StunEffect(duration));
    }

    add_hide_cast(entity: number, duration: number) {
        this.add_effect(entity, new HideActivationEffect(duration));
    }

    remove_melee_attack(entity: number) {
        this.remove_by_type(entity, EFFECT.MELEE_ATTACK);
    }

    remove_range_attack(entity: number) {
        this.remove_by_type(entity, EFFECT.RANGE_ATTACK);
    }

    remove_hand_attack(entity: number) {
        this.remove_by_type(entity, EFFECT.HAND_ATTACK);
    }

    remove_shadow_attack(entity: number) {
        this.remove_by_type(entity, EFFECT.SHADOW_ATTACK);
    }

    remove_stun(entity: number) {
        this.remove_by_type(entity, EFFECT.STUN);
    }

    remove_hide_cast(entity: number) {
        this.remove_by_type(entity, EFFECT.HIDE_ACTIVATION);
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

    get_entity_effects(entity: number): Array<EffectBase> {
        const effects = this.m_effects.get(entity);
        if (effects) {
            return effects;
        } else {
            return [];
        }
    }
}

export class EffectBase {
    private m_total_time: number;
    private m_spend_time: number
    private m_type: EFFECT;

    constructor(in_total_time: number,
                in_type: EFFECT) {
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

    type(): EFFECT {
        return this.m_type;
    }

    proportion(): number {
        return this.m_spend_time / this.m_total_time;
    }
}

export class MeleeAttackEffect extends EffectBase {
    private m_distance: number;
    private m_spread: number;

    constructor(in_total_time: number,
                in_distance: number,
                in_spread: number) {
        super(in_total_time, EFFECT.MELEE_ATTACK);

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

export class RangeAttackEffect extends EffectBase {

    constructor(in_total_time: number) {
        super(in_total_time, EFFECT.RANGE_ATTACK);
    }
}

export class HandAttackEffect extends EffectBase {
    private m_distance: number;

    constructor(in_total_time: number,
                in_distance: number) {
        super(in_total_time, EFFECT.HAND_ATTACK);

        this.m_distance = in_distance;
    }

    distance(): number {
        return this.m_distance;
    }
}

export class ShadowAttackEffect extends EffectBase {
    private m_distance: number;

    constructor(in_total_time: number,
                in_distance: number) {
        super(in_total_time, EFFECT.SHADOW_ATTACK);

        this.m_distance = in_distance;
    }

    distance(): number {
        return this.m_distance;
    }
}

export class StunEffect extends EffectBase {
    constructor(duration: number) {
        super(duration, EFFECT.STUN);
    }
}

export class HideActivationEffect extends EffectBase {
    constructor(duration: number) {
        super(duration, EFFECT.HIDE_ACTIVATION);
    }
}