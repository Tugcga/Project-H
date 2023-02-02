import { Entity, MAX_ENTITIES, Sign } from "./types";
import { Signature } from "./signature";
import { Deque } from "./deque";

export class EntityManager {
    private m_available_entities: Deque<Entity> = new Deque<Entity>();
    private m_signatures: StaticArray<Signature> = new StaticArray<Signature>(MAX_ENTITIES);
    private m_living_entity_count: u32 = 0;

    constructor() {
        for(let entity: Entity = 0; entity < MAX_ENTITIES; entity++) {
            this.m_available_entities.pushBack(entity);

            // for entities we create empty signature with all denies
            // for systems - all any
            this.m_signatures[entity] = new Signature(Sign.SIGN_DENY);
        }
    }

    create_entity(): Entity {
        assert(this.m_living_entity_count < MAX_ENTITIES, "Too many entities in existence");

        let id: Entity = this.m_available_entities.popFront();
        this.m_living_entity_count++;

        return id;
    }

    destroy_entity(entity: Entity): void {
        assert(entity < MAX_ENTITIES, "Entity out of range");

        this.m_signatures[entity].reset();

        this.m_available_entities.pushBack(entity);
        this.m_living_entity_count--;
    }

    set_signature(entity: Entity, signature: Signature): void {
        assert(entity < MAX_ENTITIES, "Entity out of range");

        this.m_signatures[entity] = signature;
    }

    get_signature(entity: Entity): Signature {
        assert(entity < MAX_ENTITIES, "Entity out of range");

        return this.m_signatures[entity];
    }
}