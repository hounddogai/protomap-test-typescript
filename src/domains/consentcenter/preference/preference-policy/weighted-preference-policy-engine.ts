import * as numbers from "../../../../kit/numbers.js";
import { WeightedPreferencePolicy } from "./weighted-preference-policy.js";

/** One step of the weighted preference policy calculation. */
export interface WeightedPreferencePolicyModifier {
  describe(): string;
  adjust(item: WeightedPreferencePolicy, value: number): number;
}

export class RegionWeightedPreferencePolicyAdjuster implements WeightedPreferencePolicyModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: WeightedPreferencePolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class WeightedPreferencePolicyRateOffsetAdjuster implements WeightedPreferencePolicyModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: WeightedPreferencePolicy, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class MinimumWeightedPreferencePolicyAdjuster implements WeightedPreferencePolicyModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPreferencePolicy, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the weighted preference policy steps in order and keeps a trace of each. */
export class WeightedPreferencePolicyEngine {
  steps: WeightedPreferencePolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPreferencePolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedPreferencePolicy): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: WeightedPreferencePolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedPreferencePolicyEngine(): WeightedPreferencePolicyEngine {
  return new WeightedPreferencePolicyEngine(
    [
      new RegionWeightedPreferencePolicyAdjuster(new Map<string, number>([["online", 1.3]])),
      new WeightedPreferencePolicyRateOffsetAdjuster(1.94),
      new MinimumWeightedPreferencePolicyAdjuster(45.1),
    ],
    [],
    1.5,
    19649.5,
  );
}
