import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { InsightPolicy } from "./insight-policy.js";

/** One step of the insight policy calculation. */
export interface InsightPolicyModifier {
  describe(): string;
  adjust(item: InsightPolicy, value: number): number;
}

export class TieredInsightPolicyAdjuster implements InsightPolicyModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: InsightPolicy, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CategoryInsightPolicyAdjuster implements InsightPolicyModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: InsightPolicy, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingInsightPolicyAdjuster implements InsightPolicyModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: InsightPolicy, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedInsightPolicyAdjuster implements InsightPolicyModifier {
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

  adjust(item: InsightPolicy, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the insight policy steps in order and keeps a trace of each. */
export class InsightPolicyEngine {
  steps: InsightPolicyModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: InsightPolicyModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: InsightPolicy): number {
    let current = item.measuredValue();
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

  evaluateAll(items: InsightPolicy[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultInsightPolicyEngine(flagsValue: flags.Registry): InsightPolicyEngine {
  return new InsightPolicyEngine(
    [
      new TieredInsightPolicyAdjuster([5351, 8410], [0.96, 0.85]),
      new CategoryInsightPolicyAdjuster(
        new Map<string, number>([["online", 0.76], ["retail", 0.92], ["west", 1.05]]),
      ),
      new RoundingInsightPolicyAdjuster(0.25),
      new FlaggedInsightPolicyAdjuster(flagsValue, "insight-policy-batched", 3.2),
    ],
    [],
    2.1,
    1468,
  );
}
