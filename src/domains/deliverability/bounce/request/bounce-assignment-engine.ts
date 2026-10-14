import * as flags from "../../../../kit/flags.js";
import { BounceAssignment } from "./bounce-assignment.js";

/** One step of the bounce assignment calculation. */
export interface BounceAssignmentAdjuster {
  describe(): string;
  adjust(item: BounceAssignment, value: number): number;
}

export class TieredBounceAssignmentAdjuster implements BounceAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: BounceAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class FlaggedBounceAssignmentAdjuster implements BounceAssignmentAdjuster {
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

  adjust(item: BounceAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumBounceAssignmentAdjuster implements BounceAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: BounceAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class BounceAssignmentLimitOffsetAdjuster implements BounceAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus limit times ${this.weight}`;
  }

  adjust(item: BounceAssignment, value: number): number {
    return value + item.limit * this.weight;
  }
}

/** Runs the bounce assignment steps in order and keeps a trace of each. */
export class BounceAssignmentEngine {
  steps: BounceAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: BounceAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: BounceAssignment): number {
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

  evaluateAll(items: BounceAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultBounceAssignmentEngine(flagsValue: flags.Registry): BounceAssignmentEngine {
  return new BounceAssignmentEngine(
    [
      new TieredBounceAssignmentAdjuster([2168, 5709, 7648], [1.01, 0.82, 0.87]),
      new FlaggedBounceAssignmentAdjuster(flagsValue, "bounce-assignment-seasonal", 4.6),
      new MinimumBounceAssignmentAdjuster(16.1),
      new BounceAssignmentLimitOffsetAdjuster(1.96),
    ],
    [],
    1.9,
    15258.4,
  );
}
