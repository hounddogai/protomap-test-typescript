import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardSlot } from "./reward-slot.js";

/** One step of the reward slot calculation. */
export interface RewardSlotStep {
  describe(): string;
  adjust(item: RewardSlot, value: number): number;
}

export class FlaggedRewardSlotAdjuster implements RewardSlotStep {
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

  adjust(item: RewardSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardSlotAdjuster implements RewardSlotStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardSlot, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumRewardSlotAdjuster implements RewardSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward slot steps in order and keeps a trace of each. */
export class RewardSlotEngine {
  steps: RewardSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardSlot): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: RewardSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardSlotEngine(flagsValue: flags.Registry): RewardSlotEngine {
  return new RewardSlotEngine(
    [
      new FlaggedRewardSlotAdjuster(flagsValue, "reward-slot-primary", -7.6),
      new RoundingRewardSlotAdjuster(5),
      new MinimumRewardSlotAdjuster(45.8),
    ],
    [],
    0.1,
    64099.5,
  );
}
