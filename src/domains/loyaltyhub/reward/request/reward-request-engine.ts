import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardRequest } from "./reward-request.js";

/** One step of the reward request calculation. */
export interface RewardRequestFactor {
  describe(): string;
  adjust(item: RewardRequest, value: number): number;
}

export class CapRewardRequestAdjuster implements RewardRequestFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardRequest, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRewardRequestAdjuster implements RewardRequestFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardRequest, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRewardRequestAdjuster implements RewardRequestFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRewardRequestAdjuster implements RewardRequestFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardRequest, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelRewardRequestAdjuster implements RewardRequestFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RewardRequest, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedRewardRequestAdjuster implements RewardRequestFactor {
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

  adjust(item: RewardRequest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the reward request steps in order and keeps a trace of each. */
export class RewardRequestEngine {
  steps: RewardRequestFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardRequestFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RewardRequest): number {
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

  evaluateAll(items: RewardRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRewardRequestEngine(flagsValue: flags.Registry): RewardRequestEngine {
  return new RewardRequestEngine(
    [
      new CapRewardRequestAdjuster(41069),
      new MinimumRewardRequestAdjuster(29.1),
      new PercentRewardRequestAdjuster(-10.9),
      new TieredRewardRequestAdjuster([3544, 8258, 8381], [1.08, 0.82, 0.97]),
      new LabelRewardRequestAdjuster(
        new Map<string, number>([["west", 0.79], ["online", 1.18], ["south", 1.24]]),
      ),
      new FlaggedRewardRequestAdjuster(flagsValue, "reward-request-manual", 1.4),
    ],
    [],
    1.7,
    58071.3,
  );
}
