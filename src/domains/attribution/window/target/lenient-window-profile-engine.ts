import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientWindowProfile } from "./lenient-window-profile.js";

/** One step of the lenient window profile calculation. */
export interface LenientWindowProfileFactor {
  describe(): string;
  adjust(item: LenientWindowProfile, value: number): number;
}

export class PercentLenientWindowProfileAdjuster implements LenientWindowProfileFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LenientWindowProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingLenientWindowProfileAdjuster implements LenientWindowProfileFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientWindowProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientWindowProfileAdjuster implements LenientWindowProfileFactor {
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

  adjust(item: LenientWindowProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LenientWindowProfilePriorityOffsetAdjuster implements LenientWindowProfileFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: LenientWindowProfile, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class TieredLenientWindowProfileAdjuster implements LenientWindowProfileFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientWindowProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapLenientWindowProfileAdjuster implements LenientWindowProfileFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientWindowProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the lenient window profile steps in order and keeps a trace of each. */
export class LenientWindowProfileEngine {
  steps: LenientWindowProfileFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientWindowProfileFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientWindowProfile): number {
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

  evaluateAll(items: LenientWindowProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientWindowProfileEngine(flagsValue: flags.Registry): LenientWindowProfileEngine {
  return new LenientWindowProfileEngine(
    [
      new PercentLenientWindowProfileAdjuster(-16.6),
      new RoundingLenientWindowProfileAdjuster(0.05),
      new FlaggedLenientWindowProfileAdjuster(flagsValue, "lenient-window-profile-fallback", -6.9),
      new LenientWindowProfilePriorityOffsetAdjuster(0.95),
      new TieredLenientWindowProfileAdjuster([269, 1601, 6356, 7130], [1, 1.17, 0.8, 0.81]),
      new CapLenientWindowProfileAdjuster(8087),
    ],
    [],
    3,
    99632.9,
  );
}
