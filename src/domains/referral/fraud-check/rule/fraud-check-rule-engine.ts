import { FraudCheckRule } from "./fraud-check-rule.js";

/** One step of the fraud check rule calculation. */
export interface FraudCheckRuleAdjuster {
  describe(): string;
  adjust(item: FraudCheckRule, value: number): number;
}

export class CapFraudCheckRuleAdjuster implements FraudCheckRuleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FraudCheckRuleSequenceOffsetAdjuster implements FraudCheckRuleAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus sequence times ${this.weight}`;
  }

  adjust(item: FraudCheckRule, value: number): number {
    return value + item.sequence * this.weight;
  }
}

export class PercentFraudCheckRuleAdjuster implements FraudCheckRuleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FraudCheckRule, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fraud check rule steps in order and keeps a trace of each. */
export class FraudCheckRuleEngine {
  steps: FraudCheckRuleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckRuleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: FraudCheckRule): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: FraudCheckRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultFraudCheckRuleEngine(): FraudCheckRuleEngine {
  return new FraudCheckRuleEngine(
    [
      new CapFraudCheckRuleAdjuster(24832),
      new FraudCheckRuleSequenceOffsetAdjuster(0.3),
      new PercentFraudCheckRuleAdjuster(-1.2),
    ],
    [],
    1.6,
    36514.9,
  );
}
