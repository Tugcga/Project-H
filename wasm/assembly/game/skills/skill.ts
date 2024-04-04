/*
* When create a new skill:
* 1. Add required parameters here and register it in ecs_setup.ts
* 2. Add skill name into constants.ts: COOLDAWN, SKILL and CAST_ACTION
* 3. Define default parameter values of this skill in settings.ts (by creating new class and add it to defaults)
* 4. Create method in game_api.ts to define this skill parameters
* 5. In ecs_setup.ts:setup_skill add parameters to the global entity with this skill
* 6. Create in buffs.ts component BuffSkill...CooldawnComponent and system BuffTimerSkill...CooldawnSystem for the skill cooldawn
* 7. Register these component and system  in ecs_setup.ts
* 8. Create in cast.ts CastSkill...Component
* 9. In states.ts: add check cooldawn in assign_cast_state method
*                  add remove cast skill component in interrupt_to_iddle (use universal client notification)
*                  add check to reassign target in should_redefine_target_action, for non target nothing update, for target check target type and target identifier
* 10. In commands.ts realise the logic of the skill start (check conditions and so on)
*     For non target skill in method command_use_nontarget_skill
*     For target skill in method try_start_skill
* 11. Add to extermal.ts method for start cast of this skill
* 12. In state_switch.ts realise the skill effect (after cast is finish)
* 13. Implement in apply.ts
*/

// for level up skill parameters we use functions, which should be defined in constructor
// all parameters levelled independently, use different functions to increase/decrease parameter values
class SkillParameter<T> {
    private m_value: T;  // base value
    private m_level_fn: (value: T, level: u32) => T;  // function to convert base value to levelled value, by default it always return base value
    constructor(in_value: T, in_level_fn: (value: T, level: u32) => T = (v: T, l: u32) => { return v; }) { this.m_value = in_value; this.m_level_fn = in_level_fn; }
    base_value(): T { return this.m_value; }
    set_base_value(in_value: T): void { return this.m_value; }
    value(level: u32): T { return this.m_level_fn(this.m_value, level); }
}

export class SkillParameterCastTimeComponent extends SkillParameter<f32> {}
export class SkillParameterCooldawnComponent extends SkillParameter<f32> {}
export class SkillParameterDistanceComponent extends SkillParameter<f32> {}
export class SkillParameterConeSpreadComponent extends SkillParameter<f32> {}
export class SkillParameterConeSizeComponent extends SkillParameter<f32> {}
export class SkillParameterAreaRadiusComponent extends SkillParameter<f32> {}
export class SkillParameterDamageComponent extends SkillParameter<u32> {}
export class SkillParameterStunTimeComponent extends SkillParameter<f32> {}