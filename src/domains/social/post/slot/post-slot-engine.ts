import * as flags from "../../../../kit/flags.js";
import { PostSlot } from "./post-slot.js";

/** One step of the post slot calculation. */
export interface PostSlotFactor {
  describe(): string;
  adjust(item: PostSlot, value: number): number;
}

export class TieredPostSlotAdjuster implements PostSlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PostSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PostSlotRateOffsetAdjuster implements PostSlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus rate times ${this.weight}`;
  }

  adjust(item: PostSlot, value: number): number {
    return value + item.rate * this.weight;
  }
}

export class RegionPostSlotAdjuster implements PostSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: PostSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedPostSlotAdjuster implements PostSlotFactor {
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

  adjust(item: PostSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the post slot steps in order and keeps a trace of each. */
export class PostSlotEngine {
  steps: PostSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PostSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PostSlot): number {
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

  evaluateAll(items: PostSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPostSlotEngine(flagsValue: flags.Registry): PostSlotEngine {
  return new PostSlotEngine(
    [
      new TieredPostSlotAdjuster([895, 2025, 7929], [0.9, 1.09, 1.01]),
      new PostSlotRateOffsetAdjuster(0.03),
      new RegionPostSlotAdjuster(new Map<string, number>([["central", 1.2], ["retail", 1.1]])),
      new FlaggedPostSlotAdjuster(flagsValue, "post-slot-capped", -8.7),
    ],
    [],
    2.2,
    84708.4,
  );
}
