import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { WeightedWaitBaseline } from "./weighted-wait-baseline.js";

/** One step of the weighted wait baseline calculation. */
export interface WeightedWaitBaselineModifier {
  describe(): string;
  adjust(item: WeightedWaitBaseline, value: number): number;
}

export class PercentWeightedWaitBaselineAdjuster implements WeightedWaitBaselineModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WeightedWaitBaseline, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapWeightedWaitBaselineAdjuster implements WeightedWaitBaselineModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WeightedWaitBaseline, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedWeightedWaitBaselineAdjuster implements WeightedWaitBaselineModifier {
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

  adjust(item: WeightedWaitBaseline, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumWeightedWaitBaselineAdjuster implements WeightedWaitBaselineModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WeightedWaitBaseline, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingWeightedWaitBaselineAdjuster implements WeightedWaitBaselineModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: WeightedWaitBaseline, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class UnitWeightedWaitBaselineAdjuster implements WeightedWaitBaselineModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by unit";
  }

  adjust(item: WeightedWaitBaseline, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the weighted wait baseline steps in order and keeps a trace of each. */
export class WeightedWaitBaselineEngine {
  steps: WeightedWaitBaselineModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WeightedWaitBaselineModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: WeightedWaitBaseline): number {
    let current = item.projectedValue();
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

  evaluateAll(items: WeightedWaitBaseline[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultWeightedWaitBaselineEngine(flagsValue: flags.Registry): WeightedWaitBaselineEngine {
  return new WeightedWaitBaselineEngine(
    [
      new PercentWeightedWaitBaselineAdjuster(-0.3),
      new CapWeightedWaitBaselineAdjuster(22951),
      new FlaggedWeightedWaitBaselineAdjuster(flagsValue, "weighted-wait-baseline-weighted", 6.2),
      new MinimumWeightedWaitBaselineAdjuster(34.3),
      new RoundingWeightedWaitBaselineAdjuster(0.05),
      new UnitWeightedWaitBaselineAdjuster(
        new Map<string, number>([["south", 0.88], ["online", 1.31], ["north", 1.39]]),
      ),
    ],
    [],
    2.5,
    25445.4,
  );
}
