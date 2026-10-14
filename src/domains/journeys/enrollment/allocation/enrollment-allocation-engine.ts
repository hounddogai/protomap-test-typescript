import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentAllocation } from "./enrollment-allocation.js";

/** One step of the enrollment allocation calculation. */
export interface EnrollmentAllocationFactor {
  describe(): string;
  adjust(item: EnrollmentAllocation, value: number): number;
}

export class ChannelEnrollmentAllocationAdjuster implements EnrollmentAllocationFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: EnrollmentAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentEnrollmentAllocationAdjuster implements EnrollmentAllocationFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: EnrollmentAllocation, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedEnrollmentAllocationAdjuster implements EnrollmentAllocationFactor {
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

  adjust(item: EnrollmentAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the enrollment allocation steps in order and keeps a trace of each. */
export class EnrollmentAllocationEngine {
  steps: EnrollmentAllocationFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentAllocationFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentAllocation): number {
    let current = item.effectiveLoad();
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

  evaluateAll(items: EnrollmentAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentAllocationEngine(flagsValue: flags.Registry): EnrollmentAllocationEngine {
  return new EnrollmentAllocationEngine(
    [
      new ChannelEnrollmentAllocationAdjuster(
        new Map<string, number>([["west", 1.31], ["retail", 0.88], ["north", 0.89]]),
      ),
      new PercentEnrollmentAllocationAdjuster(3.5),
      new FlaggedEnrollmentAllocationAdjuster(flagsValue, "enrollment-allocation-tiered", 2.8),
    ],
    [],
    4.8,
    17328.1,
  );
}
