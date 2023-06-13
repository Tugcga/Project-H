export class OneFloatComponent {
    private m_value: f32 = 0.0;

    constructor(in_value: f32) {
        this.m_value = in_value;
    }

    @inline
    value(): f32 {
        return this.m_value;
    }

    set_value(in_value: f32): void {
        this.m_value = in_value;
    }

    toString(): string {
        return this.m_value.toString();
    }
}

export class OneIntComponent {
    private m_value: i32 = -1;

    @inline
    set_value(in_value: i32): void {
        this.m_value = in_value;
    }

    @inline
    value(): i32 {
        return this.m_value;
    }

    toString(): string {
        return this.m_value.toString();
    }
}

export class OneBooleanComponent {
    private m_value: boolean = false;

    @inline
    set_value(in_value: boolean): void {
        this.m_value = in_value;
    }

    @inline
    value(): boolean {
        return this.m_value;
    }

    toString(): string {
        return this.m_value.toString();
    }
}

export class TwoFloatsComponent {
    private m_x: f32 = 0.0;
    private m_y: f32 = 0.0;

    constructor(in_x: f32 = 0.0, in_y: f32 = 0.0) {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    @inline
    x(): f32 {
        return this.m_x;
    }

    @inline
    y(): f32 {
        return this.m_y;
    }

    length(): f32 {
        const x = this.m_x;
        const y = this.m_y;
        return Mathf.sqrt(x*x + y*y);
    }

    @inline
    set(in_x: f32, in_y: f32): void {
        this.m_x = in_x;
        this.m_y = in_y;
    }

    toString(): string {
        return `(${this.m_x}, ${this.m_y})`;
    }
}