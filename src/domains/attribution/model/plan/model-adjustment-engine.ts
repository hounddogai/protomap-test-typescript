import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ModelAdjustment } from "./model-adjustment.js";

/** One step of the model adjustment calculation. */
export interface ModelAdjustmentAdjuster {
  describe(): string;
  adjust(item: ModelAdjustment, value: number): number;
}

export class PercentModelAdjustmentAdjuster implements ModelAdjustmentAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ModelAdjustment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class CapModelAdjustmentAdjuster implements ModelAdjustmentAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ModelAdjustment, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class RoundingModelAdjustmentAdjuster implements ModelAdjustmentAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ModelAdjustment, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class FlaggedModelAdjustmentAdjuster implements ModelAdjustmentAdjuster {
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

  adjust(item: ModelAdjustment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredModelAdjustmentAdjuster implements ModelAdjustmentAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ModelAdjustment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the model adjustment steps in order and keeps a trace of each. */
export class ModelAdjustmentEngine {
  steps: ModelAdjustmentAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ModelAdjustmentAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: ModelAdjustment): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ModelAdjustment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultModelAdjustmentEngine(flagsValue: flags.Registry): ModelAdjustmentEngine {
  return new ModelAdjustmentEngine(
    [
      new PercentModelAdjustmentAdjuster(24.6),
      new CapModelAdjustmentAdjuster(1929),
      new RoundingModelAdjustmentAdjuster(0.05),
      new FlaggedModelAdjustmentAdjuster(flagsValue, "model-adjustment-regional", 8.4),
      new TieredModelAdjustmentAdjuster([789, 7062, 9118], [1.17, 0.86, 0.98]),
    ],
    [],
    4.8,
    86750,
  );
}
