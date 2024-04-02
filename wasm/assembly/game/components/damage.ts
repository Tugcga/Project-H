import { BULLET_TYPE } from "../constants";

import { OneFloatComponent, OneUIntComponent } from "./one_value";

export class DamageDistanceComponent extends OneFloatComponent { }

export class DamageSpreadComponent extends OneFloatComponent { }

export class DamageDamageComponent extends OneUIntComponent { }

// used for bow
export class DamageSpeedComponent extends OneFloatComponent { }
export class DamageBulletTypeComponent {
    private m_bullet_type: BULLET_TYPE;

    constructor(in_type: BULLET_TYPE) {
        this.m_bullet_type = in_type;
    }

    type(): BULLET_TYPE { return this.m_bullet_type; }
}

export class ShadowDamageDistanceComponent extends OneFloatComponent { }