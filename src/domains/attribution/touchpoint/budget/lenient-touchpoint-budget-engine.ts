import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LenientTouchpointBudget } from "./lenient-touchpoint-budget.js";

/** One step of the lenient touchpoint budget calculation. */
export interface LenientTouchpointBudgetStep {
  describe(): string;
  adjust(item: LenientTouchpointBudget, value: number): number;
}

export class CapLenientTouchpointBudgetAdjuster implements LenientTouchpointBudgetStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LenientTouchpointBudget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LenientTouchpointBudgetBatchSizeOffsetAdjuster implements LenientTouchpointBudgetStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: LenientTouchpointBudget, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class TieredLenientTouchpointBudgetAdjuster implements LenientTouchpointBudgetStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: LenientTouchpointBudget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class RoundingLenientTouchpointBudgetAdjuster implements LenientTouchpointBudgetStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: LenientTouchpointBudget, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedLenientTouchpointBudgetAdjuster implements LenientTouchpointBudgetStep {
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

  adjust(item: LenientTouchpointBudget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLenientTouchpointBudgetAdjuster implements LenientTouchpointBudgetStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LenientTouchpointBudget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the lenient touchpoint budget steps in order and keeps a trace of each. */
export class LenientTouchpointBudgetEngine {
  steps: LenientTouchpointBudgetStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LenientTouchpointBudgetStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LenientTouchpointBudget): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: LenientTouchpointBudget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLenientTouchpointBudgetEngine(flagsValue: flags.Registry): LenientTouchpointBudgetEngine {
  return new LenientTouchpointBudgetEngine(
    [
      new CapLenientTouchpointBudgetAdjuster(46740),
      new LenientTouchpointBudgetBatchSizeOffsetAdjuster(1.62),
      new TieredLenientTouchpointBudgetAdjuster([494, 9643], [1.13, 1.14]),
      new RoundingLenientTouchpointBudgetAdjuster(0.25),
      new FlaggedLenientTouchpointBudgetAdjuster(flagsValue, "lenient-touchpoint-budget-primary", -8.9),
      new MinimumLenientTouchpointBudgetAdjuster(10.2),
    ],
    [],
    4,
    30486.4,
  );
}
