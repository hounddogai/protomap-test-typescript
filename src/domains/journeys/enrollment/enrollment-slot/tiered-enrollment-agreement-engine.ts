import * as flags from "../../../../kit/flags.js";
import { TieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

/** One step of the tiered enrollment agreement calculation. */
export interface TieredEnrollmentAgreementFactor {
  describe(): string;
  adjust(item: TieredEnrollmentAgreement, value: number): number;
}

export class CapTieredEnrollmentAgreementAdjuster implements TieredEnrollmentAgreementFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: TieredEnrollmentAgreement, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentTieredEnrollmentAgreementAdjuster implements TieredEnrollmentAgreementFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: TieredEnrollmentAgreement, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredTieredEnrollmentAgreementAdjuster implements TieredEnrollmentAgreementFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: TieredEnrollmentAgreement, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumTieredEnrollmentAgreementAdjuster implements TieredEnrollmentAgreementFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: TieredEnrollmentAgreement, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredEnrollmentAgreementImpressionsOffsetAdjuster implements TieredEnrollmentAgreementFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: TieredEnrollmentAgreement, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class FlaggedTieredEnrollmentAgreementAdjuster implements TieredEnrollmentAgreementFactor {
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

  adjust(item: TieredEnrollmentAgreement, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the tiered enrollment agreement steps in order and keeps a trace of each. */
export class TieredEnrollmentAgreementEngine {
  steps: TieredEnrollmentAgreementFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: TieredEnrollmentAgreementFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: TieredEnrollmentAgreement): number {
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

  evaluateAll(items: TieredEnrollmentAgreement[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultTieredEnrollmentAgreementEngine(flagsValue: flags.Registry): TieredEnrollmentAgreementEngine {
  return new TieredEnrollmentAgreementEngine(
    [
      new CapTieredEnrollmentAgreementAdjuster(15404),
      new PercentTieredEnrollmentAgreementAdjuster(23.3),
      new TieredTieredEnrollmentAgreementAdjuster([4542, 7550, 8535], [0.98, 1.09, 0.85]),
      new MinimumTieredEnrollmentAgreementAdjuster(40.9),
      new TieredEnrollmentAgreementImpressionsOffsetAdjuster(0.37),
      new FlaggedTieredEnrollmentAgreementAdjuster(flagsValue, "tiered-enrollment-agreement-fallback", 2.2),
    ],
    [],
    2.8,
    16453.3,
  );
}
