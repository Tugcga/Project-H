import { List } from "../../pathfinder/common/list"; 
import { Entity } from "../../simple_ecs/types";

// store here items in the neighborhood of the player in quad grid
// and also items to delete in the current frame
export class VisibleQuadGridNeighborhoodComponent {
    private m_current: List<Entity> = new List<Entity>();
    private m_to_delete: List<Entity> = new List<Entity>();
    private m_to_create: List<Entity> = new List<Entity>();

    // we call this method every frame from visible quad grid neighborhood system (for the player)
    set_entities(in_array: List<Entity>): void {
        // we should sort in_array, then check difference with current, build to_delete and assign current array
        in_array.sort();

        const to_delete = this.m_to_delete;
        const to_create = this.m_to_create;
        const current = this.m_current;

        to_delete.reset();
        to_create.reset();

        var i: i32 = 0;  // counter of the current
        const current_count = current.length;
        const in_count = in_array.length;
        for (let j = 0; j < in_count; j++) {
            const in_value = in_array.get(j);
            while (i < current_count && current.get(i) < in_value) {
                to_delete.push(current.get(i));
                i += 1;
            }
            if (i < current_count) {
                if (current.get(i) == in_value) {
                    i += 1;
                } else {
                    // this is new value
                    to_create.push(in_value);
                }
            } else {
                // the current array is over, all values from in_array are new
                to_create.push(in_value);
            }
        }

        // add all other values form the current array to delete
        while (i < current_count) {
            to_delete.push(current.get(i));
            i += 1;
        }

        current.copy_from(in_array);
    }

    @inline
    current(): List<Entity> {
        return this.m_current;
    }

    @inline
    to_delete(): List<Entity> {
        return this.m_to_delete;
    }

    @inline
    to_create(): List<Entity> {
        return this.m_to_create;
    }

    toString(): string {
        return `[${this.m_current}]>[${this.m_to_create}|${this.m_to_delete}]`;
    }
}