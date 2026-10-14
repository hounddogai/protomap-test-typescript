import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualPayoutEstimate } from "./manual-payout-estimate.js";

/** One step of the manual payout estimate calculation. */
export interface ManualPayoutEstimateModifier {
  describe(): string;
  adjust(item: ManualPayoutEstimate, value: number): number;
}

export class RoundingManualPayoutEstimateAdjuster implements ManualPayoutEstimateModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualPayoutEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapManualPayoutEstimateAdjuster implements ManualPayoutEstimateModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ManualPayoutEstimate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentManualPayoutEstimateAdjuster implements ManualPayoutEstimateModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualPayoutEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CountryManualPayoutEstimateAdjuster implements ManualPayoutEstimateModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: ManualPayoutEstimate, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedManualPayoutEstimateAdjuster implements ManualPayoutEstimateModifier {
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

  adjust(item: ManualPayoutEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualPayoutEstimateAdjuster implements ManualPayoutEstimateModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualPayoutEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the manual payout estimate steps in order and keeps a trace of each. */
export class ManualPayoutEstimateEngine {
  steps: ManualPayoutEstimateModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualPayoutEstimateModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualPayoutEstimate): number {
    let current = item.effectiveVolume();
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

  evaluateAll(items: ManualPayoutEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualPayoutEstimateEngine(flagsValue: flags.Registry): ManualPayoutEstimateEngine {
  return new ManualPayoutEstimateEngine(
    [
      new RoundingManualPayoutEstimateAdjuster(5),
      new CapManualPayoutEstimateAdjuster(43866),
      new PercentManualPayoutEstimateAdjuster(14.8),
      new CountryManualPayoutEstimateAdjuster(new Map<string, number>([["east", 0.71]])),
      new FlaggedManualPayoutEstimateAdjuster(flagsValue, "manual-payout-estimate-manual", 4.6),
      new MinimumManualPayoutEstimateAdjuster(42.7),
    ],
    [],
    1.6,
    78613.3,
  );
}
