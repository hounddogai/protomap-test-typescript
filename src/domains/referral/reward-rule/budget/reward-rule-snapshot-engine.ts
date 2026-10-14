import * as flags from "../../../../kit/flags.js";
import { RewardRuleSnapshot } from "./reward-rule-snapshot.js";

/** One step of the reward rule snapshot calculation. */
export interface RewardRuleSnapshotAdjuster {
  describe(): string;
  adjust(item: RewardRuleSnapshot, value: number): number;
}

export class FlaggedRewardRuleSnapshotAdjuster implements RewardRuleSnapshotAdjuster {
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

  adjust(item: RewardRuleSnapshot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardRuleSnapshotAdjuster implements RewardRuleSnapshotAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleSnapshot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RewardRuleSnapshotThresholdOffsetAdjuster implements RewardRuleSnapshotAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: RewardRuleSnapshot, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentRewardRuleSnapshotAdjuster implements RewardRuleSnapshotAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRuleSnapshot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelRewardRuleSnapshotAdjuster implements RewardRuleSnapshotAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RewardRuleSnapshot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRewardRuleSnapshotAdjuster implements RewardRuleSnapshotAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRuleSnapshot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the reward rule snapshot steps in order and keeps a trace of each. */
export class RewardRuleSnapshotEngine {
  steps: RewardRuleSnapshotAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleSnapshotAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardRuleSnapshot): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: RewardRuleSnapshot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardRuleSnapshotEngine(flagsValue: flags.Registry): RewardRuleSnapshotEngine {
  return new RewardRuleSnapshotEngine(
    [
      new FlaggedRewardRuleSnapshotAdjuster(flagsValue, "reward-rule-snapshot-primary", -1.6),
      new MinimumRewardRuleSnapshotAdjuster(18.2),
      new RewardRuleSnapshotThresholdOffsetAdjuster(0.42),
      new PercentRewardRuleSnapshotAdjuster(-1.6),
      new LabelRewardRuleSnapshotAdjuster(new Map<string, number>([["south", 1.34], ["central", 1.02]])),
      new CapRewardRuleSnapshotAdjuster(1940),
    ],
    [],
    4.8,
    1638.3,
  );
}
