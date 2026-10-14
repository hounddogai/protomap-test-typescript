import * as numbers from "../../../../kit/numbers.js";
import { DoubleOptInAssignment } from "./double-opt-in-assignment.js";

/** One step of the double opt in assignment calculation. */
export interface DoubleOptInAssignmentStep {
  describe(): string;
  adjust(item: DoubleOptInAssignment, value: number): number;
}

export class DoubleOptInAssignmentFloorValueOffsetAdjuster implements DoubleOptInAssignmentStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: DoubleOptInAssignment, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class SegmentDoubleOptInAssignmentAdjuster implements DoubleOptInAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: DoubleOptInAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentDoubleOptInAssignmentAdjuster implements DoubleOptInAssignmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DoubleOptInAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapDoubleOptInAssignmentAdjuster implements DoubleOptInAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DoubleOptInAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the double opt in assignment steps in order and keeps a trace of each. */
export class DoubleOptInAssignmentEngine {
  steps: DoubleOptInAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DoubleOptInAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: DoubleOptInAssignment): number {
    let current = item.netLoad();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: DoubleOptInAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultDoubleOptInAssignmentEngine(): DoubleOptInAssignmentEngine {
  return new DoubleOptInAssignmentEngine(
    [
      new DoubleOptInAssignmentFloorValueOffsetAdjuster(0.52),
      new SegmentDoubleOptInAssignmentAdjuster(
        new Map<string, number>([["retail", 0.97], ["south", 0.95], ["east", 1.04]]),
      ),
      new PercentDoubleOptInAssignmentAdjuster(-6.8),
      new CapDoubleOptInAssignmentAdjuster(30638),
    ],
    [],
    4.3,
    27066,
  );
}
