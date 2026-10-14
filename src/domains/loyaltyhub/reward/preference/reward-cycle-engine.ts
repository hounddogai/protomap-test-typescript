import * as flags from "../../../../kit/flags.js";
import { RewardCycle } from "./reward-cycle.js";

/** One step of the reward cycle calculation. */
export interface RewardCycleFactor {
  describe(): string;
  adjust(item: RewardCycle, value: number): number;
}

export class TieredRewardCycleAdjuster implements RewardCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class TitleRewardCycleAdjuster implements RewardCycleFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RewardCycle, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentRewardCycleAdjuster implements RewardCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRewardCycleAdjuster implements RewardCycleFactor {
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

  adjust(item: RewardCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardCycleAdjuster implements RewardCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward cycle steps in order and keeps a trace of each. */
export class RewardCycleEngine {
  steps: RewardCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardCycle): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: RewardCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardCycleEngine(flagsValue: flags.Registry): RewardCycleEngine {
  return new RewardCycleEngine(
    [
      new TieredRewardCycleAdjuster([4823, 5364], [0.92, 0.9]),
      new TitleRewardCycleAdjuster(new Map<string, number>([["online", 1.02]])),
      new PercentRewardCycleAdjuster(11.4),
      new FlaggedRewardCycleAdjuster(flagsValue, "reward-cycle-weighted", 6.6),
      new MinimumRewardCycleAdjuster(0.7),
    ],
    [],
    2,
    94185.4,
  );
}
