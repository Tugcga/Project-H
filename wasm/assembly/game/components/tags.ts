import { OneBooleanComponent } from "./one_value";

// player tag
export class PlayerComponent { }

// moster tag
export class MonsterComponent { }

export class MoveTagComponent extends OneBooleanComponent {
    
    toString(): string {
        return this.m_value ? "move" : "not move";
    }
}