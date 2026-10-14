import * as numbers from "../../../../kit/numbers.js";
import { LegacyDeflectionRule } from "./legacy-deflection-rule.js";

/** One step of the legacy deflection rule calculation. */
export interface LegacyDeflectionRuleAdjuster {
  describe(): string;
  adjust(item: LegacyDeflectionRule, value: number): number;
}

export class MinimumLegacyDeflectionRuleAdjuster implements LegacyDeflectionRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyDeflectionRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentLegacyDeflectionRuleAdjuster implements LegacyDeflectionRuleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyDeflectionRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLegacyDeflectionRuleAdjuster implements LegacyDeflectionRuleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LegacyDeflectionRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CountryLegacyDeflectionRuleAdjuster implements LegacyDeflectionRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: LegacyDeflectionRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapLegacyDeflectionRuleAdjuster implements LegacyDeflectionRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyDeflectionRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy deflection rule steps in order and keeps a trace of each. */
export class LegacyDeflectionRuleEngine {
  steps: LegacyDeflectionRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyDeflectionRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: LegacyDeflectionRule): number {
    let current = item.netExposure();
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

  evaluateAll(items: LegacyDeflectionRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultLegacyDeflectionRuleEngine(): LegacyDeflectionRuleEngine {
  return new LegacyDeflectionRuleEngine(
    [
      new MinimumLegacyDeflectionRuleAdjuster(6.6),
      new PercentLegacyDeflectionRuleAdjuster(14.1),
      new RoundingLegacyDeflectionRuleAdjuster(5),
      new CountryLegacyDeflectionRuleAdjuster(
        new Map<string, number>([["west", 1.29], ["south", 1.08], ["central", 0.85]]),
      ),
      new CapLegacyDeflectionRuleAdjuster(12018),
    ],
    [],
    0.8,
    81170.8,
  );
}
