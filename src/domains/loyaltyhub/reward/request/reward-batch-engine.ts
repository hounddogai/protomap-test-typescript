import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardBatch } from "./reward-batch.js";

/** One step of the reward batch calculation. */
export interface RewardBatchAdjuster {
  describe(): string;
  adjust(item: RewardBatch, value: number): number;
}

export class FlaggedRewardBatchAdjuster implements RewardBatchAdjuster {
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

  adjust(item: RewardBatch, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RewardBatchAmountOffsetAdjuster implements RewardBatchAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: RewardBatch, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class PercentRewardBatchAdjuster implements RewardBatchAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardBatch, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward batch steps in order and keeps a trace of each. */
export class RewardBatchEngine {
  steps: RewardBatchAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardBatchAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardBatch): number {
    let current = item.netLoad();
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

  evaluateAll(items: RewardBatch[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardBatchEngine(flagsValue: flags.Registry): RewardBatchEngine {
  return new RewardBatchEngine(
    [
      new FlaggedRewardBatchAdjuster(flagsValue, "reward-batch-fallback", -5.4),
      new RewardBatchAmountOffsetAdjuster(0.68),
      new PercentRewardBatchAdjuster(-4.3),
    ],
    [],
    0.4,
    71944.3,
  );
}
