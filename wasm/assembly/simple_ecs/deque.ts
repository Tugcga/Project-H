export class DequeEntry<T> {
    next: DequeEntry<T> | null = null;
    prev: DequeEntry<T> | null = null;
    constructor(readonly elem: T) {}
}

export class Deque<T> {
    protected _head: DequeEntry<T> | null = null;
    protected _tail: DequeEntry<T> | null = null;
    protected _length: i32 = 0;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    pushBack(elem: T): void {
        const entry = new DequeEntry<T>(elem);
        if (!this._tail) {
            this._head = this._tail = entry;
        } else {
            this._tail!.next = entry;
            entry.prev = this._tail;
            this._tail = entry;
        }
        ++this._length;
    }

    pushFront(elem: T): void {
        const entry = new DequeEntry<T>(elem);
        if (!this._tail) {
            this._head = this._tail = entry;
        } else {
            this._head!.prev = entry;
            entry.next = this._head;
            this._head = entry;
        }
        ++this._length;
    }

    popBack(): T {
        assert(!this.isEmpty(), "popBack empty queue");
        const entry = this._tail;
        this._tail = this._tail!.prev;
        if (this._length > 1) {
            this._tail!.next = null;
        }
        --this._length;
        return entry!.elem;
    }

    popFront(): T {
        assert(!this.isEmpty(), "popFront empty queue");
        const entry = this._head;
        this._head = this._head!.next;
        if (this._length > 1) {
            this._head!.prev = null;
        }
        --this._length;
        return entry!.elem;
    }

    peekBack(): T {
        assert(!this.isEmpty(), "peekBack empty queue");
        return this._tail!.elem;
    }

    peekFront(): T {
        assert(!this.isEmpty(), "peekFront empty queue");
        return this._head!.elem;
    }

    contains(elem: T): bool {
        let cur: DequeEntry<T> | null = this._head;
        while (cur !== null) {
            if (cur.elem == elem) {
                return true;
            }
            cur = cur.next;
        }

        return false;
    }

    @inline
    get length(): i32 {
        return this._length;
    }

    @inline
    get size(): i32 {
        return this._length;
    }

    @inline
    isEmpty(): bool {
        return this._length == 0;
    }

    map<U>(f: (elem: T) => U): Deque<U> {
        const q = new Deque<U>();
        let cur: DequeEntry<T> | null = this._head;
        while (cur !== null) {
            q.pushBack(f(cur.elem));
            cur = cur.next;
        }
        return q;
    }

    forEach(f: (elem: T) => void): void {
        let cur: DequeEntry<T> | null = this._head;
        while (cur !== null) {
            f(cur.elem);
            cur = cur.next;
        }
    }

    toArray(): Array<T> {
        const arr = new Array<T>(this._length);
        let cur: DequeEntry<T> | null = this._head;
        for (let i = 0, len = this._length; i < len; i++) {
            arr[i] = cur!.elem;
            cur = cur!.next;
        }
        return arr;
    }

    @inline
    values(): Array<T> {
        return this.toArray();
    }

    @inline
    clear(): void {
        this._head = null;
        this._tail = null;
        this._length = 0;
    }

    toStaticArray(): StaticArray<T> {
        const arr = new StaticArray<T>(this._length);
        let cur: DequeEntry<T> | null = this._head;
        for (let i = 0, len = this._length; i < len; i++) {
            arr[i] = cur!.elem;
            cur = cur!.next;
        }
        return arr;
    }
}
