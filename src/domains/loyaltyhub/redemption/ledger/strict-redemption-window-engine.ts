import * as flags from "../../../../kit/flags.js";
import { StrictRedemptionWindow } from "./strict-redemption-window.js";

/** One step of the strict redemption window calculation. */
export interface StrictRedemptionWindowAdjuster {
  describe(): string;
  adjust(item: StrictRedemptionWindow, value: number): number;
}

export class PercentStrictRedemptionWindowAdjuster implements StrictRedemptionWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictRedemptionWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStrictRedemptionWindowAdjuster implements StrictRedemptionWindowAdjuster {
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

  adjust(item: StrictRedemptionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredStrictRedemptionWindowAdjuster implements StrictRedemptionWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictRedemptionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapStrictRedemptionWindowAdjuster implements StrictRedemptionWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictRedemptionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class StrictRedemptionWindowThresholdOffsetAdjuster implements StrictRedemptionWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: StrictRedemptionWindow, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the strict redemption window steps in order and keeps a trace of each. */
export class StrictRedemptionWindowEngine {
  steps: StrictRedemptionWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictRedemptionWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictRedemptionWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: StrictRedemptionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictRedemptionWindowEngine(flagsValue: flags.Registry): StrictRedemptionWindowEngine {
  return new StrictRedemptionWindowEngine(
    [
      new PercentStrictRedemptionWindowAdjuster(8.5),
      new FlaggedStrictRedemptionWindowAdjuster(flagsValue, "strict-redemption-window-lenient", 1.5),
      new TieredStrictRedemptionWindowAdjuster([2868, 3044, 9717], [1.2, 0.83, 0.98]),
      new CapStrictRedemptionWindowAdjuster(23586),
      new StrictRedemptionWindowThresholdOffsetAdjuster(1.49),
    ],
    [],
    4.7,
    42450.6,
  );
}
