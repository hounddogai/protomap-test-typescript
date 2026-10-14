import { FallbackLevelRule } from "./fallback-level-rule.js";

/** One step of the fallback level rule calculation. */
export interface FallbackLevelRuleAdjuster {
  describe(): string;
  adjust(item: FallbackLevelRule, value: number): number;
}

export class LocaleFallbackLevelRuleAdjuster implements FallbackLevelRuleAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FallbackLevelRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapFallbackLevelRuleAdjuster implements FallbackLevelRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackLevelRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FallbackLevelRuleBidOffsetAdjuster implements FallbackLevelRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus bid times ${this.weight}`;
  }

  adjust(item: FallbackLevelRule, value: number): number {
    return value + item.bid * this.weight;
  }
}

export class MinimumFallbackLevelRuleAdjuster implements FallbackLevelRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackLevelRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the fallback level rule steps in order and keeps a trace of each. */
export class FallbackLevelRuleEngine {
  steps: FallbackLevelRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackLevelRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackLevelRule): number {
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

  evaluateAll(items: FallbackLevelRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackLevelRuleEngine(): FallbackLevelRuleEngine {
  return new FallbackLevelRuleEngine(
    [
      new LocaleFallbackLevelRuleAdjuster(new Map<string, number>([["south", 1.15]])),
      new CapFallbackLevelRuleAdjuster(33075),
      new FallbackLevelRuleBidOffsetAdjuster(1.95),
      new MinimumFallbackLevelRuleAdjuster(33.8),
    ],
    [],
    0.6,
    33205.5,
  );
}
