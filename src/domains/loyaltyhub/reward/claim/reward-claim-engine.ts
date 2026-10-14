import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardClaim } from "./reward-claim.js";

/** One step of the reward claim calculation. */
export interface RewardClaimAdjuster {
  describe(): string;
  adjust(item: RewardClaim, value: number): number;
}

export class LabelRewardClaimAdjuster implements RewardClaimAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RewardClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRewardClaimAdjuster implements RewardClaimAdjuster {
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

  adjust(item: RewardClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardClaimAdjuster implements RewardClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward claim steps in order and keeps a trace of each. */
export class RewardClaimEngine {
  steps: RewardClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardClaim): number {
    let current = item.weightedVolume();
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

  evaluateAll(items: RewardClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardClaimEngine(flagsValue: flags.Registry): RewardClaimEngine {
  return new RewardClaimEngine(
    [
      new LabelRewardClaimAdjuster(new Map<string, number>([["west", 1.12]])),
      new FlaggedRewardClaimAdjuster(flagsValue, "reward-claim-tiered", -8.1),
      new TieredRewardClaimAdjuster([4786, 4797, 7818, 9454], [0.81, 0.88, 1.1, 1.06]),
    ],
    [],
    1.9,
    46029.4,
  );
}
