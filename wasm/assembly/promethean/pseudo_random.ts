
export class PseudoRandom{
    m_state: u32;
    m_max: f64 = 4294967295.0;

    constructor(seed: u32 = 1, start_shifts: u32 = 5) {
        // make start shift of the seed
        for(let i:u32 = 0; i < start_shifts; i++) {
            seed = this._shift(seed);
        }
        this.m_state = seed;
    }

    @inline
    private _shift(x: u32): u32 {
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;

        return x;
    }

    next_u(): u32 {
        var x = this.m_state;
        x = this._shift(x);

        this.m_state = x;
        return x;
    }

    next_float(min: f64, max: f64): f64 {
        const vu = this.next_u();
        const v = <f64>vu / this.m_max;

        return (max - min) * v + <f64>min;
    }

    next(in_min: i32, in_max: i32): i32{
        const v: f64 = this.next_float(0.0, 1.0);
        return <i32>(<f64>(in_max - in_min) * v + <f64>in_min + 0.5);
    }

    /*next(in_min: i32, in_max: i32): i32{
        const v: f64 = Math.random();
        return <i32>(<f64>(in_max - in_min) * v + <f64>in_min + 0.5);
    }*/

    next_odd(in_min: i32, in_max: i32): i32{
        const next_value: i32 = this.next(in_min, in_max);

        if(next_value % 2 != 0){
            return next_value;
        }
        else{
            if(next_value < in_max){
                return next_value + 1;
            }
            else{
                return next_value - 1;
            }
        }
    }
}
