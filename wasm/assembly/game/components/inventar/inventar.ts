import { Entity } from "../../../simple_ecs/types";
import { List } from "../../../pathfinder/common/list";

export class InventarComponent {
    // for simplicity store inventar as a plain list of items, not a 2d-grid
    private m_items: List<Entity>;

    constructor() {
        const items = new List<Entity>();

        this.m_items = items;
    }

    add_item(entity: Entity): void {
        this.m_items.push(entity);
    }

    remove_item(entity: Entity): Entity {
        return this.m_items.pop_value(entity);
    }

    all_items(): List<Entity> {
        return this.m_items;
    }
}