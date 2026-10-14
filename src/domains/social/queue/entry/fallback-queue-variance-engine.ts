import * as flags from "../../../../kit/flags.js";
import { FallbackQueueVariance } from "./fallback-queue-variance.js";

/** One step of the fallback queue variance calculation. */
export interface FallbackQueueVarianceStep {
  describe(): string;
  adjust(item: FallbackQueueVariance, value: number): number;
}

export class TieredFallbackQueueVarianceAdjuster implements FallbackQueueVarianceStep {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: FallbackQueueVariance, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapFallbackQueueVarianceAdjuster implements FallbackQueueVarianceStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FallbackQueueVariance, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class FlaggedFallbackQueueVarianceAdjuster implements FallbackQueueVarianceStep {
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

  adjust(item: FallbackQueueVariance, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentFallbackQueueVarianceAdjuster implements FallbackQueueVarianceStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: FallbackQueueVariance, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the fallback queue variance steps in order and keeps a trace of each. */
export class FallbackQueueVarianceEngine {
  steps: FallbackQueueVarianceStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FallbackQueueVarianceStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FallbackQueueVariance): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: FallbackQueueVariance[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFallbackQueueVarianceEngine(flagsValue: flags.Registry): FallbackQueueVarianceEngine {
  return new FallbackQueueVarianceEngine(
    [
      new TieredFallbackQueueVarianceAdjuster([1232, 5099, 5116, 8115], [0.89, 0.95, 1.06, 0.96]),
      new CapFallbackQueueVarianceAdjuster(29480),
      new FlaggedFallbackQueueVarianceAdjuster(flagsValue, "fallback-queue-variance-rolling", 9.6),
      new PercentFallbackQueueVarianceAdjuster(19.9),
    ],
    [],
    1.1,
    28539.6,
  );
}
