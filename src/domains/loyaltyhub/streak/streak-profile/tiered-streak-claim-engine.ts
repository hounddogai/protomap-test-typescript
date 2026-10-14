import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { TieredStreakClaim } from "./tiered-streak-claim.js";

/** One step of the tiered streak claim calculation. */
export interface TieredStreakClaimStep {
  describe(): string;
  adjust(item: TieredStreakClaim, value: number): number;
}

export class RoundingTieredStreakClaimAdjuster implements TieredStreakClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: TieredStreakClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapTieredStreakClaimAdjuster implements TieredStreakClaimStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredStreakClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumTieredStreakClaimAdjuster implements TieredStreakClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredStreakClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedTieredStreakClaimAdjuster implements TieredStreakClaimStep {
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

  adjust(item: TieredStreakClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered streak claim steps in order and keeps a trace of each. */
export class TieredStreakClaimEngine {
  steps: TieredStreakClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredStreakClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: TieredStreakClaim): number {
    let current = item.effectiveValue();
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

  evaluateAll(items: TieredStreakClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultTieredStreakClaimEngine(flagsValue: flags.Registry): TieredStreakClaimEngine {
  return new TieredStreakClaimEngine(
    [
      new RoundingTieredStreakClaimAdjuster(0.05),
      new CapTieredStreakClaimAdjuster(16561),
      new MinimumTieredStreakClaimAdjuster(0.9),
      new FlaggedTieredStreakClaimAdjuster(flagsValue, "tiered-streak-claim-tiered", 6.5),
    ],
    [],
    2.1,
    27336.5,
  );
}
