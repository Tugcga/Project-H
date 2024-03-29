import { ComponentManager } from "./component_manager";
import { EntityManager } from "./entity_manager";
import { SystemManager } from "./system_manager";
import { Entity, ComponentType, Sign } from "./types";
import { Signature } from "./signature";

export class ECS {
    private m_component_manager: ComponentManager = new ComponentManager();
    private m_entity_manager: EntityManager = new EntityManager();
    private m_system_manager: SystemManager = new SystemManager();

    // entities
    create_entity(): Entity {
        return this.m_entity_manager.create_entity();
    }

    destroy_entity(entity: Entity): void {
        this.m_entity_manager.destroy_entity(entity);
        this.m_component_manager.entity_destroyed(entity);
        this.m_system_manager.entity_destroyed(entity);
    }

    // components
    register_component<T>(): void {
        this.m_component_manager.register_component<T>();
    }

    add_component<T>(entity: Entity, component: T): void {
        this.m_component_manager.add_component<T>(entity, component);

        const signature: Signature = this.m_entity_manager.get_signature(entity);
        signature.allow(this.m_component_manager.get_component_type<T>());
        this.m_entity_manager.set_signature(entity, signature);

        this.m_system_manager.entity_signature_changed(entity, signature);
    }

    remove_component<T>(entity: Entity): void {
        this.m_component_manager.remove_component<T>(entity);

        const signature: Signature = this.m_entity_manager.get_signature(entity);
        signature.deny(this.m_component_manager.get_component_type<T>());
        this.m_entity_manager.set_signature(entity, signature);

        this.m_system_manager.entity_signature_changed(entity, signature);
    }

    has_component<T>(entity: Entity): bool {
        const component = this.get_component<T>(entity);
        return component != null;
    }

    get_component<T>(entity: Entity): T | null {
        return this.m_component_manager.get_component<T>(entity);
    }

    get_component_type<T>(): ComponentType {
        return this.m_component_manager.get_component_type<T>();
    }

    // systems
    register_system<T>(system: T): T {
        return this.m_system_manager.register_system<T>(system, this);
    }

    get_system<T>(): T {
        return this.m_system_manager.get_system<T>();
    }

    // T - system, S - component
    set_system_with_component<T, S>(): void {
        const component = this.get_component_type<S>();
        this.m_system_manager.set_signature_allow<T>(component);
    }

    set_system_without_component<T, S>(): void {
        const component = this.get_component_type<S>();
        this.m_system_manager.set_signature_deny<T>(component);
    }

    update(dt: f32): void {
        this.m_system_manager.update_systems(dt);
    }

    get_entities<T>(): Array<Entity> {
        return this.m_system_manager.get_entities<T>();
    }
}