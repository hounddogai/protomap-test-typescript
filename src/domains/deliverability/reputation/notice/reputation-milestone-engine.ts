import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ReputationMilestone } from "./reputation-milestone.js";

/** One step of the reputation milestone calculation. */
export interface ReputationMilestoneAdjuster {
  describe(): string;
  adjust(item: ReputationMilestone, value: number): number;
}

export class MinimumReputationMilestoneAdjuster implements ReputationMilestoneAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ReputationMilestone, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class ReputationMilestoneCeilingOffsetAdjuster implements ReputationMilestoneAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: ReputationMilestone, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class UtmSourceReputationMilestoneAdjuster implements ReputationMilestoneAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ReputationMilestone, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedReputationMilestoneAdjuster implements ReputationMilestoneAdjuster {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ReputationMilestone, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reputation milestone steps in order and keeps a trace of each. */
export class ReputationMilestoneEngine {
  steps: ReputationMilestoneAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReputationMilestoneAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ReputationMilestone): number {
    let current = item.effectiveLoad();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ReputationMilestone[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultReputationMilestoneEngine(flagsValue: flags.Registry): ReputationMilestoneEngine {
  return new ReputationMilestoneEngine(
    [
      new MinimumReputationMilestoneAdjuster(0.3),
      new ReputationMilestoneCeilingOffsetAdjuster(0.88),
      new UtmSourceReputationMilestoneAdjuster(
        new Map<string, number>([["north", 1.2], ["south", 0.92], ["central", 1.12]]),
      ),
      new FlaggedReputationMilestoneAdjuster(flagsValue, "reputation-milestone-weighted", -1.8),
    ],
    [],
    0.7,
    92809.7,
  );
}
