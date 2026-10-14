import * as numbers from "../../../../kit/numbers.js";
import { ScheduledCreativeAssignment } from "./scheduled-creative-assignment.js";

/** One step of the scheduled creative assignment calculation. */
export interface ScheduledCreativeAssignmentAdjuster {
  describe(): string;
  adjust(item: ScheduledCreativeAssignment, value: number): number;
}

export class CapScheduledCreativeAssignmentAdjuster implements ScheduledCreativeAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ScheduledCreativeAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredScheduledCreativeAssignmentAdjuster implements ScheduledCreativeAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ScheduledCreativeAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceScheduledCreativeAssignmentAdjuster implements ScheduledCreativeAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ScheduledCreativeAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class ScheduledCreativeAssignmentThresholdOffsetAdjuster implements ScheduledCreativeAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus threshold times ${this.weight}`;
  }

  adjust(item: ScheduledCreativeAssignment, value: number): number {
    return value + item.threshold * this.weight;
  }
}

export class PercentScheduledCreativeAssignmentAdjuster implements ScheduledCreativeAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledCreativeAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the scheduled creative assignment steps in order and keeps a trace of each. */
export class ScheduledCreativeAssignmentEngine {
  steps: ScheduledCreativeAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledCreativeAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledCreativeAssignment): number {
    let current = item.effectiveExposure();
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

  evaluateAll(items: ScheduledCreativeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledCreativeAssignmentEngine(): ScheduledCreativeAssignmentEngine {
  return new ScheduledCreativeAssignmentEngine(
    [
      new CapScheduledCreativeAssignmentAdjuster(40745),
      new TieredScheduledCreativeAssignmentAdjuster([1188, 3751, 7347], [1.19, 0.94, 0.82]),
      new UtmSourceScheduledCreativeAssignmentAdjuster(
        new Map<string, number>([["north", 1.16], ["south", 1.23], ["west", 0.8]]),
      ),
      new ScheduledCreativeAssignmentThresholdOffsetAdjuster(0.87),
      new PercentScheduledCreativeAssignmentAdjuster(-5.8),
    ],
    [],
    4.4,
    91769.4,
  );
}
