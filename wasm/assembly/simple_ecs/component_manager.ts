import { Entity, MAX_ENTITIES, ComponentType } from "./types";

abstract class IComponentArray {
    abstract entity_destroyed(entity: Entity): void;
}

class ComponentArray<T> extends IComponentArray {
    private m_component_array: StaticArray<T> = new StaticArray<T>(MAX_ENTITIES);
    private m_entity_to_index_map: Map<Entity, u32> = new Map<Entity, u32>();
    private m_index_to_entity_map: Map<u32, Entity> = new Map<u32, Entity>();
    private m_size: u32 = 0;

    private m_name: string;

    constructor(in_name: string) {
        super();
        this.m_name = in_name;
    }

    insert_data(entity: Entity, component: T): void {
        assert(!this.m_entity_to_index_map.has(entity), "Component " + this.m_name + " added to same entity more than once");

        const new_index: u32 = this.m_size;
        this.m_entity_to_index_map.set(entity, new_index);
        this.m_index_to_entity_map.set(new_index, entity);
        this.m_component_array[new_index] = component;

        this.m_size++;
    }

    remove_data(entity: Entity): void {
        assert(this.m_entity_to_index_map.has(entity), "Removing non-existent component " + this.m_name);

        const index_of_removed_entity: u32 = this.m_entity_to_index_map.get(entity);
        const index_of_last_element: u32 = this.m_size - 1;
        this.m_component_array[index_of_removed_entity] = this.m_component_array[index_of_last_element];

        const entity_of_last_element: Entity = this.m_index_to_entity_map.get(index_of_last_element);
        this.m_entity_to_index_map.set(entity_of_last_element, index_of_removed_entity);
        this.m_index_to_entity_map.set(index_of_removed_entity, entity_of_last_element);

        this.m_entity_to_index_map.delete(entity);
        this.m_index_to_entity_map.delete(index_of_last_element);

        this.m_size--;
    }

    get_data(entity: Entity): T | null {
        if(this.m_entity_to_index_map.has(entity)) {
            return this.m_component_array[this.m_entity_to_index_map.get(entity)];
        } else {
            return null;
        }
    }

    entity_destroyed(entity: Entity): void {
        if(this.m_entity_to_index_map.has(entity)) {
            this.remove_data(entity);
        }
    }
}

export class ComponentManager {
    m_component_types: Map<string, ComponentType> = new Map<string, ComponentType>();
    m_component_arrays: Map<string, IComponentArray> = new Map<string, IComponentArray>();
    m_next_component_type: ComponentType = 0;

    register_component<T>(): void {
        const type_name: string = nameof<T>();

        assert(!this.m_component_types.has(type_name), "Registering component type more than once");

        this.m_component_types.set(type_name, this.m_next_component_type);
        this.m_component_arrays.set(type_name, new ComponentArray<T>(type_name));
        this.m_next_component_type++;
    }

    get_component_type<T>(): ComponentType {
        const type_name: string = nameof<T>();

        assert(this.m_component_types.has(type_name), "Component not registered before use");

        return this.m_component_types.get(type_name);
    }

    add_component<T>(entity: Entity, component: T): void {
        this.get_component_array<T>().insert_data(entity, component);
    }

    remove_component<T>(entity: Entity): void {
        this.get_component_array<T>().remove_data(entity);
    }

    get_component<T>(entity: Entity) : T | null {
        return this.get_component_array<T>().get_data(entity);
    }

    entity_destroyed(entity: Entity): void {
        const keys: Array<string> = this.m_component_arrays.keys();
        for(let i = 0, len = keys.length; i < len; i++) {
            const component: IComponentArray = this.m_component_arrays.get(keys[i]);
            component.entity_destroyed(entity);
        }
    }

    private get_component_array<T>(): ComponentArray<T> {
        const type_name: string = nameof<T>();

        assert(this.m_component_types.has(type_name), "Component not registered before use");
        
        return this.m_component_arrays.get(type_name) as ComponentArray<T>;
    }
}