import { RewardRuleCheckpoint } from "./reward-rule-checkpoint.js";

/** One step of the reward rule checkpoint calculation. */
export interface RewardRuleCheckpointAdjuster {
  describe(): string;
  adjust(item: RewardRuleCheckpoint, value: number): number;
}

export class PercentRewardRuleCheckpointAdjuster implements RewardRuleCheckpointAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleCheckpoint, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardRuleCheckpointAdjuster implements RewardRuleCheckpointAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleCheckpoint, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RewardRuleCheckpointEndsAtOffsetAdjuster implements RewardRuleCheckpointAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: RewardRuleCheckpoint, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

/** Runs the reward rule checkpoint steps in order and keeps a trace of each. */
export class RewardRuleCheckpointEngine {
  steps: RewardRuleCheckpointAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleCheckpointAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleCheckpoint): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: RewardRuleCheckpoint[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleCheckpointEngine(): RewardRuleCheckpointEngine {
  return new RewardRuleCheckpointEngine(
    [
      new PercentRewardRuleCheckpointAdjuster(23.5),
      new TieredRewardRuleCheckpointAdjuster([1483, 4253], [1, 1.11]),
      new RewardRuleCheckpointEndsAtOffsetAdjuster(0.42),
    ],
    [],
    1.4,
    55640,
  );
}
