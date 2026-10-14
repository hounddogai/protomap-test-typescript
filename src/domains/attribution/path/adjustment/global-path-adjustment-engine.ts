import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalPathAdjustment } from "./global-path-adjustment.js";

/** One step of the global path adjustment calculation. */
export interface GlobalPathAdjustmentStep {
  describe(): string;
  adjust(item: GlobalPathAdjustment, value: number): number;
}

export class PercentGlobalPathAdjustmentAdjuster implements GlobalPathAdjustmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: GlobalPathAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedGlobalPathAdjustmentAdjuster implements GlobalPathAdjustmentStep {
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

  adjust(item: GlobalPathAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceGlobalPathAdjustmentAdjuster implements GlobalPathAdjustmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: GlobalPathAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumGlobalPathAdjustmentAdjuster implements GlobalPathAdjustmentStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: GlobalPathAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingGlobalPathAdjustmentAdjuster implements GlobalPathAdjustmentStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: GlobalPathAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapGlobalPathAdjustmentAdjuster implements GlobalPathAdjustmentStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalPathAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the global path adjustment steps in order and keeps a trace of each. */
export class GlobalPathAdjustmentEngine {
  steps: GlobalPathAdjustmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalPathAdjustmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: GlobalPathAdjustment): number {
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

  evaluateAll(items: GlobalPathAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultGlobalPathAdjustmentEngine(flagsValue: flags.Registry): GlobalPathAdjustmentEngine {
  return new GlobalPathAdjustmentEngine(
    [
      new PercentGlobalPathAdjustmentAdjuster(0.3),
      new FlaggedGlobalPathAdjustmentAdjuster(flagsValue, "global-path-adjustment-legacy", 8.4),
      new UtmSourceGlobalPathAdjustmentAdjuster(new Map<string, number>([["north", 1.11], ["retail", 1.11]])),
      new MinimumGlobalPathAdjustmentAdjuster(12.5),
      new RoundingGlobalPathAdjustmentAdjuster(0.25),
      new CapGlobalPathAdjustmentAdjuster(7217),
    ],
    [],
    1.6,
    88564.5,
  );
}
