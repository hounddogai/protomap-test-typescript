import { RewardRuleOverride } from "./reward-rule-override.js";

/** One step of the reward rule override calculation. */
export interface RewardRuleOverrideFactor {
  describe(): string;
  adjust(item: RewardRuleOverride, value: number): number;
}

export class CapRewardRuleOverrideAdjuster implements RewardRuleOverrideFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleOverride, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RewardRuleOverridePriorityOffsetAdjuster implements RewardRuleOverrideFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: RewardRuleOverride, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TieredRewardRuleOverrideAdjuster implements RewardRuleOverrideFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleOverride, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumRewardRuleOverrideAdjuster implements RewardRuleOverrideFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleOverride, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward rule override steps in order and keeps a trace of each. */
export class RewardRuleOverrideEngine {
  steps: RewardRuleOverrideFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleOverrideFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleOverride): number {
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

  evaluateAll(items: RewardRuleOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleOverrideEngine(): RewardRuleOverrideEngine {
  return new RewardRuleOverrideEngine(
    [
      new CapRewardRuleOverrideAdjuster(29298),
      new RewardRuleOverridePriorityOffsetAdjuster(1.08),
      new TieredRewardRuleOverrideAdjuster([324, 342, 4277, 6615], [1.16, 1.05, 1.14, 1.06]),
      new MinimumRewardRuleOverrideAdjuster(21.9),
    ],
    [],
    3.2,
    26985.3,
  );
}
