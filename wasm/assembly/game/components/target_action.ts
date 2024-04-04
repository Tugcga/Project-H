import { Entity } from "../../simple_ecs/types";
import { SKILL, TARGET_ACTION, TARGET_ACTION_TYPE } from "../constants";

// assign this component to the entity when it start to move to the target for atack
// may be this component can be used for other interactions with actors
export class TargetActionComponent {
    private m_target_entity: Entity;
    private m_target_position_x: f32;
    private m_target_position_y: f32;
    private m_target_type: TARGET_ACTION_TYPE;
    private m_target_action: TARGET_ACTION;
    private m_target_skill: SKILL;

    constructor() {
        this.m_target_entity = 0;
        this.m_target_action = TARGET_ACTION.NONE;
        this.m_target_type = TARGET_ACTION_TYPE.NONE;
        this.m_target_position_x = 0.0;
        this.m_target_position_y = 0.0;
    }

    reset(): void {
        this.m_target_entity = 0;
        this.m_target_action = TARGET_ACTION.NONE;
        this.m_target_type = TARGET_ACTION_TYPE.NONE;
        this.m_target_skill = SKILL.NONE;
    }

    set_target_entity(entity: Entity, type: TARGET_ACTION): void {
        this.m_target_entity = entity;
        this.m_target_action = type;
        this.m_target_type = TARGET_ACTION_TYPE.ENTITY;
    }

    set_target_position(pos_x: f32, pos_y: f32, type: TARGET_ACTION): void {
        this.m_target_position_x = pos_x;
        this.m_target_position_y = pos_y;
        this.m_target_action = type;
        this.m_target_type = TARGET_ACTION_TYPE.POSITION;
    }

    set_target_skill(skill: SKILL): void {
        this.m_target_skill = skill;
    }

    position_x(): f32 { return this.m_target_position_x; }
    position_y(): f32 { return this.m_target_position_y; }

    entity(): Entity {
        return this.m_target_entity;
    }

    type(): TARGET_ACTION {
        return this.m_target_action;
    }

    point_type(): TARGET_ACTION_TYPE {
        return this.m_target_type;
    }

    skill(): SKILL {
        return this.m_target_skill;
    }

    toString(): str {
        return `target ${this.m_target_entity.toString()} action ${this.m_target_action}`;
    }
}