import * as numbers from "../../../../kit/numbers.js";
import { RollingStepPolicy } from "./rolling-step-policy.js";

/** One step of the rolling step policy calculation. */
export interface RollingStepPolicyModifier {
  describe(): string;
  adjust(item: RollingStepPolicy, value: number): number;
}

export class RoundingRollingStepPolicyAdjuster implements RollingStepPolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RollingStepPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRollingStepPolicyAdjuster implements RollingStepPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingStepPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceRollingStepPolicyAdjuster implements RollingStepPolicyModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: RollingStepPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRollingStepPolicyAdjuster implements RollingStepPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingStepPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling step policy steps in order and keeps a trace of each. */
export class RollingStepPolicyEngine {
  steps: RollingStepPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingStepPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingStepPolicy): number {
    let current = item.projectedTotal();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: RollingStepPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingStepPolicyEngine(): RollingStepPolicyEngine {
  return new RollingStepPolicyEngine(
    [
      new RoundingRollingStepPolicyAdjuster(1),
      new TieredRollingStepPolicyAdjuster([1747, 2630], [0.94, 0.92]),
      new UtmSourceRollingStepPolicyAdjuster(
        new Map<string, number>([["west", 1.18], ["retail", 0.82], ["online", 1.08]]),
      ),
      new PercentRollingStepPolicyAdjuster(-3.9),
    ],
    [],
    4.4,
    71344.5,
  );
}
