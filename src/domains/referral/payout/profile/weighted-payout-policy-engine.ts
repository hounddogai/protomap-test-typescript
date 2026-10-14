import * as flags from "../../../../kit/flags.js";
import { WeightedPayoutPolicy } from "./weighted-payout-policy.js";

/** One step of the weighted payout policy calculation. */
export interface WeightedPayoutPolicyStep {
  describe(): string;
  adjust(item: WeightedPayoutPolicy, value: number): number;
}

export class TitleWeightedPayoutPolicyAdjuster implements WeightedPayoutPolicyStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: WeightedPayoutPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedWeightedPayoutPolicyAdjuster implements WeightedPayoutPolicyStep {
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

  adjust(item: WeightedPayoutPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWeightedPayoutPolicyAdjuster implements WeightedPayoutPolicyStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedPayoutPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WeightedPayoutPolicyCapacityOffsetAdjuster implements WeightedPayoutPolicyStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus capacity times ${this.weight}`;
  }

  adjust(item: WeightedPayoutPolicy, value: number): number {
    return value + item.capacity * this.weight;
  }
}

export class MinimumWeightedPayoutPolicyAdjuster implements WeightedPayoutPolicyStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPayoutPolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted payout policy steps in order and keeps a trace of each. */
export class WeightedPayoutPolicyEngine {
  steps: WeightedPayoutPolicyStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPayoutPolicyStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedPayoutPolicy): number {
    let current = item.adjustedValue();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: WeightedPayoutPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedPayoutPolicyEngine(flagsValue: flags.Registry): WeightedPayoutPolicyEngine {
  return new WeightedPayoutPolicyEngine(
    [
      new TitleWeightedPayoutPolicyAdjuster(
        new Map<string, number>([["west", 1.39], ["online", 1.08], ["central", 1.08]]),
      ),
      new FlaggedWeightedPayoutPolicyAdjuster(flagsValue, "weighted-payout-policy-lenient", -0.4),
      new TieredWeightedPayoutPolicyAdjuster([3462, 7727], [1.07, 1.06]),
      new WeightedPayoutPolicyCapacityOffsetAdjuster(0.93),
      new MinimumWeightedPayoutPolicyAdjuster(33.1),
    ],
    [],
    4.2,
    37937.3,
  );
}
