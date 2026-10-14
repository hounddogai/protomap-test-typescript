import { PendingExitRulePreference } from "./pending-exit-rule-preference.js";

/** One step of the pending exit rule preference calculation. */
export interface PendingExitRulePreferenceFactor {
  describe(): string;
  adjust(item: PendingExitRulePreference, value: number): number;
}

export class MinimumPendingExitRulePreferenceAdjuster implements PendingExitRulePreferenceFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PendingExitRulePreference, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RegionPendingExitRulePreferenceAdjuster implements PendingExitRulePreferenceFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PendingExitRulePreference, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentPendingExitRulePreferenceAdjuster implements PendingExitRulePreferenceFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingExitRulePreference, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PendingExitRulePreferencePriorityOffsetAdjuster implements PendingExitRulePreferenceFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PendingExitRulePreference, value: number): number {
    return value + item.priority * this.weight;
  }
}

/** Runs the pending exit rule preference steps in order and keeps a trace of each. */
export class PendingExitRulePreferenceEngine {
  steps: PendingExitRulePreferenceFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingExitRulePreferenceFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: PendingExitRulePreference): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: PendingExitRulePreference[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultPendingExitRulePreferenceEngine(): PendingExitRulePreferenceEngine {
  return new PendingExitRulePreferenceEngine(
    [
      new MinimumPendingExitRulePreferenceAdjuster(8.9),
      new RegionPendingExitRulePreferenceAdjuster(
        new Map<string, number>([["online", 0.72], ["south", 1.32], ["west", 0.94]]),
      ),
      new PercentPendingExitRulePreferenceAdjuster(-6.8),
      new PendingExitRulePreferencePriorityOffsetAdjuster(1.58),
    ],
    [],
    2.9,
    39305.7,
  );
}
