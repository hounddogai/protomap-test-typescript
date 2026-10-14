import { RewardRule } from "./reward-rule.js";

/** One step of the reward rule calculation. */
export interface RewardRuleStep {
  describe(): string;
  adjust(item: RewardRule, value: number): number;
}

export class UnitRewardRuleAdjuster implements RewardRuleStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: RewardRule, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RewardRuleVersionOffsetAdjuster implements RewardRuleStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: RewardRule, value: number): number {
    return value + item.version * this.weight;
  }
}

export class CapRewardRuleAdjuster implements RewardRuleStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRule, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reward rule steps in order and keeps a trace of each. */
export class RewardRuleEngine {
  steps: RewardRuleStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRule): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: RewardRule[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRuleEngine(): RewardRuleEngine {
  return new RewardRuleEngine(
    [
      new UnitRewardRuleAdjuster(new Map<string, number>([["west", 1.01]])),
      new RewardRuleVersionOffsetAdjuster(1.12),
      new CapRewardRuleAdjuster(47929),
    ],
    [],
    2.4,
    48826.1,
  );
}
