import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryOptOutClaim } from "./primary-opt-out-claim.js";

/** One step of the primary opt out claim calculation. */
export interface PrimaryOptOutClaimStep {
  describe(): string;
  adjust(item: PrimaryOptOutClaim, value: number): number;
}

export class PercentPrimaryOptOutClaimAdjuster implements PrimaryOptOutClaimStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryOptOutClaim, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedPrimaryOptOutClaimAdjuster implements PrimaryOptOutClaimStep {
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

  adjust(item: PrimaryOptOutClaim, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryOptOutClaimAdjuster implements PrimaryOptOutClaimStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryOptOutClaim, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class MinimumPrimaryOptOutClaimAdjuster implements PrimaryOptOutClaimStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: PrimaryOptOutClaim, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredPrimaryOptOutClaimAdjuster implements PrimaryOptOutClaimStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryOptOutClaim, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class LabelPrimaryOptOutClaimAdjuster implements PrimaryOptOutClaimStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: PrimaryOptOutClaim, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the primary opt out claim steps in order and keeps a trace of each. */
export class PrimaryOptOutClaimEngine {
  steps: PrimaryOptOutClaimStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryOptOutClaimStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryOptOutClaim): number {
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

  evaluateAll(items: PrimaryOptOutClaim[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryOptOutClaimEngine(flagsValue: flags.Registry): PrimaryOptOutClaimEngine {
  return new PrimaryOptOutClaimEngine(
    [
      new PercentPrimaryOptOutClaimAdjuster(-13.2),
      new FlaggedPrimaryOptOutClaimAdjuster(flagsValue, "primary-opt-out-claim-tiered", 9),
      new RoundingPrimaryOptOutClaimAdjuster(1),
      new MinimumPrimaryOptOutClaimAdjuster(5),
      new TieredPrimaryOptOutClaimAdjuster([6826, 7843], [1.04, 0.81]),
      new LabelPrimaryOptOutClaimAdjuster(new Map<string, number>([["retail", 1.25], ["online", 1.2]])),
    ],
    [],
    4.9,
    24396.4,
  );
}
