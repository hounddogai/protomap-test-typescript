import { RegionalProofRule } from "./regional-proof-rule.js";

/** One step of the regional proof rule calculation. */
export interface RegionalProofRuleModifier {
  describe(): string;
  adjust(item: RegionalProofRule, value: number): number;
}

export class CategoryRegionalProofRuleAdjuster implements RegionalProofRuleModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by category";
  }

  adjust(item: RegionalProofRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRegionalProofRuleAdjuster implements RegionalProofRuleModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalProofRule, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionalProofRuleAttemptsOffsetAdjuster implements RegionalProofRuleModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus attempts times ${this.weight}`;
  }

  adjust(item: RegionalProofRule, value: number): number {
    return value + item.attempts * this.weight;
  }
}

/** Runs the regional proof rule steps in order and keeps a trace of each. */
export class RegionalProofRuleEngine {
  steps: RegionalProofRuleModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalProofRuleModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RegionalProofRule): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RegionalProofRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRegionalProofRuleEngine(): RegionalProofRuleEngine {
  return new RegionalProofRuleEngine(
    [
      new CategoryRegionalProofRuleAdjuster(new Map<string, number>([["central", 1], ["online", 1.21]])),
      new MinimumRegionalProofRuleAdjuster(36.8),
      new RegionalProofRuleAttemptsOffsetAdjuster(1.16),
    ],
    [],
    0.8,
    72594.2,
  );
}
