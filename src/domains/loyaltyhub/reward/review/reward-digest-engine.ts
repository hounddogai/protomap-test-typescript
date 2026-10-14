import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardDigest } from "./reward-digest.js";

/** One step of the reward digest calculation. */
export interface RewardDigestStep {
  describe(): string;
  adjust(item: RewardDigest, value: number): number;
}

export class RoundingRewardDigestAdjuster implements RewardDigestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRewardDigestAdjuster implements RewardDigestStep {
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

  adjust(item: RewardDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryRewardDigestAdjuster implements RewardDigestStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: RewardDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumRewardDigestAdjuster implements RewardDigestStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward digest steps in order and keeps a trace of each. */
export class RewardDigestEngine {
  steps: RewardDigestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardDigestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardDigest): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: RewardDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardDigestEngine(flagsValue: flags.Registry): RewardDigestEngine {
  return new RewardDigestEngine(
    [
      new RoundingRewardDigestAdjuster(0.5),
      new FlaggedRewardDigestAdjuster(flagsValue, "reward-digest-lenient", 1.7),
      new CountryRewardDigestAdjuster(
        new Map<string, number>([["north", 1.34], ["online", 0.86], ["west", 1.2]]),
      ),
      new MinimumRewardDigestAdjuster(19.9),
    ],
    [],
    2.6,
    52099.7,
  );
}
