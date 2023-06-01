// where the entity with spatial position is in tile
export class TilePositionComponent {
    private m_x: i32 = -100;
    private m_y: i32 = -100;

    x(): i32 {
        return this.m_x;
    }

    y(): i32 {
        return this.m_y;
    }

    set_x(in_x: i32): void {
        this.m_x = in_x;
    }

    set_y(in_y: i32): void {
        this.m_y = in_y;
    }

    toString(): string {
        return `(${this.x}, ${this.y})`;
    }
}