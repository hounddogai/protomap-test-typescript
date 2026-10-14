import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelThreshold } from "./model-threshold.js";

/** One step of the model threshold calculation. */
export interface ModelThresholdAdjuster {
  describe(): string;
  adjust(item: ModelThreshold, value: number): number;
}

export class PercentModelThresholdAdjuster implements ModelThresholdAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class TieredModelThresholdAdjuster implements ModelThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapModelThresholdAdjuster implements ModelThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedModelThresholdAdjuster implements ModelThresholdAdjuster {
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

  adjust(item: ModelThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class ModelThresholdQuantityOffsetAdjuster implements ModelThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus quantity times ${this.weight}`;
  }

  adjust(item: ModelThreshold, value: number): number {
    return value + item.quantity * this.weight;
  }
}

export class MinimumModelThresholdAdjuster implements ModelThresholdAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ModelThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the model threshold steps in order and keeps a trace of each. */
export class ModelThresholdEngine {
  steps: ModelThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ModelThreshold): number {
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

  evaluateAll(items: ModelThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultModelThresholdEngine(flagsValue: flags.Registry): ModelThresholdEngine {
  return new ModelThresholdEngine(
    [
      new PercentModelThresholdAdjuster(18.2),
      new TieredModelThresholdAdjuster([1313, 5126, 5872, 8809], [0.93, 1.17, 1.19, 1]),
      new CapModelThresholdAdjuster(16704),
      new FlaggedModelThresholdAdjuster(flagsValue, "model-threshold-lenient", 7.7),
      new ModelThresholdQuantityOffsetAdjuster(1.88),
      new MinimumModelThresholdAdjuster(35.8),
    ],
    [],
    4.7,
    63376.8,
  );
}
