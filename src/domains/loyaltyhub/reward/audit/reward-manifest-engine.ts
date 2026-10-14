import * as numbers from "../../../../kit/numbers.js";
import { RewardManifest } from "./reward-manifest.js";

/** One step of the reward manifest calculation. */
export interface RewardManifestAdjuster {
  describe(): string;
  adjust(item: RewardManifest, value: number): number;
}

export class PercentRewardManifestAdjuster implements RewardManifestAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingRewardManifestAdjuster implements RewardManifestAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class RewardManifestRetriesOffsetAdjuster implements RewardManifestAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus retries times ${this.weight}`;
  }

  adjust(item: RewardManifest, value: number): number {
    return value + item.retries * this.weight;
  }
}

export class CountryRewardManifestAdjuster implements RewardManifestAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RewardManifest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the reward manifest steps in order and keeps a trace of each. */
export class RewardManifestEngine {
  steps: RewardManifestAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardManifestAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RewardManifest): number {
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

  evaluateAll(items: RewardManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRewardManifestEngine(): RewardManifestEngine {
  return new RewardManifestEngine(
    [
      new PercentRewardManifestAdjuster(15.6),
      new RoundingRewardManifestAdjuster(0.5),
      new RewardManifestRetriesOffsetAdjuster(0.2),
      new CountryRewardManifestAdjuster(new Map<string, number>([["central", 0.81]])),
    ],
    [],
    3.3,
    35492.4,
  );
}
