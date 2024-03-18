import { List } from "../../pathfinder/common/list";

export class TeamComponent {
    private m_team: i32;  // main team value
    private m_friend_tems: List<i32>;  // friend temas

    constructor(in_team: i32, in_friends: Array<i32> = []) {
        this.m_friend_tems = List.from_array<i32>(in_friends);
        this.m_friend_tems.sort();

        this.m_team = in_team;
    }

    team(): i32 {
        return this.m_team;
    }

    extend(in_team: i32): void {
        if (!this.m_friend_tems.is_contains(in_team)) {
            this.m_friend_tems.push(in_team);
            this.m_friend_tems.sort();
        }
    }

    reduce(in_team: i32): void {
        this.m_friend_tems.pop_value(in_team);
    }

    toString(): string {
        return `<${this.m_team}: ${this.m_friend_tems}>`;
    }
}