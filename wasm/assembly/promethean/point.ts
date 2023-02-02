
export class Point{
    private m_x: i32;
    private m_y: i32;

    constructor(x: i32 = 0, y: i32 = 0){
        this.m_x = x;
        this.m_y = y;
    }

    @inline
    x(): i32{
        return this.m_x;
    }

    @inline
    y(): i32{
        return this.m_y;
    }

    @inline
    equal(other: Point): bool{
        return this.m_x == other.x() && this.m_y == other.y();
    }

    toString(): string{
        return "[" + this.m_x.toString() + "." + this.m_y.toString() + "]";
    }

    get_hash_code(): i32{
        let value: i32 = 17;
        value = value * 23 + this.m_x;
        value = value * 23 + this.m_y;
        return value;
    }
}
