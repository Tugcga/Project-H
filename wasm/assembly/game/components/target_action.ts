import { Entity } from "../../simple_ecs/types";
import { TARGET_ACTION } from "../constants";

// assign this component to the entity when it start to move to the target for atack
// may be this component can be used for other interactions with actors
export class TargetActionComponent {
    private m_target_entity: Entity;
    private m_target_action: TARGET_ACTION;

    constructor(target_entity: Entity, target_action: TARGET_ACTION) {
        this.m_target_entity = target_entity;
        this.m_target_action = target_action;
    }
    reset(): void {
        this.m_target_entity = 0;
        this.m_target_action = TARGET_ACTION.NONE;
    }

    set_target(entity: Entity, type: TARGET_ACTION): void {
        this.m_target_entity = entity;
        this.m_target_action = type;
    }

    entity(): Entity {
        return this.m_target_entity;
    }

    type(): TARGET_ACTION {
        return this.m_target_action;
    }

    toString(): str {
        return `target ${this.m_target_entity.toString()} action ${this.m_target_action}`;
    }
}