import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { OptOutPolicy } from "./opt-out-policy.js";

/** One step of the opt out policy calculation. */
export interface OptOutPolicyModifier {
  describe(): string;
  adjust(item: OptOutPolicy, value: number): number;
}

export class PercentOptOutPolicyAdjuster implements OptOutPolicyModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: OptOutPolicy, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredOptOutPolicyAdjuster implements OptOutPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: OptOutPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumOptOutPolicyAdjuster implements OptOutPolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: OptOutPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CategoryOptOutPolicyAdjuster implements OptOutPolicyModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: OptOutPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedOptOutPolicyAdjuster implements OptOutPolicyModifier {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: OptOutPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the opt out policy steps in order and keeps a trace of each. */
export class OptOutPolicyEngine {
  steps: OptOutPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: OptOutPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: OptOutPolicy): number {
    let current = item.projectedValue();
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

  evaluateAll(items: OptOutPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultOptOutPolicyEngine(flagsValue: flags.Registry): OptOutPolicyEngine {
  return new OptOutPolicyEngine(
    [
      new PercentOptOutPolicyAdjuster(-6.1),
      new TieredOptOutPolicyAdjuster([1617, 5672, 8841, 9632], [0.94, 0.89, 0.83, 0.81]),
      new MinimumOptOutPolicyAdjuster(25.7),
      new CategoryOptOutPolicyAdjuster(new Map<string, number>([["south", 0.72]])),
      new FlaggedOptOutPolicyAdjuster(flagsValue, "opt-out-policy-rolling", 6.6),
    ],
    [],
    4.1,
    54750.1,
  );
}
