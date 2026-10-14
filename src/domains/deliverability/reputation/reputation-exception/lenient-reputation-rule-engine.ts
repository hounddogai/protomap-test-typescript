import * as numbers from "../../../../kit/numbers.js";
import { LenientReputationRule } from "./lenient-reputation-rule.js";

/** One step of the lenient reputation rule calculation. */
export interface LenientReputationRuleFactor {
  describe(): string;
  adjust(item: LenientReputationRule, value: number): number;
}

export class LenientReputationRuleGraceDaysOffsetAdjuster implements LenientReputationRuleFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: LenientReputationRule, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

export class MinimumLenientReputationRuleAdjuster implements LenientReputationRuleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientReputationRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LabelLenientReputationRuleAdjuster implements LenientReputationRuleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: LenientReputationRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredLenientReputationRuleAdjuster implements LenientReputationRuleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientReputationRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the lenient reputation rule steps in order and keeps a trace of each. */
export class LenientReputationRuleEngine {
  steps: LenientReputationRuleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientReputationRuleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientReputationRule): number {
    let current = item.measuredValue();
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

  evaluateAll(items: LenientReputationRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientReputationRuleEngine(): LenientReputationRuleEngine {
  return new LenientReputationRuleEngine(
    [
      new LenientReputationRuleGraceDaysOffsetAdjuster(0.79),
      new MinimumLenientReputationRuleAdjuster(49.7),
      new LabelLenientReputationRuleAdjuster(new Map<string, number>([["south", 1.12], ["north", 0.98]])),
      new TieredLenientReputationRuleAdjuster([3575, 4710, 5460], [1.12, 0.84, 1.09]),
    ],
    [],
    1.5,
    19611.3,
  );
}
