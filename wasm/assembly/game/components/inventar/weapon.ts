import { OneFloatComponent, OneUIntComponent } from "../one_value";

export class WeaponAttackDistanceComponent extends OneFloatComponent {}  // distance the weapon allows to start attack
export class WeaponAttackTimeComponent extends OneFloatComponent {}  // how long the attack cast
export class WeaponAttackCooldawnComponent extends OneFloatComponent {}  // cooldaw value of the attack
export class WeaponDamageComponent extends OneUIntComponent {}  // damage value
export class WeaponShieldeComponent extends OneFloatComponent {}

export class WeaponDamageSpreadComponent extends OneFloatComponent {}
export class WeaponDamageDistanceComponent extends OneFloatComponent {}
