import * as numbers from "../../../../kit/numbers.js";
import { CappedRewardRuleAssignment } from "./capped-reward-rule-assignment.js";

/** One step of the capped reward rule assignment calculation. */
export interface CappedRewardRuleAssignmentAdjuster {
  describe(): string;
  adjust(item: CappedRewardRuleAssignment, value: number): number;
}

export class CappedRewardRuleAssignmentMaximumOffsetAdjuster implements CappedRewardRuleAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus maximum times ${this.weight}`;
  }

  adjust(item: CappedRewardRuleAssignment, value: number): number {
    return value + item.maximum * this.weight;
  }
}

export class LabelCappedRewardRuleAssignmentAdjuster implements CappedRewardRuleAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: CappedRewardRuleAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingCappedRewardRuleAssignmentAdjuster implements CappedRewardRuleAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CappedRewardRuleAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCappedRewardRuleAssignmentAdjuster implements CappedRewardRuleAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CappedRewardRuleAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredCappedRewardRuleAssignmentAdjuster implements CappedRewardRuleAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CappedRewardRuleAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumCappedRewardRuleAssignmentAdjuster implements CappedRewardRuleAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CappedRewardRuleAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the capped reward rule assignment steps in order and keeps a trace of each. */
export class CappedRewardRuleAssignmentEngine {
  steps: CappedRewardRuleAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CappedRewardRuleAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: CappedRewardRuleAssignment): number {
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

  evaluateAll(items: CappedRewardRuleAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultCappedRewardRuleAssignmentEngine(): CappedRewardRuleAssignmentEngine {
  return new CappedRewardRuleAssignmentEngine(
    [
      new CappedRewardRuleAssignmentMaximumOffsetAdjuster(0.75),
      new LabelCappedRewardRuleAssignmentAdjuster(new Map<string, number>([["central", 1.04], ["west", 0.73]])),
      new RoundingCappedRewardRuleAssignmentAdjuster(0.1),
      new PercentCappedRewardRuleAssignmentAdjuster(-1.3),
      new TieredCappedRewardRuleAssignmentAdjuster([987, 9378], [0.91, 0.85]),
      new MinimumCappedRewardRuleAssignmentAdjuster(47.1),
    ],
    [],
    4.8,
    88882.3,
  );
}
