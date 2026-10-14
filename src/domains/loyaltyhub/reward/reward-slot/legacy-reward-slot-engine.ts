import * as flags from "../../../../kit/flags.js";
import { LegacyRewardSlot } from "./legacy-reward-slot.js";

/** One step of the legacy reward slot calculation. */
export interface LegacyRewardSlotFactor {
  describe(): string;
  adjust(item: LegacyRewardSlot, value: number): number;
}

export class LegacyRewardSlotClicksOffsetAdjuster implements LegacyRewardSlotFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus clicks times ${this.weight}`;
  }

  adjust(item: LegacyRewardSlot, value: number): number {
    return value + item.clicks * this.weight;
  }
}

export class FlaggedLegacyRewardSlotAdjuster implements LegacyRewardSlotFactor {
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

  adjust(item: LegacyRewardSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredLegacyRewardSlotAdjuster implements LegacyRewardSlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LegacyRewardSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class ChannelLegacyRewardSlotAdjuster implements LegacyRewardSlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: LegacyRewardSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy reward slot steps in order and keeps a trace of each. */
export class LegacyRewardSlotEngine {
  steps: LegacyRewardSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyRewardSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: LegacyRewardSlot): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: LegacyRewardSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultLegacyRewardSlotEngine(flagsValue: flags.Registry): LegacyRewardSlotEngine {
  return new LegacyRewardSlotEngine(
    [
      new LegacyRewardSlotClicksOffsetAdjuster(0.47),
      new FlaggedLegacyRewardSlotAdjuster(flagsValue, "legacy-reward-slot-rolling", 9),
      new TieredLegacyRewardSlotAdjuster([4759, 6739, 7073, 8556], [1.19, 1.01, 0.81, 1.13]),
      new ChannelLegacyRewardSlotAdjuster(new Map<string, number>([["south", 1.16]])),
    ],
    [],
    0.9,
    99909.2,
  );
}
