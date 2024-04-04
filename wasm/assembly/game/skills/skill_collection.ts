import { Entity } from "../../simple_ecs/types";
import { List } from "../../pathfinder/common/list";

import { SKILL } from "../constants";

// store available sklld for person entity
// store as three arrays: skill type, skill entity (from the scene) and the level
export class SkillCollectionComponent {
    private m_types: List<SKILL>;
    private m_entities: List<Entity>;
    private m_levels: List<u32>;

    constructor() {
        const count = 4;
        this.m_types = new List<SKILL>(count);
        this.m_entities = new List<Entity>(count);
        this.m_levels = new List<u32>(count);
    }

    private _get_skill_index(skill: SKILL): i32 {
        const local_types = this.m_types;
        for (let i = 0, len = local_types.length; i < len; i++) {
            if (local_types[i] == skill) {
                return i;
            }
        }
        return -1;
    }

    has_skill(type: SKILL): bool {
        return this._get_skill_index(type) != -1;
    }

    skill_entity(type: SKILL): Entity {
        const index = this._get_skill_index(type);
        if (index >= 0) {
            return this.m_entities[index];
        } else {
            // this is wrong
            return 0;
        }
    }

    skill_level(type: SKILL): u32 {
        const index = this._get_skill_index(type);
        if (index >= 0) {
            return this.m_levels[index];
        } else {
            return 0;
        }
    }

    add_skill(type: SKILL, entity: Entity): void {
        const index = this._get_skill_index(type);
        if (index == -1) {
            this.m_types.push(type);
            this.m_entities.push(entity);
            this.m_levels.push(1);
        }
    }

    // level++
    incerease_level(skill: SKILL): void {
        const index = this._get_skill_index(skill);
        if (index >= 0) {
            this.m_levels[index] += 1;
        }
    }

    set_level(type: SKILL, in_level: u32): void {
        const index = this._get_skill_index(skill);
        if (index >= 0) {
            this.m_levels[index] = in_level;
        }
    }
}