import { WarmupThreshold } from "./warmup-threshold.js";

/** One step of the warmup threshold calculation. */
export interface WarmupThresholdFactor {
  describe(): string;
  adjust(item: WarmupThreshold, value: number): number;
}

export class CapWarmupThresholdAdjuster implements WarmupThresholdFactor {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: WarmupThreshold, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class WarmupThresholdBatchSizeOffsetAdjuster implements WarmupThresholdFactor {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus batch size times ${this.weight}`;
  }

  adjust(item: WarmupThreshold, value: number): number {
    return value + item.batchSize * this.weight;
  }
}

export class MinimumWarmupThresholdAdjuster implements WarmupThresholdFactor {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: WarmupThreshold, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentWarmupThresholdAdjuster implements WarmupThresholdFactor {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: WarmupThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the warmup threshold steps in order and keeps a trace of each. */
export class WarmupThresholdEngine {
  steps: WarmupThresholdFactor[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: WarmupThresholdFactor[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: WarmupThreshold): number {
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

  evaluateAll(items: WarmupThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultWarmupThresholdEngine(): WarmupThresholdEngine {
  return new WarmupThresholdEngine(
    [
      new CapWarmupThresholdAdjuster(15010),
      new WarmupThresholdBatchSizeOffsetAdjuster(1.71),
      new MinimumWarmupThresholdAdjuster(15.7),
      new PercentWarmupThresholdAdjuster(-15.8),
    ],
    [],
    3,
    61589.2,
  );
}
