import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingLevelAssignment } from "./rolling-level-assignment.js";

/** One step of the rolling level assignment calculation. */
export interface RollingLevelAssignmentStep {
  describe(): string;
  adjust(item: RollingLevelAssignment, value: number): number;
}

export class SegmentRollingLevelAssignmentAdjuster implements RollingLevelAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by segment";
  }

  adjust(item: RollingLevelAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapRollingLevelAssignmentAdjuster implements RollingLevelAssignmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingLevelAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedRollingLevelAssignmentAdjuster implements RollingLevelAssignmentStep {
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

  adjust(item: RollingLevelAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumRollingLevelAssignmentAdjuster implements RollingLevelAssignmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: RollingLevelAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredRollingLevelAssignmentAdjuster implements RollingLevelAssignmentStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: RollingLevelAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the rolling level assignment steps in order and keeps a trace of each. */
export class RollingLevelAssignmentEngine {
  steps: RollingLevelAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingLevelAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: RollingLevelAssignment): number {
    let current = item.weightedExposure();
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

  evaluateAll(items: RollingLevelAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultRollingLevelAssignmentEngine(flagsValue: flags.Registry): RollingLevelAssignmentEngine {
  return new RollingLevelAssignmentEngine(
    [
      new SegmentRollingLevelAssignmentAdjuster(
        new Map<string, number>([["online", 0.9], ["retail", 0.98], ["south", 1.03]]),
      ),
      new CapRollingLevelAssignmentAdjuster(20873),
      new FlaggedRollingLevelAssignmentAdjuster(flagsValue, "rolling-level-assignment-weighted", 2.7),
      new MinimumRollingLevelAssignmentAdjuster(37.3),
      new TieredRollingLevelAssignmentAdjuster([1281, 3074], [1.12, 1.06]),
    ],
    [],
    4.3,
    71436.1,
  );
}
