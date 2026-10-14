import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RewardEntry } from "./reward-entry.js";

/** One step of the reward entry calculation. */
export interface RewardEntryStep {
  describe(): string;
  adjust(item: RewardEntry, value: number): number;
}

export class FlaggedRewardEntryAdjuster implements RewardEntryStep {
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

  adjust(item: RewardEntry, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentRewardEntryAdjuster implements RewardEntryStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RewardEntry, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRewardEntryAdjuster implements RewardEntryStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RewardEntry, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameRewardEntryAdjuster implements RewardEntryStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: RewardEntry, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRewardEntryAdjuster implements RewardEntryStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RewardEntry, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredRewardEntryAdjuster implements RewardEntryStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RewardEntry, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reward entry steps in order and keeps a trace of each. */
export class RewardEntryEngine {
  steps: RewardEntryStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RewardEntryStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: RewardEntry): number {
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

  evaluateAll(items: RewardEntry[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultRewardEntryEngine(flagsValue: flags.Registry): RewardEntryEngine {
  return new RewardEntryEngine(
    [
      new FlaggedRewardEntryAdjuster(flagsValue, "reward-entry-regional", -7.1),
      new PercentRewardEntryAdjuster(-23.3),
      new MinimumRewardEntryAdjuster(1.5),
      new NameRewardEntryAdjuster(new Map<string, number>([["north", 1.01], ["south", 1.25], ["retail", 0.84]])),
      new CapRewardEntryAdjuster(30291),
      new TieredRewardEntryAdjuster([1788, 6277, 6306, 7312], [1.04, 0.87, 1.1, 0.97]),
    ],
    [],
    3.2,
    92401.9,
  );
}
