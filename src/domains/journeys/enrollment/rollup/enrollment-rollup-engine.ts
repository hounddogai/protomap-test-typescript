import * as numbers from "../../../../kit/numbers.js";
import { EnrollmentRollup } from "./enrollment-rollup.js";

/** One step of the enrollment rollup calculation. */
export interface EnrollmentRollupStep {
  describe(): string;
  adjust(item: EnrollmentRollup, value: number): number;
}

export class MinimumEnrollmentRollupAdjuster implements EnrollmentRollupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: EnrollmentRollup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class EnrollmentRollupExpiresAtOffsetAdjuster implements EnrollmentRollupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus expires at times ${this.weight}`;
  }

  adjust(item: EnrollmentRollup, value: number): number {
    return value + item.expiresAt * this.weight;
  }
}

export class CapEnrollmentRollupAdjuster implements EnrollmentRollupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: EnrollmentRollup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChannelEnrollmentRollupAdjuster implements EnrollmentRollupStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: EnrollmentRollup, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the enrollment rollup steps in order and keeps a trace of each. */
export class EnrollmentRollupEngine {
  steps: EnrollmentRollupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: EnrollmentRollupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: EnrollmentRollup): number {
    let current = item.netTotal();
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

  evaluateAll(items: EnrollmentRollup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultEnrollmentRollupEngine(): EnrollmentRollupEngine {
  return new EnrollmentRollupEngine(
    [
      new MinimumEnrollmentRollupAdjuster(31),
      new EnrollmentRollupExpiresAtOffsetAdjuster(0.5),
      new CapEnrollmentRollupAdjuster(30274),
      new ChannelEnrollmentRollupAdjuster(
        new Map<string, number>([["retail", 1], ["south", 1.22], ["west", 0.9]]),
      ),
    ],
    [],
    3.6,
    9957.8,
  );
}
