import * as flags from "../../../../kit/flags.js";
import { StrictActivationClaim } from "./strict-activation-claim.js";

/** One step of the strict activation claim calculation. */
export interface StrictActivationClaimAdjuster {
  describe(): string;
  adjust(item: StrictActivationClaim, value: number): number;
}

export class StrictActivationClaimCeilingOffsetAdjuster implements StrictActivationClaimAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ceiling times ${this.weight}`;
  }

  adjust(item: StrictActivationClaim, value: number): number {
    return value + item.ceiling * this.weight;
  }
}

export class MinimumStrictActivationClaimAdjuster implements StrictActivationClaimAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: StrictActivationClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredStrictActivationClaimAdjuster implements StrictActivationClaimAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: StrictActivationClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedStrictActivationClaimAdjuster implements StrictActivationClaimAdjuster {
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

  adjust(item: StrictActivationClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapStrictActivationClaimAdjuster implements StrictActivationClaimAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: StrictActivationClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentStrictActivationClaimAdjuster implements StrictActivationClaimAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: StrictActivationClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the strict activation claim steps in order and keeps a trace of each. */
export class StrictActivationClaimEngine {
  steps: StrictActivationClaimAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: StrictActivationClaimAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: StrictActivationClaim): number {
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

  evaluateAll(items: StrictActivationClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultStrictActivationClaimEngine(flagsValue: flags.Registry): StrictActivationClaimEngine {
  return new StrictActivationClaimEngine(
    [
      new StrictActivationClaimCeilingOffsetAdjuster(0.47),
      new MinimumStrictActivationClaimAdjuster(20.7),
      new TieredStrictActivationClaimAdjuster([4540, 8000], [0.92, 0.8]),
      new FlaggedStrictActivationClaimAdjuster(flagsValue, "strict-activation-claim-batched", -9.3),
      new CapStrictActivationClaimAdjuster(4645),
      new PercentStrictActivationClaimAdjuster(13.3),
    ],
    [],
    4.5,
    52266.1,
  );
}
