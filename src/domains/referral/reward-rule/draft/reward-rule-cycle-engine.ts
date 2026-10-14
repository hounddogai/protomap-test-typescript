import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleCycle } from "./reward-rule-cycle.js";

/** One step of the reward rule cycle calculation. */
export interface RewardRuleCycleAdjuster {
  describe(): string;
  adjust(item: RewardRuleCycle, value: number): number;
}

export class RoundingRewardRuleCycleAdjuster implements RewardRuleCycleAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRewardRuleCycleAdjuster implements RewardRuleCycleAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRewardRuleCycleAdjuster implements RewardRuleCycleAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRewardRuleCycleAdjuster implements RewardRuleCycleAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedRewardRuleCycleAdjuster implements RewardRuleCycleAdjuster {
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

  adjust(item: RewardRuleCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward rule cycle steps in order and keeps a trace of each. */
export class RewardRuleCycleEngine {
  steps: RewardRuleCycleAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleCycleAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleCycle): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: RewardRuleCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleCycleEngine(flagsValue: flags.Registry): RewardRuleCycleEngine {
  return new RewardRuleCycleEngine(
    [
      new RoundingRewardRuleCycleAdjuster(1),
      new MinimumRewardRuleCycleAdjuster(21.8),
      new CapRewardRuleCycleAdjuster(49079),
      new PercentRewardRuleCycleAdjuster(14.6),
      new FlaggedRewardRuleCycleAdjuster(flagsValue, "reward-rule-cycle-manual", 4.4),
    ],
    [],
    4,
    49616.6,
  );
}
