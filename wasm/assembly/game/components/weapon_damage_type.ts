import { WEAPON_DAMAGE_TYPE } from "../constants";

// this component used only for monsters
// it define the type of the weapon
export class WeaponDamageTypeComponent {
    private m_damage_type: WEAPON_DAMAGE_TYPE;

    constructor(in_type: WEAPON_DAMAGE_TYPE) {
        this.m_damage_type = in_type;
    }

    type(): WEAPON_DAMAGE_TYPE {
        return this.m_damage_type;
    }
}