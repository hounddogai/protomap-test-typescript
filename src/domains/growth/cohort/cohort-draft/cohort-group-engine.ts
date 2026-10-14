import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CohortGroup } from "./cohort-group.js";

/** One step of the cohort group calculation. */
export interface CohortGroupStep {
  describe(): string;
  adjust(item: CohortGroup, value: number): number;
}

export class MinimumCohortGroupAdjuster implements CohortGroupStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CohortGroup, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CohortGroupAmountOffsetAdjuster implements CohortGroupStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus amount times ${this.weight}`;
  }

  adjust(item: CohortGroup, value: number): number {
    return value + item.amount * this.weight;
  }
}

export class FlaggedCohortGroupAdjuster implements CohortGroupStep {
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

  adjust(item: CohortGroup, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapCohortGroupAdjuster implements CohortGroupStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: CohortGroup, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingCohortGroupAdjuster implements CohortGroupStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: CohortGroup, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentCohortGroupAdjuster implements CohortGroupStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CohortGroup, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the cohort group steps in order and keeps a trace of each. */
export class CohortGroupEngine {
  steps: CohortGroupStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CohortGroupStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: CohortGroup): number {
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

  evaluateAll(items: CohortGroup[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultCohortGroupEngine(flagsValue: flags.Registry): CohortGroupEngine {
  return new CohortGroupEngine(
    [
      new MinimumCohortGroupAdjuster(34.1),
      new CohortGroupAmountOffsetAdjuster(1.88),
      new FlaggedCohortGroupAdjuster(flagsValue, "cohort-group-weighted", 8.6),
      new CapCohortGroupAdjuster(2456),
      new RoundingCohortGroupAdjuster(0.1),
      new PercentCohortGroupAdjuster(-15.8),
    ],
    [],
    4.9,
    91846.8,
  );
}
