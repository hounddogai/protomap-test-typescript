import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PendingOptOutProfile } from "./pending-opt-out-profile.js";

/** One step of the pending opt out profile calculation. */
export interface PendingOptOutProfileModifier {
  describe(): string;
  adjust(item: PendingOptOutProfile, value: number): number;
}

export class PercentPendingOptOutProfileAdjuster implements PendingOptOutProfileModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PendingOptOutProfile, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapPendingOptOutProfileAdjuster implements PendingOptOutProfileModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PendingOptOutProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPendingOptOutProfileAdjuster implements PendingOptOutProfileModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PendingOptOutProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPendingOptOutProfileAdjuster implements PendingOptOutProfileModifier {
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

  adjust(item: PendingOptOutProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the pending opt out profile steps in order and keeps a trace of each. */
export class PendingOptOutProfileEngine {
  steps: PendingOptOutProfileModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PendingOptOutProfileModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: PendingOptOutProfile): number {
    let current = item.netExposure();
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

  evaluateAll(items: PendingOptOutProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultPendingOptOutProfileEngine(flagsValue: flags.Registry): PendingOptOutProfileEngine {
  return new PendingOptOutProfileEngine(
    [
      new PercentPendingOptOutProfileAdjuster(-14.9),
      new CapPendingOptOutProfileAdjuster(9641),
      new TieredPendingOptOutProfileAdjuster([121, 417, 6295, 8487], [0.85, 0.83, 0.97, 0.86]),
      new FlaggedPendingOptOutProfileAdjuster(flagsValue, "pending-opt-out-profile-rolling", -3.1),
    ],
    [],
    4,
    35839.2,
  );
}
