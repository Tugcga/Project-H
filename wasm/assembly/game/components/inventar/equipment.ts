import { Entity } from "../../../simple_ecs/types";

export class EquipmentComponent {
    private m_main_weapon: Entity;
    private m_main_weapon_mark: bool;  // set true when equip the item

    private m_secondary_weapon: Entity;
    private m_secondary_weapon_mark: bool;

    constructor() {
        this.m_main_weapon = 0;
        this.m_main_weapon_mark = false;
        this.m_secondary_weapon = 0;
        this.m_secondary_weapon_mark = false;
    }

    equip_main_weapon(entiy: Entity): void {
        this.m_main_weapon = entiy;
        this.m_main_weapon_mark = true;
    }

    is_main_weapon(): bool {
        return this.m_main_weapon_mark;
    }

    is_secondary_weapon(): bool {
        return this.m_secondary_weapon_mark;
    }

    remove_main_weapon(): Entity {
        this.m_main_weapon_mark = false;
        return this.m_main_weapon;
    }

    remove_secondary_weapon(): Entity {
        this.m_secondary_weapon_mark = false;
        return this.m_secondary_weapon;
    }

    get_main_weapon(): Entity {
        return this.m_main_weapon;
    }

    get_secondary_weapon(): Entity {
        return this.m_secondary_weapon;
    }
}