import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { StrictWindowProfile } from "./strict-window-profile.js";

/** One step of the strict window profile calculation. */
export interface StrictWindowProfileModifier {
  describe(): string;
  adjust(item: StrictWindowProfile, value: number): number;
}

export class RoundingStrictWindowProfileAdjuster implements StrictWindowProfileModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: StrictWindowProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumStrictWindowProfileAdjuster implements StrictWindowProfileModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictWindowProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class SourceStrictWindowProfileAdjuster implements StrictWindowProfileModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: StrictWindowProfile, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentStrictWindowProfileAdjuster implements StrictWindowProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictWindowProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedStrictWindowProfileAdjuster implements StrictWindowProfileModifier {
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

  adjust(item: StrictWindowProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictWindowProfileAdjuster implements StrictWindowProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictWindowProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the strict window profile steps in order and keeps a trace of each. */
export class StrictWindowProfileEngine {
  steps: StrictWindowProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictWindowProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: StrictWindowProfile): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: StrictWindowProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultStrictWindowProfileEngine(flagsValue: flags.Registry): StrictWindowProfileEngine {
  return new StrictWindowProfileEngine(
    [
      new RoundingStrictWindowProfileAdjuster(0.5),
      new MinimumStrictWindowProfileAdjuster(46.9),
      new SourceStrictWindowProfileAdjuster(new Map<string, number>([["east", 0.93]])),
      new PercentStrictWindowProfileAdjuster(17.9),
      new FlaggedStrictWindowProfileAdjuster(flagsValue, "strict-window-profile-capped", 7.3),
      new CapStrictWindowProfileAdjuster(5023),
    ],
    [],
    3.5,
    86785.6,
  );
}
