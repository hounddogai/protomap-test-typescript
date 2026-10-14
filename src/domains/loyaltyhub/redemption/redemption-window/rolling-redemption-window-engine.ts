import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingRedemptionWindow } from "./rolling-redemption-window.js";

/** One step of the rolling redemption window calculation. */
export interface RollingRedemptionWindowAdjuster {
  describe(): string;
  adjust(item: RollingRedemptionWindow, value: number): number;
}

export class FlaggedRollingRedemptionWindowAdjuster implements RollingRedemptionWindowAdjuster {
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

  adjust(item: RollingRedemptionWindow, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RollingRedemptionWindowEndsAtOffsetAdjuster implements RollingRedemptionWindowAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: RollingRedemptionWindow, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class RegionRollingRedemptionWindowAdjuster implements RollingRedemptionWindowAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by region";
  }

  adjust(item: RollingRedemptionWindow, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredRollingRedemptionWindowAdjuster implements RollingRedemptionWindowAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingRedemptionWindow, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapRollingRedemptionWindowAdjuster implements RollingRedemptionWindowAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingRedemptionWindow, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentRollingRedemptionWindowAdjuster implements RollingRedemptionWindowAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RollingRedemptionWindow, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the rolling redemption window steps in order and keeps a trace of each. */
export class RollingRedemptionWindowEngine {
  steps: RollingRedemptionWindowAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingRedemptionWindowAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RollingRedemptionWindow): number {
    let current = item.measuredValue();
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

  evaluateAll(items: RollingRedemptionWindow[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRollingRedemptionWindowEngine(flagsValue: flags.Registry): RollingRedemptionWindowEngine {
  return new RollingRedemptionWindowEngine(
    [
      new FlaggedRollingRedemptionWindowAdjuster(flagsValue, "rolling-redemption-window-capped", 1.1),
      new RollingRedemptionWindowEndsAtOffsetAdjuster(1.91),
      new RegionRollingRedemptionWindowAdjuster(new Map<string, number>([["east", 1.01]])),
      new TieredRollingRedemptionWindowAdjuster([65, 1777, 4974], [0.99, 0.94, 0.92]),
      new CapRollingRedemptionWindowAdjuster(32327),
      new PercentRollingRedemptionWindowAdjuster(-5.9),
    ],
    [],
    0.1,
    46557.5,
  );
}
