import * as numbers from "../../../../kit/numbers.js";
import { ManualEnrollmentAllocation } from "./manual-enrollment-allocation.js";

/** One step of the manual enrollment allocation calculation. */
export interface ManualEnrollmentAllocationAdjuster {
  describe(): string;
  adjust(item: ManualEnrollmentAllocation, value: number): number;
}

export class ManualEnrollmentAllocationScoreOffsetAdjuster implements ManualEnrollmentAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus score times ${this.weight}`;
  }

  adjust(item: ManualEnrollmentAllocation, value: number): number {
    return value + item.score * this.weight;
  }
}

export class SourceManualEnrollmentAllocationAdjuster implements ManualEnrollmentAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ManualEnrollmentAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualEnrollmentAllocationAdjuster implements ManualEnrollmentAllocationAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualEnrollmentAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual enrollment allocation steps in order and keeps a trace of each. */
export class ManualEnrollmentAllocationEngine {
  steps: ManualEnrollmentAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualEnrollmentAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ManualEnrollmentAllocation): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: ManualEnrollmentAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultManualEnrollmentAllocationEngine(): ManualEnrollmentAllocationEngine {
  return new ManualEnrollmentAllocationEngine(
    [
      new ManualEnrollmentAllocationScoreOffsetAdjuster(1.31),
      new SourceManualEnrollmentAllocationAdjuster(new Map<string, number>([["north", 1.1]])),
      new PercentManualEnrollmentAllocationAdjuster(20.7),
    ],
    [],
    1.7,
    21640.2,
  );
}
