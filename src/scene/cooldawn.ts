import { COOLDAWN } from "../constants"

// one class to control cooldawns of all entities in the scene
export class Cooldawn {
    // key - entity id
    // values - map from cooldawn type to the pair (total time, elapsed time)
    private m_cooldawns: Map<number, Map<COOLDAWN, [number, number]>> = new Map<number, Map<COOLDAWN, [number, number]>>();

    add_entity(id: number) {
        this.m_cooldawns.set(id, new Map<COOLDAWN, [number, number]>);
    }

    remove_entity(id: number) {
        this.m_cooldawns.delete(id);
    }

    start_cooldawn(entity: number, cooldawn_id: COOLDAWN, total_time: number) {
        this.m_cooldawns.get(entity)?.set(cooldawn_id, [total_time, 0.0]);
    }

    update(dt: number) {
        //console.log(this.m_cooldawns.size, this.m_cooldawns);
        this.m_cooldawns.forEach((c_map: Map<COOLDAWN, [number, number]>, entity: number) => {
            c_map.forEach((times: [number, number], id: COOLDAWN) => {
                times[1] += dt;
                if (times[1] >= times[0]) {
                    c_map.delete(id);
                }
            });
        });
    }

    get_cooldawns(in_entity: number): Map<COOLDAWN, [number, number]> {
        const to_return = this.m_cooldawns.get(in_entity);
        if (to_return) {
            return to_return;
        }
        return new Map<COOLDAWN, [number, number]>();
    }
}