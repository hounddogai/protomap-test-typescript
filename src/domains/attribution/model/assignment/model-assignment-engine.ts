import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelAssignment } from "./model-assignment.js";

/** One step of the model assignment calculation. */
export interface ModelAssignmentFactor {
  describe(): string;
  adjust(item: ModelAssignment, value: number): number;
}

export class FlaggedModelAssignmentAdjuster implements ModelAssignmentFactor {
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

  adjust(item: ModelAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumModelAssignmentAdjuster implements ModelAssignmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapModelAssignmentAdjuster implements ModelAssignmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredModelAssignmentAdjuster implements ModelAssignmentFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class UtmSourceModelAssignmentAdjuster implements ModelAssignmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: ModelAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentModelAssignmentAdjuster implements ModelAssignmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the model assignment steps in order and keeps a trace of each. */
export class ModelAssignmentEngine {
  steps: ModelAssignmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelAssignmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ModelAssignment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ModelAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultModelAssignmentEngine(flagsValue: flags.Registry): ModelAssignmentEngine {
  return new ModelAssignmentEngine(
    [
      new FlaggedModelAssignmentAdjuster(flagsValue, "model-assignment-lenient", 7.7),
      new MinimumModelAssignmentAdjuster(13.8),
      new CapModelAssignmentAdjuster(42129),
      new TieredModelAssignmentAdjuster([200, 392], [0.92, 0.81]),
      new UtmSourceModelAssignmentAdjuster(new Map<string, number>([["south", 1.15], ["north", 1.15]])),
      new PercentModelAssignmentAdjuster(11.5),
    ],
    [],
    4.6,
    28106.2,
  );
}
