import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveWaitAdjustment } from "./adaptive-wait-adjustment.js";

/** One step of the adaptive wait adjustment calculation. */
export interface AdaptiveWaitAdjustmentFactor {
  describe(): string;
  adjust(item: AdaptiveWaitAdjustment, value: number): number;
}

export class FlaggedAdaptiveWaitAdjustmentAdjuster implements AdaptiveWaitAdjustmentFactor {
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

  adjust(item: AdaptiveWaitAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveWaitAdjustmentAdjuster implements AdaptiveWaitAdjustmentFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveWaitAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameAdaptiveWaitAdjustmentAdjuster implements AdaptiveWaitAdjustmentFactor {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: AdaptiveWaitAdjustment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class MinimumAdaptiveWaitAdjustmentAdjuster implements AdaptiveWaitAdjustmentFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveWaitAdjustment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class CapAdaptiveWaitAdjustmentAdjuster implements AdaptiveWaitAdjustmentFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveWaitAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class AdaptiveWaitAdjustmentBudgetOffsetAdjuster implements AdaptiveWaitAdjustmentFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus budget times ${this.weight}`;
  }

  adjust(item: AdaptiveWaitAdjustment, value: number): number {
    return value + item.budget * this.weight;
  }
}

/** Runs the adaptive wait adjustment steps in order and keeps a trace of each. */
export class AdaptiveWaitAdjustmentEngine {
  steps: AdaptiveWaitAdjustmentFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveWaitAdjustmentFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveWaitAdjustment): number {
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

  evaluateAll(items: AdaptiveWaitAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveWaitAdjustmentEngine(flagsValue: flags.Registry): AdaptiveWaitAdjustmentEngine {
  return new AdaptiveWaitAdjustmentEngine(
    [
      new FlaggedAdaptiveWaitAdjustmentAdjuster(flagsValue, "adaptive-wait-adjustment-regional", 0.1),
      new PercentAdaptiveWaitAdjustmentAdjuster(1.5),
      new NameAdaptiveWaitAdjustmentAdjuster(
        new Map<string, number>([["online", 0.98], ["west", 0.99], ["central", 0.84]]),
      ),
      new MinimumAdaptiveWaitAdjustmentAdjuster(44.4),
      new CapAdaptiveWaitAdjustmentAdjuster(8428),
      new AdaptiveWaitAdjustmentBudgetOffsetAdjuster(0.39),
    ],
    [],
    2.9,
    33167.2,
  );
}
