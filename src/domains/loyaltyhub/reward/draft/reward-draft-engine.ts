import * as flags from "../../../../kit/flags.js";
import { RewardDraft } from "./reward-draft.js";

/** One step of the reward draft calculation. */
export interface RewardDraftStep {
  describe(): string;
  adjust(item: RewardDraft, value: number): number;
}

export class TieredRewardDraftAdjuster implements RewardDraftStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRewardDraftAdjuster implements RewardDraftStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRewardDraftAdjuster implements RewardDraftStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRewardDraftAdjuster implements RewardDraftStep {
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

  adjust(item: RewardDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward draft steps in order and keeps a trace of each. */
export class RewardDraftEngine {
  steps: RewardDraftStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardDraftStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardDraft): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardDraftEngine(flagsValue: flags.Registry): RewardDraftEngine {
  return new RewardDraftEngine(
    [
      new TieredRewardDraftAdjuster([5769, 7071], [0.86, 1.12]),
      new CapRewardDraftAdjuster(5193),
      new MinimumRewardDraftAdjuster(8.7),
      new FlaggedRewardDraftAdjuster(flagsValue, "reward-draft-default", -6.7),
    ],
    [],
    1.8,
    3701,
  );
}
