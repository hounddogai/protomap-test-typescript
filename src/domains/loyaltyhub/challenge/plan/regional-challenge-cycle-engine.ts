import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RegionalChallengeCycle } from "./regional-challenge-cycle.js";

/** One step of the regional challenge cycle calculation. */
export interface RegionalChallengeCycleFactor {
  describe(): string;
  adjust(item: RegionalChallengeCycle, value: number): number;
}

export class RoundingRegionalChallengeCycleAdjuster implements RegionalChallengeCycleFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: RegionalChallengeCycle, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedRegionalChallengeCycleAdjuster implements RegionalChallengeCycleFactor {
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

  adjust(item: RegionalChallengeCycle, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRegionalChallengeCycleAdjuster implements RegionalChallengeCycleFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RegionalChallengeCycle, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumRegionalChallengeCycleAdjuster implements RegionalChallengeCycleFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RegionalChallengeCycle, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentRegionalChallengeCycleAdjuster implements RegionalChallengeCycleFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: RegionalChallengeCycle, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredRegionalChallengeCycleAdjuster implements RegionalChallengeCycleFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RegionalChallengeCycle, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the regional challenge cycle steps in order and keeps a trace of each. */
export class RegionalChallengeCycleEngine {
  steps: RegionalChallengeCycleFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RegionalChallengeCycleFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: RegionalChallengeCycle): number {
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

  evaluateAll(items: RegionalChallengeCycle[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultRegionalChallengeCycleEngine(flagsValue: flags.Registry): RegionalChallengeCycleEngine {
  return new RegionalChallengeCycleEngine(
    [
      new RoundingRegionalChallengeCycleAdjuster(0.25),
      new FlaggedRegionalChallengeCycleAdjuster(flagsValue, "regional-challenge-cycle-rolling", 9.2),
      new CapRegionalChallengeCycleAdjuster(45848),
      new MinimumRegionalChallengeCycleAdjuster(42.4),
      new PercentRegionalChallengeCycleAdjuster(14.7),
      new TieredRegionalChallengeCycleAdjuster([886, 3419, 7411, 8002], [1.1, 1.19, 0.94, 1.16]),
    ],
    [],
    1.5,
    84281.5,
  );
}
