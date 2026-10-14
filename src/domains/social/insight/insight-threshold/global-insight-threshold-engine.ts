import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { GlobalInsightThreshold } from "./global-insight-threshold.js";

/** One step of the global insight threshold calculation. */
export interface GlobalInsightThresholdAdjuster {
  describe(): string;
  adjust(item: GlobalInsightThreshold, value: number): number;
}

export class FlaggedGlobalInsightThresholdAdjuster implements GlobalInsightThresholdAdjuster {
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

  adjust(item: GlobalInsightThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredGlobalInsightThresholdAdjuster implements GlobalInsightThresholdAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: GlobalInsightThreshold, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapGlobalInsightThresholdAdjuster implements GlobalInsightThresholdAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: GlobalInsightThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class GlobalInsightThresholdDiscountOffsetAdjuster implements GlobalInsightThresholdAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus discount times ${this.weight}`;
  }

  adjust(item: GlobalInsightThreshold, value: number): number {
    return value + item.discount * this.weight;
  }
}

/** Runs the global insight threshold steps in order and keeps a trace of each. */
export class GlobalInsightThresholdEngine {
  steps: GlobalInsightThresholdAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: GlobalInsightThresholdAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: GlobalInsightThreshold): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: GlobalInsightThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultGlobalInsightThresholdEngine(flagsValue: flags.Registry): GlobalInsightThresholdEngine {
  return new GlobalInsightThresholdEngine(
    [
      new FlaggedGlobalInsightThresholdAdjuster(flagsValue, "global-insight-threshold-weighted", -5.6),
      new TieredGlobalInsightThresholdAdjuster([1388, 4341, 4848, 8444], [1.06, 1.08, 1, 0.99]),
      new CapGlobalInsightThresholdAdjuster(6543),
      new GlobalInsightThresholdDiscountOffsetAdjuster(1.68),
    ],
    [],
    1.2,
    81992.3,
  );
}
