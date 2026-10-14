import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualWarmupEstimate } from "./manual-warmup-estimate.js";

/** One step of the manual warmup estimate calculation. */
export interface ManualWarmupEstimateStep {
  describe(): string;
  adjust(item: ManualWarmupEstimate, value: number): number;
}

export class PercentManualWarmupEstimateAdjuster implements ManualWarmupEstimateStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualWarmupEstimate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ManualWarmupEstimatePriorityOffsetAdjuster implements ManualWarmupEstimateStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: ManualWarmupEstimate, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedManualWarmupEstimateAdjuster implements ManualWarmupEstimateStep {
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

  adjust(item: ManualWarmupEstimate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredManualWarmupEstimateAdjuster implements ManualWarmupEstimateStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualWarmupEstimate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class MinimumManualWarmupEstimateAdjuster implements ManualWarmupEstimateStep {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualWarmupEstimate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class RoundingManualWarmupEstimateAdjuster implements ManualWarmupEstimateStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ManualWarmupEstimate, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the manual warmup estimate steps in order and keeps a trace of each. */
export class ManualWarmupEstimateEngine {
  steps: ManualWarmupEstimateStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualWarmupEstimateStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualWarmupEstimate): number {
    let current = item.projectedTotal();
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

  evaluateAll(items: ManualWarmupEstimate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualWarmupEstimateEngine(flagsValue: flags.Registry): ManualWarmupEstimateEngine {
  return new ManualWarmupEstimateEngine(
    [
      new PercentManualWarmupEstimateAdjuster(3.7),
      new ManualWarmupEstimatePriorityOffsetAdjuster(1.08),
      new FlaggedManualWarmupEstimateAdjuster(flagsValue, "manual-warmup-estimate-global", 5.7),
      new TieredManualWarmupEstimateAdjuster([1352, 3709], [0.85, 0.89]),
      new MinimumManualWarmupEstimateAdjuster(45.6),
      new RoundingManualWarmupEstimateAdjuster(0.05),
    ],
    [],
    2.6,
    66728.7,
  );
}
