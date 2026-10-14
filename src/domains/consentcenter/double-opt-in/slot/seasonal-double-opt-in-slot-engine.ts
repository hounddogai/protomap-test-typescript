import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { SeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

/** One step of the seasonal double opt in slot calculation. */
export interface SeasonalDoubleOptInSlotStep {
  describe(): string;
  adjust(item: SeasonalDoubleOptInSlot, value: number): number;
}

export class SeasonalDoubleOptInSlotEndsAtOffsetAdjuster implements SeasonalDoubleOptInSlotStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: SeasonalDoubleOptInSlot, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class MinimumSeasonalDoubleOptInSlotAdjuster implements SeasonalDoubleOptInSlotStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: SeasonalDoubleOptInSlot, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class NameSeasonalDoubleOptInSlotAdjuster implements SeasonalDoubleOptInSlotStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: SeasonalDoubleOptInSlot, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedSeasonalDoubleOptInSlotAdjuster implements SeasonalDoubleOptInSlotStep {
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

  adjust(item: SeasonalDoubleOptInSlot, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredSeasonalDoubleOptInSlotAdjuster implements SeasonalDoubleOptInSlotStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: SeasonalDoubleOptInSlot, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapSeasonalDoubleOptInSlotAdjuster implements SeasonalDoubleOptInSlotStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: SeasonalDoubleOptInSlot, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the seasonal double opt in slot steps in order and keeps a trace of each. */
export class SeasonalDoubleOptInSlotEngine {
  steps: SeasonalDoubleOptInSlotStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: SeasonalDoubleOptInSlotStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: SeasonalDoubleOptInSlot): number {
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

  evaluateAll(items: SeasonalDoubleOptInSlot[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultSeasonalDoubleOptInSlotEngine(flagsValue: flags.Registry): SeasonalDoubleOptInSlotEngine {
  return new SeasonalDoubleOptInSlotEngine(
    [
      new SeasonalDoubleOptInSlotEndsAtOffsetAdjuster(1.62),
      new MinimumSeasonalDoubleOptInSlotAdjuster(10),
      new NameSeasonalDoubleOptInSlotAdjuster(
        new Map<string, number>([["east", 1.27], ["west", 0.9], ["north", 1.35]]),
      ),
      new FlaggedSeasonalDoubleOptInSlotAdjuster(flagsValue, "seasonal-double-opt-in-slot-rolling", 3.1),
      new TieredSeasonalDoubleOptInSlotAdjuster([4853, 9315], [1.11, 1.08]),
      new CapSeasonalDoubleOptInSlotAdjuster(13428),
    ],
    [],
    4.2,
    61791.1,
  );
}
