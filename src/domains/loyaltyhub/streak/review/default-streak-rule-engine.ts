import * as numbers from "../../../../kit/numbers.js";
import { DefaultStreakRule } from "./default-streak-rule.js";

/** One step of the default streak rule calculation. */
export interface DefaultStreakRuleModifier {
  describe(): string;
  adjust(item: DefaultStreakRule, value: number): number;
}

export class TieredDefaultStreakRuleAdjuster implements DefaultStreakRuleModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultStreakRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingDefaultStreakRuleAdjuster implements DefaultStreakRuleModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultStreakRule, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDefaultStreakRuleAdjuster implements DefaultStreakRuleModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultStreakRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultStreakRuleAdjuster implements DefaultStreakRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultStreakRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the default streak rule steps in order and keeps a trace of each. */
export class DefaultStreakRuleEngine {
  steps: DefaultStreakRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultStreakRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DefaultStreakRule): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: DefaultStreakRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDefaultStreakRuleEngine(): DefaultStreakRuleEngine {
  return new DefaultStreakRuleEngine(
    [
      new TieredDefaultStreakRuleAdjuster([1582, 2036], [1.1, 0.93]),
      new RoundingDefaultStreakRuleAdjuster(0.05),
      new PercentDefaultStreakRuleAdjuster(24.5),
      new MinimumDefaultStreakRuleAdjuster(16.4),
    ],
    [],
    0.4,
    51740.4,
  );
}
