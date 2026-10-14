import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedPostAssignment } from "./weighted-post-assignment.js";

/** One step of the weighted post assignment calculation. */
export interface WeightedPostAssignmentAdjuster {
  describe(): string;
  adjust(item: WeightedPostAssignment, value: number): number;
}

export class FlaggedWeightedPostAssignmentAdjuster implements WeightedPostAssignmentAdjuster {
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

  adjust(item: WeightedPostAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CountryWeightedPostAssignmentAdjuster implements WeightedPostAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by country";
  }

  adjust(item: WeightedPostAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumWeightedPostAssignmentAdjuster implements WeightedPostAssignmentAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedPostAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedPostAssignmentAdjuster implements WeightedPostAssignmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedPostAssignment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapWeightedPostAssignmentAdjuster implements WeightedPostAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedPostAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredWeightedPostAssignmentAdjuster implements WeightedPostAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: WeightedPostAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the weighted post assignment steps in order and keeps a trace of each. */
export class WeightedPostAssignmentEngine {
  steps: WeightedPostAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedPostAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WeightedPostAssignment): number {
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

  evaluateAll(items: WeightedPostAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWeightedPostAssignmentEngine(flagsValue: flags.Registry): WeightedPostAssignmentEngine {
  return new WeightedPostAssignmentEngine(
    [
      new FlaggedWeightedPostAssignmentAdjuster(flagsValue, "weighted-post-assignment-legacy", 1.1),
      new CountryWeightedPostAssignmentAdjuster(new Map<string, number>([["west", 1.37]])),
      new MinimumWeightedPostAssignmentAdjuster(35.9),
      new RoundingWeightedPostAssignmentAdjuster(0.05),
      new CapWeightedPostAssignmentAdjuster(20519),
      new TieredWeightedPostAssignmentAdjuster([4568, 4793, 6559, 9035], [1.04, 1.14, 1.07, 0.99]),
    ],
    [],
    2.9,
    5908.4,
  );
}
