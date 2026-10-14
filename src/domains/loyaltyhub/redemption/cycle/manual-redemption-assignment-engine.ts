import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualRedemptionAssignment } from "./manual-redemption-assignment.js";

/** One step of the manual redemption assignment calculation. */
export interface ManualRedemptionAssignmentFactor {
  describe(): string;
  adjust(item: ManualRedemptionAssignment, value: number): number;
}

export class ManualRedemptionAssignmentWindowDaysOffsetAdjuster implements ManualRedemptionAssignmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus window days times ${this.weight}`;
  }

  adjust(item: ManualRedemptionAssignment, value: number): number {
    return value + item.windowDays * this.weight;
  }
}

export class MinimumManualRedemptionAssignmentAdjuster implements ManualRedemptionAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualRedemptionAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualRedemptionAssignmentAdjuster implements ManualRedemptionAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualRedemptionAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentManualRedemptionAssignmentAdjuster implements ManualRedemptionAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualRedemptionAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingManualRedemptionAssignmentAdjuster implements ManualRedemptionAssignmentFactor {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualRedemptionAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedManualRedemptionAssignmentAdjuster implements ManualRedemptionAssignmentFactor {
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

  adjust(item: ManualRedemptionAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual redemption assignment steps in order and keeps a trace of each. */
export class ManualRedemptionAssignmentEngine {
  steps: ManualRedemptionAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualRedemptionAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ManualRedemptionAssignment): number {
    let current = item.netTotal();
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

  evaluateAll(items: ManualRedemptionAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultManualRedemptionAssignmentEngine(flagsValue: flags.Registry): ManualRedemptionAssignmentEngine {
  return new ManualRedemptionAssignmentEngine(
    [
      new ManualRedemptionAssignmentWindowDaysOffsetAdjuster(1.87),
      new MinimumManualRedemptionAssignmentAdjuster(19.7),
      new TieredManualRedemptionAssignmentAdjuster([774, 8546], [1.09, 1.04]),
      new PercentManualRedemptionAssignmentAdjuster(-22.1),
      new RoundingManualRedemptionAssignmentAdjuster(0.25),
      new FlaggedManualRedemptionAssignmentAdjuster(flagsValue, "manual-redemption-assignment-tiered", -1.9),
    ],
    [],
    0.4,
    38386,
  );
}
