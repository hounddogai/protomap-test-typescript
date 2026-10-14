import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInProfile } from "./double-opt-in-profile.js";

/** One step of the double opt in profile calculation. */
export interface DoubleOptInProfileAdjuster {
  describe(): string;
  adjust(item: DoubleOptInProfile, value: number): number;
}

export class RoundingDoubleOptInProfileAdjuster implements DoubleOptInProfileAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DoubleOptInProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentDoubleOptInProfileAdjuster implements DoubleOptInProfileAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDoubleOptInProfileAdjuster implements DoubleOptInProfileAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedDoubleOptInProfileAdjuster implements DoubleOptInProfileAdjuster {
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

  adjust(item: DoubleOptInProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredDoubleOptInProfileAdjuster implements DoubleOptInProfileAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DoubleOptInProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceDoubleOptInProfileAdjuster implements DoubleOptInProfileAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: DoubleOptInProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the double opt in profile steps in order and keeps a trace of each. */
export class DoubleOptInProfileEngine {
  steps: DoubleOptInProfileAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInProfileAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DoubleOptInProfile): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: DoubleOptInProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDoubleOptInProfileEngine(flagsValue: flags.Registry): DoubleOptInProfileEngine {
  return new DoubleOptInProfileEngine(
    [
      new RoundingDoubleOptInProfileAdjuster(5),
      new PercentDoubleOptInProfileAdjuster(8.5),
      new CapDoubleOptInProfileAdjuster(39780),
      new FlaggedDoubleOptInProfileAdjuster(flagsValue, "double-opt-in-profile-tiered", -4),
      new TieredDoubleOptInProfileAdjuster([2993, 5864, 5917, 7844], [0.9, 0.8, 0.88, 1.1]),
      new UtmSourceDoubleOptInProfileAdjuster(
        new Map<string, number>([["north", 0.81], ["online", 1.35], ["retail", 0.94]]),
      ),
    ],
    [],
    3.1,
    18294.5,
  );
}
