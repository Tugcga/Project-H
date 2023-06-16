import { MOVE_STATUS } from "../constants";

export class MoveTagComponent {
    private m_status: MOVE_STATUS = MOVE_STATUS.NONE;

    set_none(): void {
        this.m_status = MOVE_STATUS.NONE;
    }

    set_walk(): void {
        this.m_status = MOVE_STATUS.WALK;
    }

    set_shift(): void {
        this.m_status = MOVE_STATUS.SHIFT;
    }

    status(): MOVE_STATUS {
        return this.m_status;
    }
}