import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

/** One step of the fallback enrollment allocation calculation. */
export interface FallbackEnrollmentAllocationAdjuster {
  describe(): string;
  adjust(item: FallbackEnrollmentAllocation, value: number): number;
}

export class CountryFallbackEnrollmentAllocationAdjuster implements FallbackEnrollmentAllocationAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: FallbackEnrollmentAllocation, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedFallbackEnrollmentAllocationAdjuster implements FallbackEnrollmentAllocationAdjuster {
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

  adjust(item: FallbackEnrollmentAllocation, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class FallbackEnrollmentAllocationBatchSizeOffsetAdjuster implements FallbackEnrollmentAllocationAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: FallbackEnrollmentAllocation, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class MinimumFallbackEnrollmentAllocationAdjuster implements FallbackEnrollmentAllocationAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FallbackEnrollmentAllocation, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapFallbackEnrollmentAllocationAdjuster implements FallbackEnrollmentAllocationAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackEnrollmentAllocation, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the fallback enrollment allocation steps in order and keeps a trace of each. */
export class FallbackEnrollmentAllocationEngine {
  steps: FallbackEnrollmentAllocationAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackEnrollmentAllocationAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: FallbackEnrollmentAllocation): number {
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

  evaluateAll(items: FallbackEnrollmentAllocation[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultFallbackEnrollmentAllocationEngine(flagsValue: flags.Registry): FallbackEnrollmentAllocationEngine {
  return new FallbackEnrollmentAllocationEngine(
    [
      new CountryFallbackEnrollmentAllocationAdjuster(
        new Map<string, number>([["retail", 1.02], ["north", 1.28], ["east", 0.91]]),
      ),
      new FlaggedFallbackEnrollmentAllocationAdjuster(flagsValue, "fallback-enrollment-allocation-global", 6.1),
      new FallbackEnrollmentAllocationBatchSizeOffsetAdjuster(0.4),
      new MinimumFallbackEnrollmentAllocationAdjuster(19),
      new CapFallbackEnrollmentAllocationAdjuster(44560),
    ],
    [],
    2.6,
    99842,
  );
}
