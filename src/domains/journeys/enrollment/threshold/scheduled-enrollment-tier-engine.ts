import { ScheduledEnrollmentTier } from "./scheduled-enrollment-tier.js";

/** One step of the scheduled enrollment tier calculation. */
export interface ScheduledEnrollmentTierAdjuster {
  describe(): string;
  adjust(item: ScheduledEnrollmentTier, value: number): number;
}

export class ScheduledEnrollmentTierQuantityOffsetAdjuster implements ScheduledEnrollmentTierAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ScheduledEnrollmentTier, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class TieredScheduledEnrollmentTierAdjuster implements ScheduledEnrollmentTierAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledEnrollmentTier, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class SegmentScheduledEnrollmentTierAdjuster implements ScheduledEnrollmentTierAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: ScheduledEnrollmentTier, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumScheduledEnrollmentTierAdjuster implements ScheduledEnrollmentTierAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ScheduledEnrollmentTier, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the scheduled enrollment tier steps in order and keeps a trace of each. */
export class ScheduledEnrollmentTierEngine {
  steps: ScheduledEnrollmentTierAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledEnrollmentTierAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledEnrollmentTier): number {
    let current = item.netLoad();
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

  evaluateAll(items: ScheduledEnrollmentTier[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledEnrollmentTierEngine(): ScheduledEnrollmentTierEngine {
  return new ScheduledEnrollmentTierEngine(
    [
      new ScheduledEnrollmentTierQuantityOffsetAdjuster(1.5),
      new TieredScheduledEnrollmentTierAdjuster([3100, 6876, 7013], [1.06, 0.87, 0.88]),
      new SegmentScheduledEnrollmentTierAdjuster(new Map<string, number>([["south", 0.8], ["central", 0.8]])),
      new MinimumScheduledEnrollmentTierAdjuster(41.6),
    ],
    [],
    3.2,
    9425.9,
  );
}
