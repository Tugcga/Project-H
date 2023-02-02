import { MAX_COMPONENTS, Sign } from "./types";

export class Signature {
    private m_values: Array<Sign> = new Array<Sign>(MAX_COMPONENTS);

    constructor(value: Sign = Sign.SIGN_ANY) {
        for(let i: u32 = 0; i < MAX_COMPONENTS; i++) {
            this.m_values[i] = value;
        }
    }

    reset(): void {
        for(let i: u32 = 0; i < MAX_COMPONENTS; i++) {
            this.m_values[i] = Sign.SIGN_ANY;
        }
    }

    private set(index: u32, value: Sign = Sign.SIGN_ALLOW): void {
        this.m_values[index] = value;
    }

    allow(index: u32): void {
        this.set(index, Sign.SIGN_ALLOW);
    }

    deny(index: u32): void {
        this.set(index, Sign.SIGN_DENY);
    }

    get(index: u32): Sign {
        return this.m_values[index];
    }

    // call for system signature and check entity signature
    is_accept(other: Signature): bool {
        for(let i: u32 = 0; i < MAX_COMPONENTS; i++) {
            const system_sign = this.m_values[i];
            const entity_sign = other.get(i);
            if(!(system_sign == Sign.SIGN_ANY || system_sign == entity_sign)) {
                return false;
            }
        }
        return true;
    }

    /*and(right: Signature): Signature {
        const result = new Signature();
        for(let i: u32 = 0; i < MAX_COMPONENTS; i++) {
            result.set(i, this.m_values[i] && right.m_values[i]);
        }

        return result;
    }

    or(other: Signature): Signature {
        const result = new Signature();
        for(let i: u32 = 0; i < MAX_COMPONENTS; i++) {
            result.set(i, this.m_values[i] || other.m_values[i]);
        }

        return result;
    }

    @operator("==") private static __equal(left: Signature, right: Signature): bool {
        for(let i: u32 = 0; i < MAX_COMPONENTS; i++) {
            if(left.m_values[i] != right.m_values[i]) {
                return false;
            }
        }

        return true;
    }*/

    toString(): string {
        return this.m_values.toString();
    }
}