import { Entity } from "../../simple_ecs/types";

import { List } from "../../pathfinder/common/list";

import { get_index_in_ordered_list } from "../utilities";

export class EnemiesListComponent {
    private m_targets: List<Entity>;  // keep this list sorted

    constructor() {
        this.m_targets = new List<Entity>(10);
    }

    to_static_array(): StaticArray<u32> {
        return this.m_targets.to_static();
    }

    get_list(): List<Entity> {
        return this.m_targets;
    }

    extend(other_list: List<Entity>): void {
        for (let i = 0, len = other_list.length; i < len; i++) {
            this.add_target(other_list[i]);
        }
    }

    add_target(entity: Entity): void {
        const local_targets = this.m_targets;
        const entity_index = get_index_in_ordered_list(local_targets, entity);

        // if value already in the list, nothing to do
        if (entity_index == -1) {
            const targets_count = local_targets.length;
        
            let index = 0;
            while (index < targets_count) {
                const index_value = local_targets[index];
                if (index_value < entity) {
                    index++;
                } else {
                    break;
                }
            }

            if (index == targets_count) {
                // all values in the array is less than input entity
                // so, just add values at the end of the array
                local_targets.push(entity);
            } else {
                // index is the pointer to value which is greater than input entity
                // we should shift all values to the right
                local_targets.push(entity);
                for (let i = targets_count - 1; i >= index; i--) {
                    const temp = local_targets[i];
                    local_targets[i] = local_targets[i + 1];
                    local_targets[i + 1] = temp;
                }
            }

        }
    }

    remove_target(entity: Entity): void {
        const local_targets = this.m_targets;
        const entity_index = get_index_in_ordered_list(local_targets, entity);
        if (entity_index != -1) {
            local_targets.pop(entity_index);
        }
    }

    toString(): string {
        return this.m_targets.toString()
    }
}