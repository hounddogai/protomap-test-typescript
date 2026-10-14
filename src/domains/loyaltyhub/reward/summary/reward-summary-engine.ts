import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardSummary } from "./reward-summary.js";

/** One step of the reward summary calculation. */
export interface RewardSummaryModifier {
  describe(): string;
  adjust(item: RewardSummary, value: number): number;
}

export class MinimumRewardSummaryAdjuster implements RewardSummaryModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardSummary, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedRewardSummaryAdjuster implements RewardSummaryModifier {
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

  adjust(item: RewardSummary, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class NameRewardSummaryAdjuster implements RewardSummaryModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RewardSummary, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRewardSummaryAdjuster implements RewardSummaryModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardSummary, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward summary steps in order and keeps a trace of each. */
export class RewardSummaryEngine {
  steps: RewardSummaryModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardSummaryModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RewardSummary): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: RewardSummary[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRewardSummaryEngine(flagsValue: flags.Registry): RewardSummaryEngine {
  return new RewardSummaryEngine(
    [
      new MinimumRewardSummaryAdjuster(38.4),
      new FlaggedRewardSummaryAdjuster(flagsValue, "reward-summary-batched", -6.2),
      new NameRewardSummaryAdjuster(
        new Map<string, number>([["retail", 1.23], ["central", 1.05], ["east", 0.78]]),
      ),
      new TieredRewardSummaryAdjuster([1465, 4965, 7663], [0.85, 0.93, 1.13]),
    ],
    [],
    0,
    66564.6,
  );
}
