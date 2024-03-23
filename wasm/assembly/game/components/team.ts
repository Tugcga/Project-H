import { List } from "../../pathfinder/common/list";
import { is_ordered_list_contains } from "../utilities";

export class TeamComponent {
    private m_team: i32;  // main team value
    private m_friend_tems: List<i32>;  // friend teams
    // entities from the same team always are friends
    // but also friends can be extended by using the second list
    // this list contains friend teams for CURRENT entity

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

    is_friend(in_team: i32): bool {
        if (in_team == this.m_team) {
            return true;
        }

        // check is in_team in the ordered list of friend teams
        const local_friends = this.m_friend_tems;
        const local_friends_length = local_friends.length;
        if (local_friends_length == 0) {
            return false;
        }
        return is_ordered_list_contains<i32>(local_friends, in_team);
    }

    reduce(in_team: i32): void {
        this.m_friend_tems.pop_value(in_team);
    }

    toString(): string {
        return `<${this.m_team}: ${this.m_friend_tems}>`;
    }
}