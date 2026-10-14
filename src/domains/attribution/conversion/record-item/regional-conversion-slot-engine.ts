import * as flags from "../../../../kit/flags.js";
import { RegionalConversionSlot } from "./regional-conversion-slot.js";

/** One step of the regional conversion slot calculation. */
export interface RegionalConversionSlotStep {
  describe(): string;
  adjust(item: RegionalConversionSlot, value: number): number;
}

export class MinimumRegionalConversionSlotAdjuster implements RegionalConversionSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalConversionSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapRegionalConversionSlotAdjuster implements RegionalConversionSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalConversionSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TitleRegionalConversionSlotAdjuster implements RegionalConversionSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: RegionalConversionSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRegionalConversionSlotAdjuster implements RegionalConversionSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalConversionSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedRegionalConversionSlotAdjuster implements RegionalConversionSlotStep {
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

  adjust(item: RegionalConversionSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the regional conversion slot steps in order and keeps a trace of each. */
export class RegionalConversionSlotEngine {
  steps: RegionalConversionSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalConversionSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalConversionSlot): number {
    let current = item.netExposure();
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

  evaluateAll(items: RegionalConversionSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalConversionSlotEngine(flagsValue: flags.Registry): RegionalConversionSlotEngine {
  return new RegionalConversionSlotEngine(
    [
      new MinimumRegionalConversionSlotAdjuster(29.9),
      new CapRegionalConversionSlotAdjuster(40820),
      new TitleRegionalConversionSlotAdjuster(new Map<string, number>([["east", 1.3], ["north", 0.88]])),
      new TieredRegionalConversionSlotAdjuster([576, 6967, 9820], [0.94, 0.83, 1.09]),
      new FlaggedRegionalConversionSlotAdjuster(flagsValue, "regional-conversion-slot-lenient", -4.7),
    ],
    [],
    0.7,
    18347.8,
  );
}
