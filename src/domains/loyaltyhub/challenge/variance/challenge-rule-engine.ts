import { ChallengeRule } from "./challenge-rule.js";

/** One step of the challenge rule calculation. */
export interface ChallengeRuleAdjuster {
  describe(): string;
  adjust(item: ChallengeRule, value: number): number;
}

export class TieredChallengeRuleAdjuster implements ChallengeRuleAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ChallengeRule, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumChallengeRuleAdjuster implements ChallengeRuleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ChallengeRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapChallengeRuleAdjuster implements ChallengeRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the challenge rule steps in order and keeps a trace of each. */
export class ChallengeRuleEngine {
  steps: ChallengeRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ChallengeRule): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ChallengeRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultChallengeRuleEngine(): ChallengeRuleEngine {
  return new ChallengeRuleEngine(
    [
      new TieredChallengeRuleAdjuster([1535, 6375], [1.08, 0.92]),
      new MinimumChallengeRuleAdjuster(44.1),
      new CapChallengeRuleAdjuster(10836),
    ],
    [],
    0.9,
    92756.6,
  );
}
