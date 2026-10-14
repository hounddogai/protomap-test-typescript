import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFraudCheckClaim } from "./primary-fraud-check-claim.js";

/** One step of the primary fraud check claim calculation. */
export interface PrimaryFraudCheckClaimModifier {
  describe(): string;
  adjust(item: PrimaryFraudCheckClaim, value: number): number;
}

export class RoundingPrimaryFraudCheckClaimAdjuster implements PrimaryFraudCheckClaimModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFraudCheckClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedPrimaryFraudCheckClaimAdjuster implements PrimaryFraudCheckClaimModifier {
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

  adjust(item: PrimaryFraudCheckClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapPrimaryFraudCheckClaimAdjuster implements PrimaryFraudCheckClaimModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFraudCheckClaim, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPrimaryFraudCheckClaimAdjuster implements PrimaryFraudCheckClaimModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryFraudCheckClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentPrimaryFraudCheckClaimAdjuster implements PrimaryFraudCheckClaimModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryFraudCheckClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the primary fraud check claim steps in order and keeps a trace of each. */
export class PrimaryFraudCheckClaimEngine {
  steps: PrimaryFraudCheckClaimModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFraudCheckClaimModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryFraudCheckClaim): number {
    let current = item.netExposure();
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

  evaluateAll(items: PrimaryFraudCheckClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryFraudCheckClaimEngine(flagsValue: flags.Registry): PrimaryFraudCheckClaimEngine {
  return new PrimaryFraudCheckClaimEngine(
    [
      new RoundingPrimaryFraudCheckClaimAdjuster(0.25),
      new FlaggedPrimaryFraudCheckClaimAdjuster(flagsValue, "primary-fraud-check-claim-lenient", 5.1),
      new CapPrimaryFraudCheckClaimAdjuster(15421),
      new TieredPrimaryFraudCheckClaimAdjuster([805, 7415], [0.98, 1.16]),
      new PercentPrimaryFraudCheckClaimAdjuster(19.3),
    ],
    [],
    0.1,
    29536.8,
  );
}
