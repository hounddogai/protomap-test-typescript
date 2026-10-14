import * as flags from "../../../../kit/flags.js";
import { FraudCheckAssignment } from "./fraud-check-assignment.js";

/** One step of the fraud check assignment calculation. */
export interface FraudCheckAssignmentFactor {
  describe(): string;
  adjust(item: FraudCheckAssignment, value: number): number;
}

export class SegmentFraudCheckAssignmentAdjuster implements FraudCheckAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: FraudCheckAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFraudCheckAssignmentAdjuster implements FraudCheckAssignmentFactor {
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

  adjust(item: FraudCheckAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFraudCheckAssignmentAdjuster implements FraudCheckAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FraudCheckAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFraudCheckAssignmentAdjuster implements FraudCheckAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FraudCheckAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fraud check assignment steps in order and keeps a trace of each. */
export class FraudCheckAssignmentEngine {
  steps: FraudCheckAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FraudCheckAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FraudCheckAssignment): number {
    let current = item.effectiveTotal();
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

  evaluateAll(items: FraudCheckAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFraudCheckAssignmentEngine(flagsValue: flags.Registry): FraudCheckAssignmentEngine {
  return new FraudCheckAssignmentEngine(
    [
      new SegmentFraudCheckAssignmentAdjuster(
        new Map<string, number>([["south", 0.97], ["retail", 1.06], ["central", 0.87]]),
      ),
      new FlaggedFraudCheckAssignmentAdjuster(flagsValue, "fraud-check-assignment-manual", -0.7),
      new MinimumFraudCheckAssignmentAdjuster(44.1),
      new CapFraudCheckAssignmentAdjuster(40909),
    ],
    [],
    2.9,
    38109.6,
  );
}
