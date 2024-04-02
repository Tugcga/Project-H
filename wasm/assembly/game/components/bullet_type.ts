import { BULLET_TYPE } from "../constants";

export class BulletTypeComponent {
    private m_type: BULLET_TYPE;

    constructor(in_type: BULLET_TYPE) {
        this.m_type = in_type;
    }

    type(): BULLET_TYPE { return this.m_type; }
}