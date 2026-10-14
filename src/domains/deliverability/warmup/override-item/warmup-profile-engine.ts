import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WarmupProfile } from "./warmup-profile.js";

/** One step of the warmup profile calculation. */
export interface WarmupProfileAdjuster {
  describe(): string;
  adjust(item: WarmupProfile, value: number): number;
}

export class FlaggedWarmupProfileAdjuster implements WarmupProfileAdjuster {
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

  adjust(item: WarmupProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredWarmupProfileAdjuster implements WarmupProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WarmupProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class WarmupProfileRatioOffsetAdjuster implements WarmupProfileAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ratio times ${this.weight}`;
  }

  adjust(item: WarmupProfile, value: number): number {
    return value + item.ratio * this.weight;
  }
}

export class MinimumWarmupProfileAdjuster implements WarmupProfileAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameWarmupProfileAdjuster implements WarmupProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: WarmupProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentWarmupProfileAdjuster implements WarmupProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup profile steps in order and keeps a trace of each. */
export class WarmupProfileEngine {
  steps: WarmupProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WarmupProfile): number {
    let current = item.adjustedTotal();
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

  evaluateAll(items: WarmupProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWarmupProfileEngine(flagsValue: flags.Registry): WarmupProfileEngine {
  return new WarmupProfileEngine(
    [
      new FlaggedWarmupProfileAdjuster(flagsValue, "warmup-profile-seasonal", -2),
      new TieredWarmupProfileAdjuster([2386, 2490, 5658, 9786], [0.97, 0.82, 0.94, 1.17]),
      new WarmupProfileRatioOffsetAdjuster(0.15),
      new MinimumWarmupProfileAdjuster(36.3),
      new NameWarmupProfileAdjuster(
        new Map<string, number>([["central", 1.01], ["south", 1.02], ["north", 1.27]]),
      ),
      new PercentWarmupProfileAdjuster(7.5),
    ],
    [],
    3.5,
    46601.9,
  );
}
