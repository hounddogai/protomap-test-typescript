import * as flags from "../../../../kit/flags.js";
import { AdaptiveQueueTarget } from "./adaptive-queue-target.js";

/** One step of the adaptive queue target calculation. */
export interface AdaptiveQueueTargetFactor {
  describe(): string;
  adjust(item: AdaptiveQueueTarget, value: number): number;
}

export class PercentAdaptiveQueueTargetAdjuster implements AdaptiveQueueTargetFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveQueueTarget, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedAdaptiveQueueTargetAdjuster implements AdaptiveQueueTargetFactor {
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

  adjust(item: AdaptiveQueueTarget, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class TieredAdaptiveQueueTargetAdjuster implements AdaptiveQueueTargetFactor {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: AdaptiveQueueTarget, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class CapAdaptiveQueueTargetAdjuster implements AdaptiveQueueTargetFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: AdaptiveQueueTarget, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumAdaptiveQueueTargetAdjuster implements AdaptiveQueueTargetFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: AdaptiveQueueTarget, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

/** Runs the adaptive queue target steps in order and keeps a trace of each. */
export class AdaptiveQueueTargetEngine {
  steps: AdaptiveQueueTargetFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveQueueTargetFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: AdaptiveQueueTarget): number {
    let current = item.weightedValue();
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

  evaluateAll(items: AdaptiveQueueTarget[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultAdaptiveQueueTargetEngine(flagsValue: flags.Registry): AdaptiveQueueTargetEngine {
  return new AdaptiveQueueTargetEngine(
    [
      new PercentAdaptiveQueueTargetAdjuster(21.5),
      new FlaggedAdaptiveQueueTargetAdjuster(flagsValue, "adaptive-queue-target-pending", -2.3),
      new TieredAdaptiveQueueTargetAdjuster([1462, 2250, 9135], [1.14, 0.85, 0.8]),
      new CapAdaptiveQueueTargetAdjuster(49111),
      new MinimumAdaptiveQueueTargetAdjuster(42.3),
    ],
    [],
    2.8,
    66629.1,
  );
}
