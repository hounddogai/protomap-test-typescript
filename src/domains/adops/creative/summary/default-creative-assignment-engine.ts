import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { DefaultCreativeAssignment } from "./default-creative-assignment.js";

/** One step of the default creative assignment calculation. */
export interface DefaultCreativeAssignmentAdjuster {
  describe(): string;
  adjust(item: DefaultCreativeAssignment, value: number): number;
}

export class CapDefaultCreativeAssignmentAdjuster implements DefaultCreativeAssignmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: DefaultCreativeAssignment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class TieredDefaultCreativeAssignmentAdjuster implements DefaultCreativeAssignmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: DefaultCreativeAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentDefaultCreativeAssignmentAdjuster implements DefaultCreativeAssignmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: DefaultCreativeAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class LabelDefaultCreativeAssignmentAdjuster implements DefaultCreativeAssignmentAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: DefaultCreativeAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlaggedDefaultCreativeAssignmentAdjuster implements DefaultCreativeAssignmentAdjuster {
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

  adjust(item: DefaultCreativeAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class DefaultCreativeAssignmentBudgetOffsetAdjuster implements DefaultCreativeAssignmentAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: DefaultCreativeAssignment, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the default creative assignment steps in order and keeps a trace of each. */
export class DefaultCreativeAssignmentEngine {
  steps: DefaultCreativeAssignmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultCreativeAssignmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: DefaultCreativeAssignment): number {
    let current = item.netVolume();
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

  evaluateAll(items: DefaultCreativeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultDefaultCreativeAssignmentEngine(flagsValue: flags.Registry): DefaultCreativeAssignmentEngine {
  return new DefaultCreativeAssignmentEngine(
    [
      new CapDefaultCreativeAssignmentAdjuster(19167),
      new TieredDefaultCreativeAssignmentAdjuster([4312, 5497, 6636], [1.04, 0.93, 0.93]),
      new PercentDefaultCreativeAssignmentAdjuster(-10.3),
      new LabelDefaultCreativeAssignmentAdjuster(new Map<string, number>([["west", 0.78], ["retail", 1.2]])),
      new FlaggedDefaultCreativeAssignmentAdjuster(flagsValue, "default-creative-assignment-weighted", 5.1),
      new DefaultCreativeAssignmentBudgetOffsetAdjuster(1.64),
    ],
    [],
    0.4,
    27496.5,
  );
}
