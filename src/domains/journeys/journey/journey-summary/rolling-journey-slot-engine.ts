import * as flags from "../../../../kit/flags.js";
import { RollingJourneySlot } from "./rolling-journey-slot.js";

/** One step of the rolling journey slot calculation. */
export interface RollingJourneySlotFactor {
  describe(): string;
  adjust(item: RollingJourneySlot, value: number): number;
}

export class MinimumRollingJourneySlotAdjuster implements RollingJourneySlotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingJourneySlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRollingJourneySlotAdjuster implements RollingJourneySlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingJourneySlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingJourneySlotAdjuster implements RollingJourneySlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingJourneySlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingJourneySlotAdjuster implements RollingJourneySlotFactor {
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

  adjust(item: RollingJourneySlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LabelRollingJourneySlotAdjuster implements RollingJourneySlotFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingJourneySlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingJourneySlotAdjuster implements RollingJourneySlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingJourneySlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling journey slot steps in order and keeps a trace of each. */
export class RollingJourneySlotEngine {
  steps: RollingJourneySlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingJourneySlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingJourneySlot): number {
    let current = item.netVolume();
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

  evaluateAll(items: RollingJourneySlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingJourneySlotEngine(flagsValue: flags.Registry): RollingJourneySlotEngine {
  return new RollingJourneySlotEngine(
    [
      new MinimumRollingJourneySlotAdjuster(38.4),
      new PercentRollingJourneySlotAdjuster(-1.8),
      new CapRollingJourneySlotAdjuster(36754),
      new FlaggedRollingJourneySlotAdjuster(flagsValue, "rolling-journey-slot-tiered", -3),
      new LabelRollingJourneySlotAdjuster(new Map<string, number>([["central", 1.02], ["online", 1.24]])),
      new TieredRollingJourneySlotAdjuster([1039, 5007, 6375], [1.2, 0.8, 1.02]),
    ],
    [],
    3.4,
    86114.6,
  );
}
