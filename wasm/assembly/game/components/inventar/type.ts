import { INVENTORY_ITEM_TYPE, WEAPON_TYPE } from "../../constants";

export class InventarItemTypeComponent {
    private m_type: INVENTORY_ITEM_TYPE;

    constructor(type: INVENTORY_ITEM_TYPE) {
        this.m_type = type;
    }

    type(): INVENTORY_ITEM_TYPE {
        return this.m_type;
    }
}

export class InventarWeaponTypeComponent {
    private m_type: WEAPON_TYPE;

    constructor(type: WEAPON_TYPE) {
        this.m_type = type;
    }

    type(): WEAPON_TYPE {
        return this.m_type;
    }
}