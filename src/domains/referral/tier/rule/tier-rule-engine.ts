import * as numbers from "../../../../kit/numbers.js";
import { TierRule } from "./tier-rule.js";

/** One step of the tier rule calculation. */
export interface TierRuleAdjuster {
  describe(): string;
  adjust(item: TierRule, value: number): number;
}

export class RoundingTierRuleAdjuster implements TierRuleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TierRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TierRuleRateOffsetAdjuster implements TierRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: TierRule, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class ChannelTierRuleAdjuster implements TierRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: TierRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumTierRuleAdjuster implements TierRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TierRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the tier rule steps in order and keeps a trace of each. */
export class TierRuleEngine {
  steps: TierRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TierRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: TierRule): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: TierRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultTierRuleEngine(): TierRuleEngine {
  return new TierRuleEngine(
    [
      new RoundingTierRuleAdjuster(0.05),
      new TierRuleRateOffsetAdjuster(1.14),
      new ChannelTierRuleAdjuster(new Map<string, number>([["central", 1.2], ["online", 1.33]])),
      new MinimumTierRuleAdjuster(7.9),
    ],
    [],
    1.7,
    49870.3,
  );
}
