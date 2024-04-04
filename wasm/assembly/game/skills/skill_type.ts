import { SKILL } from "../constants";

export class SkillTypeComponent {
    private m_type: SKILL;
    constructor(in_type: SKILL) {
        this.m_type = in_type;
    }

    type(): SKILL {
        return this.m_type;
    }
}