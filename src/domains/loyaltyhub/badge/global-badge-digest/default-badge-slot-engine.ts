import * as flags from "../../../../kit/flags.js";
import { DefaultBadgeSlot } from "./default-badge-slot.js";

/** One step of the default badge slot calculation. */
export interface DefaultBadgeSlotFactor {
  describe(): string;
  adjust(item: DefaultBadgeSlot, value: number): number;
}

export class CapDefaultBadgeSlotAdjuster implements DefaultBadgeSlotFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultBadgeSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDefaultBadgeSlotAdjuster implements DefaultBadgeSlotFactor {
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

  adjust(item: DefaultBadgeSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumDefaultBadgeSlotAdjuster implements DefaultBadgeSlotFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: DefaultBadgeSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredDefaultBadgeSlotAdjuster implements DefaultBadgeSlotFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultBadgeSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDefaultBadgeSlotAdjuster implements DefaultBadgeSlotFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultBadgeSlot, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the default badge slot steps in order and keeps a trace of each. */
export class DefaultBadgeSlotEngine {
  steps: DefaultBadgeSlotFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultBadgeSlotFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultBadgeSlot): number {
    let current = item.projectedLoad();
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

  evaluateAll(items: DefaultBadgeSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultBadgeSlotEngine(flagsValue: flags.Registry): DefaultBadgeSlotEngine {
  return new DefaultBadgeSlotEngine(
    [
      new CapDefaultBadgeSlotAdjuster(24905),
      new FlaggedDefaultBadgeSlotAdjuster(flagsValue, "default-badge-slot-capped", -0.2),
      new MinimumDefaultBadgeSlotAdjuster(16.3),
      new TieredDefaultBadgeSlotAdjuster([3113, 7834], [1.01, 1.16]),
      new PercentDefaultBadgeSlotAdjuster(-14.9),
    ],
    [],
    4.6,
    26741.5,
  );
}
