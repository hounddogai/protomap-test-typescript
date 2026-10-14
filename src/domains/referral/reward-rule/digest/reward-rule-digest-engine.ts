import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRuleDigest } from "./reward-rule-digest.js";

/** One step of the reward rule digest calculation. */
export interface RewardRuleDigestFactor {
  describe(): string;
  adjust(item: RewardRuleDigest, value: number): number;
}

export class RoundingRewardRuleDigestAdjuster implements RewardRuleDigestFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RewardRuleDigest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TitleRewardRuleDigestAdjuster implements RewardRuleDigestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RewardRuleDigest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRewardRuleDigestAdjuster implements RewardRuleDigestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRuleDigest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRewardRuleDigestAdjuster implements RewardRuleDigestFactor {
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

  adjust(item: RewardRuleDigest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardRuleDigestAdjuster implements RewardRuleDigestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRuleDigest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the reward rule digest steps in order and keeps a trace of each. */
export class RewardRuleDigestEngine {
  steps: RewardRuleDigestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRuleDigestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardRuleDigest): number {
    let current = item.netTotal();
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

  evaluateAll(items: RewardRuleDigest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardRuleDigestEngine(flagsValue: flags.Registry): RewardRuleDigestEngine {
  return new RewardRuleDigestEngine(
    [
      new RoundingRewardRuleDigestAdjuster(5),
      new TitleRewardRuleDigestAdjuster(new Map<string, number>([["central", 1.07]])),
      new TieredRewardRuleDigestAdjuster([5147, 9564], [1.14, 1.09]),
      new FlaggedRewardRuleDigestAdjuster(flagsValue, "reward-rule-digest-manual", -8.4),
      new MinimumRewardRuleDigestAdjuster(28.2),
    ],
    [],
    2.7,
    72676.8,
  );
}
