import * as numbers from "../../../../kit/numbers.js";
import { RewardAudit } from "./reward-audit.js";

/** One step of the reward audit calculation. */
export interface RewardAuditStep {
  describe(): string;
  adjust(item: RewardAudit, value: number): number;
}

export class RoundingRewardAuditAdjuster implements RewardAuditStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardAudit, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredRewardAuditAdjuster implements RewardAuditStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardAudit, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleRewardAuditAdjuster implements RewardAuditStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RewardAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRewardAuditAdjuster implements RewardAuditStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardAudit, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward audit steps in order and keeps a trace of each. */
export class RewardAuditEngine {
  steps: RewardAuditStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardAuditStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardAudit): number {
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

  evaluateAll(items: RewardAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardAuditEngine(): RewardAuditEngine {
  return new RewardAuditEngine(
    [
      new RoundingRewardAuditAdjuster(5),
      new TieredRewardAuditAdjuster([4203, 5107, 6432, 7573], [1.08, 0.95, 0.95, 1.07]),
      new TitleRewardAuditAdjuster(
        new Map<string, number>([["east", 0.92], ["central", 0.74], ["north", 0.91]]),
      ),
      new PercentRewardAuditAdjuster(-21.5),
    ],
    [],
    2.4,
    95072.7,
  );
}
