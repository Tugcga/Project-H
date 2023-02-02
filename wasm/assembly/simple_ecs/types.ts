export type Entity = u32;
export type ComponentType = u32;
export const MAX_ENTITIES: Entity = 5000;
export const MAX_COMPONENTS: ComponentType = 128;

export enum Sign {
    SIGN_ALLOW,
    SIGN_DENY,
    SIGN_ANY,
}