import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFraudCheckAssignment } from "./primary-fraud-check-assignment.js";

/** One step of the primary fraud check assignment calculation. */
export interface PrimaryFraudCheckAssignmentAdjuster {
  describe(): string;
  adjust(item: PrimaryFraudCheckAssignment, value: number): number;
}

export class RoundingPrimaryFraudCheckAssignmentAdjuster implements PrimaryFraudCheckAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFraudCheckAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryFraudCheckAssignmentAdjuster implements PrimaryFraudCheckAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFraudCheckAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredPrimaryFraudCheckAssignmentAdjuster implements PrimaryFraudCheckAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: PrimaryFraudCheckAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedPrimaryFraudCheckAssignmentAdjuster implements PrimaryFraudCheckAssignmentAdjuster {
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

  adjust(item: PrimaryFraudCheckAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryFraudCheckAssignmentThresholdOffsetAdjuster implements PrimaryFraudCheckAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: PrimaryFraudCheckAssignment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

/** Runs the primary fraud check assignment steps in order and keeps a trace of each. */
export class PrimaryFraudCheckAssignmentEngine {
  steps: PrimaryFraudCheckAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFraudCheckAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PrimaryFraudCheckAssignment): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PrimaryFraudCheckAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPrimaryFraudCheckAssignmentEngine(flagsValue: flags.Registry): PrimaryFraudCheckAssignmentEngine {
  return new PrimaryFraudCheckAssignmentEngine(
    [
      new RoundingPrimaryFraudCheckAssignmentAdjuster(0.1),
      new CapPrimaryFraudCheckAssignmentAdjuster(36125),
      new TieredPrimaryFraudCheckAssignmentAdjuster([757, 2135, 2197], [1.12, 1.04, 0.96]),
      new FlaggedPrimaryFraudCheckAssignmentAdjuster(flagsValue, "primary-fraud-check-assignment-batched", -6.7),
      new PrimaryFraudCheckAssignmentThresholdOffsetAdjuster(1.41),
    ],
    [],
    2.4,
    91355.2,
  );
}
