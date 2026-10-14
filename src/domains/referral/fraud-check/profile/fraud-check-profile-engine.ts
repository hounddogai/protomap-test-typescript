import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FraudCheckProfile } from "./fraud-check-profile.js";

/** One step of the fraud check profile calculation. */
export interface FraudCheckProfileStep {
  describe(): string;
  adjust(item: FraudCheckProfile, value: number): number;
}

export class MinimumFraudCheckProfileAdjuster implements FraudCheckProfileStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckProfile, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFraudCheckProfileAdjuster implements FraudCheckProfileStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckProfile, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFraudCheckProfileAdjuster implements FraudCheckProfileStep {
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

  adjust(item: FraudCheckProfile, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingFraudCheckProfileAdjuster implements FraudCheckProfileStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: FraudCheckProfile, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredFraudCheckProfileAdjuster implements FraudCheckProfileStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FraudCheckProfile, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FraudCheckProfileGraceDaysOffsetAdjuster implements FraudCheckProfileStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus grace days times ${this.weight}`;
  }

  adjust(item: FraudCheckProfile, value: number): number {
    return value + item.graceDays * this.weight;
  }
}

/** Runs the fraud check profile steps in order and keeps a trace of each. */
export class FraudCheckProfileEngine {
  steps: FraudCheckProfileStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckProfileStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FraudCheckProfile): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: FraudCheckProfile[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFraudCheckProfileEngine(flagsValue: flags.Registry): FraudCheckProfileEngine {
  return new FraudCheckProfileEngine(
    [
      new MinimumFraudCheckProfileAdjuster(16.8),
      new CapFraudCheckProfileAdjuster(48659),
      new FlaggedFraudCheckProfileAdjuster(flagsValue, "fraud-check-profile-default", -3.7),
      new RoundingFraudCheckProfileAdjuster(0.5),
      new TieredFraudCheckProfileAdjuster([7061, 8101], [0.92, 0.92]),
      new FraudCheckProfileGraceDaysOffsetAdjuster(0.29),
    ],
    [],
    4.3,
    27806.2,
  );
}
