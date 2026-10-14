import * as numbers from "../../../../kit/numbers.js";
import { LegacyFraudCheckRule } from "./legacy-fraud-check-rule.js";

/** One step of the legacy fraud check rule calculation. */
export interface LegacyFraudCheckRuleStep {
  describe(): string;
  adjust(item: LegacyFraudCheckRule, value: number): number;
}

export class CapLegacyFraudCheckRuleAdjuster implements LegacyFraudCheckRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyFraudCheckRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingLegacyFraudCheckRuleAdjuster implements LegacyFraudCheckRuleStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyFraudCheckRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredLegacyFraudCheckRuleAdjuster implements LegacyFraudCheckRuleStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyFraudCheckRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumLegacyFraudCheckRuleAdjuster implements LegacyFraudCheckRuleStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyFraudCheckRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the legacy fraud check rule steps in order and keeps a trace of each. */
export class LegacyFraudCheckRuleEngine {
  steps: LegacyFraudCheckRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyFraudCheckRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyFraudCheckRule): number {
    let current = item.netVolume();
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

  evaluateAll(items: LegacyFraudCheckRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyFraudCheckRuleEngine(): LegacyFraudCheckRuleEngine {
  return new LegacyFraudCheckRuleEngine(
    [
      new CapLegacyFraudCheckRuleAdjuster(8035),
      new RoundingLegacyFraudCheckRuleAdjuster(0.5),
      new TieredLegacyFraudCheckRuleAdjuster([513, 4159], [1.16, 0.94]),
      new MinimumLegacyFraudCheckRuleAdjuster(31.3),
    ],
    [],
    1.2,
    84130,
  );
}
